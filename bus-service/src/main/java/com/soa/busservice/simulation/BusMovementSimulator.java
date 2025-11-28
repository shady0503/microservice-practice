package com.soa.busservice.simulation;

import com.soa.busservice.dto.BusResponse;
import com.soa.busservice.event.BusLocationEvent;
import com.soa.busservice.kafka.KafkaProducerService;
import com.soa.busservice.model.Bus;
import com.soa.busservice.model.Status;
import com.soa.busservice.service.BusService;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusMovementSimulator {

    private final BusService busService;
    private final KafkaProducerService producer;
    private final RouteGeometryCache routeCache;
    private final Random random = new Random();
    private final Map<UUID, SimulationContext> busContexts = new ConcurrentHashMap<>();

    private enum SimState {
        MOVING, BOARDING, RESTING
    }

    @Getter
    @Setter
    private static class SimulationContext {
        private SimState state = SimState.MOVING;
        private int currentNodeIndex = 0;
        private double progressToNextNode = 0.0;
        private LocalDateTime stateEntryTime = LocalDateTime.now();
        private double speedKmH = 40.0;
        private boolean initialized = false;
        private String routeKey;

        // Metadata
        private int occupancy = 0;
        private String nextStopName = "Terminus";
        private int nextStopIndex = -1;
    }

    @PostConstruct
    public void loadActiveBuses() {
        busService.getBusesByStatus(Status.ACTIVE).forEach(this::addBus);
    }

    public void addBus(Bus bus) {
        addBus(bus.getId(), bus.getLineCode());
    }

    public void addBus(BusResponse bus) {
        addBus(bus.getId(), bus.getLineCode());
    }

    public void addBus(UUID busId) {
        try {
            BusResponse bus = busService.getBusById(busId);
            addBus(busId, bus.getLineCode());
        } catch (Exception e) {
            log.warn("Could not load bus {}", busId);
        }
    }

    public void addBus(UUID busId, String routeKey) {
        if (busContexts.containsKey(busId))
            return;
        SimulationContext ctx = new SimulationContext();
        ctx.setRouteKey(routeKey);
        ctx.setSpeedKmH(30 + random.nextDouble() * 20);
        ctx.setOccupancy(random.nextInt(20));
        busContexts.put(busId, ctx);
    }

    @Scheduled(fixedRate = 1000)
    public void tick() {
        busContexts.forEach((busId, ctx) -> {
            try {
                BusResponse bus = busService.getBusById(busId);
                List<double[]> path = routeCache.getPath(ctx.getRouteKey());

                // If path not found, try to resolve a valid route key from the line code
                if (path == null) {
                    String resolvedKey = routeCache.getAnyRouteName(bus.getLineCode());
                    if (resolvedKey != null) {
                        ctx.setRouteKey(resolvedKey);
                        path = routeCache.getPath(resolvedKey);
                    }
                }

                if (path == null || path.isEmpty())
                    return;

                if (!ctx.isInitialized()) {
                    ctx.setCurrentNodeIndex(random.nextInt(path.size()));
                    ctx.setInitialized(true);
                    updateNextStop(ctx, path);
                }

                switch (ctx.getState()) {
                    case MOVING -> handleMovingState(bus, ctx, path);
                    case BOARDING -> handleBoardingState(bus, ctx);
                    case RESTING -> handleRestingState(bus, ctx);
                }
            } catch (Exception e) {
                log.error("Sim Error", e);
            }
        });
    }

    private void updateNextStop(SimulationContext ctx, List<double[]> path) {
        int lookAhead = ctx.getCurrentNodeIndex() + 1;
        while (lookAhead < path.size()) {
            if (routeCache.isStop(ctx.getRouteKey(), lookAhead)) {
                ctx.setNextStopIndex(lookAhead);
                ctx.setNextStopName(routeCache.getStopName(ctx.getRouteKey(), lookAhead));
                return;
            }
            lookAhead++;
        }
        ctx.setNextStopName("Terminus");
        ctx.setNextStopIndex(path.size() - 1);
    }

    private String calculateEta(SimulationContext ctx, List<double[]> path) {
        if (ctx.getNextStopIndex() <= ctx.getCurrentNodeIndex())
            return "Arriving";

        // Calculate distance along the path (sum of segments)
        double totalDistanceMeters = 0.0;
        for (int i = ctx.getCurrentNodeIndex(); i < ctx.getNextStopIndex(); i++) {
            double[] p1 = path.get(i);
            double[] p2 = path.get(i + 1);
            // Haversine-like approximation for short distances (Euclidean on lat/lon *
            // meters per degree)
            // 111,000 meters per degree is a rough approximation but sufficient here
            double dist = Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2)) * 111000;
            totalDistanceMeters += dist;
        }

        // Use a stable average speed for ETA (e.g., 30 km/h) mixed with current speed
        // This prevents ETA from jumping wildly if the bus momentarily stops or speeds
        // up
        double avgSpeedKmH = (ctx.getSpeedKmH() + 30.0) / 2.0;
        double speedMs = Math.max(1.0, avgSpeedKmH / 3.6);

        int seconds = (int) (totalDistanceMeters / speedMs);
        int min = seconds / 60;

        if (min < 1)
            return "< 1 min";
        return min + " min";
    }

    private void handleMovingState(BusResponse bus, SimulationContext ctx, List<double[]> path) {
        int nextIndex = ctx.getCurrentNodeIndex() + 1;
        if (nextIndex >= path.size()) {
            enterState(ctx, SimState.RESTING);
            return;
        }

        // Move logic (simplified)
        ctx.setProgressToNextNode(ctx.getProgressToNextNode() + 0.2); // Fast jump for demo

        if (ctx.getProgressToNextNode() >= 1.0) {
            ctx.setCurrentNodeIndex(nextIndex);
            ctx.setProgressToNextNode(0.0);
            updateNextStop(ctx, path);

            if (routeCache.isStop(ctx.getRouteKey(), nextIndex)) {
                enterState(ctx, SimState.BOARDING);
                // Update occupancy
                ctx.setOccupancy(Math.max(0, Math.min(50, ctx.getOccupancy() + random.nextInt(5) - 2)));
                publishUpdate(bus, ctx, path);
                return;
            }
        }
        publishUpdate(bus, ctx, path);
    }

    private void handleBoardingState(BusResponse bus, SimulationContext ctx) {
        if (ChronoUnit.SECONDS.between(ctx.getStateEntryTime(), LocalDateTime.now()) > 3) {
            enterState(ctx, SimState.MOVING);
        }
    }

    private void handleRestingState(BusResponse bus, SimulationContext ctx) {
        if (ChronoUnit.SECONDS.between(ctx.getStateEntryTime(), LocalDateTime.now()) > 10) {
            ctx.setCurrentNodeIndex(0);
            ctx.setOccupancy(0);
            enterState(ctx, SimState.MOVING);
        }
    }

    private void enterState(SimulationContext ctx, SimState newState) {
        ctx.setState(newState);
        ctx.setStateEntryTime(LocalDateTime.now());
    }

    private void publishUpdate(BusResponse bus, SimulationContext ctx, List<double[]> path) {
        double[] p = path.get(ctx.getCurrentNodeIndex());
        producer.publishLocationUpdate(new BusLocationEvent(
                bus.getId().toString(), bus.getBusNumber(), bus.getLineCode(),
                p[0], p[1], ctx.getSpeedKmH(), 0.0,
                50, ctx.getOccupancy(), ctx.getNextStopName(), calculateEta(ctx, path),
                LocalDateTime.now()));
    }
}