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

    // In-memory simulation state storage
    private final Map<UUID, SimulationContext> busContexts = new ConcurrentHashMap<>();

    private enum SimState {
        MOVING,
        BOARDING, // Paused at a stop
        RESTING   // Cool-down at terminus
    }

    @Getter @Setter
    private static class SimulationContext {
        private SimState state = SimState.MOVING;
        private int currentNodeIndex = 0;
        private double progressToNextNode = 0.0; // 0.0 to 1.0
        private LocalDateTime stateEntryTime = LocalDateTime.now();
        private double speedKmH = 40.0; // Default speed
        private boolean initialized = false; // Flag to randomize start position once
        private String routeKey; // The exact key used in RouteGeometryCache
    }

    @PostConstruct
    public void loadActiveBuses() {
        // Note: For persistent buses, we might not know the full route name on startup 
        // if it's not stored in the DB. In a real app, Bus entity should store routeName.
        // For this fix, we primarily rely on the dynamic addition via KafkaConsumerService.
        busService.getBusesByStatus(Status.ACTIVE).forEach(this::addBus);
    }

    public void addBus(Bus bus) {
        addBus(bus.getId(), bus.getLineCode()); // Fallback to lineCode if name unknown
    }

    public void addBus(BusResponse bus) {
        addBus(bus.getId(), bus.getLineCode());
    }
    
    public void addBus(UUID busId) {
        // Default behavior (might fail if key doesn't match cache, but needed for interface compat)
        // Ideally, we fetch the bus to get the lineCode
        try {
            BusResponse bus = busService.getBusById(busId);
            addBus(busId, bus.getLineCode());
        } catch (Exception e) {
            log.warn("Could not load bus {} for simulation", busId);
        }
    }

    /**
     * Add a bus to the simulator with a specific route key for geometry lookup
     */
    public void addBus(UUID busId, String routeKey) {
        if (busContexts.containsKey(busId)) return;
        
        SimulationContext ctx = new SimulationContext();
        ctx.setRouteKey(routeKey);
        // Randomize initial speed slightly for realism (30 - 50 km/h)
        ctx.setSpeedKmH(30 + random.nextDouble() * 20);
        busContexts.put(busId, ctx);
        log.info("Bus {} added to simulation engine on route '{}'", busId, routeKey);
    }

    @Scheduled(fixedRate = 1000) // 1 Hz Tick (Every 1 second)
    public void tick() {
        busContexts.forEach((busId, ctx) -> {
            try {
                BusResponse bus = busService.getBusById(busId);
                
                // Use the stored routeKey to fetch geometry, not just the short lineCode
                List<double[]> path = routeCache.getPath(ctx.getRouteKey());

                // Fallback: try lineCode if routeKey failed (legacy support)
                if (path == null || path.isEmpty()) {
                    path = routeCache.getPath(bus.getLineCode());
                }

                if (path == null || path.isEmpty()) {
                    // log.debug("No path found for bus {} (Key: {})", bus.getBusNumber(), ctx.getRouteKey());
                    return;
                }

                // 1. Initialization: Randomize Start Position
                if (!ctx.isInitialized()) {
                    int randomStartIndex = random.nextInt(path.size());
                    ctx.setCurrentNodeIndex(randomStartIndex);
                    ctx.setInitialized(true);
                    log.info("Bus {} initialized at random index {}/{}", bus.getBusNumber(), randomStartIndex, path.size());
                }

                switch (ctx.getState()) {
                    case MOVING:
                        handleMovingState(bus, ctx, path);
                        break;
                    case BOARDING:
                        handleBoardingState(bus, ctx, path);
                        break;
                    case RESTING:
                        handleRestingState(bus, ctx);
                        break;
                }

            } catch (Exception e) {
                log.error("Error in simulation tick for bus {}", busId, e);
                // Don't remove immediately to allow transient errors recovery
            }
        });
    }

    private void handleMovingState(BusResponse bus, SimulationContext ctx, List<double[]> path) {
        int currentIndex = ctx.getCurrentNodeIndex();
        int nextIndex = currentIndex + 1;

        // End of route reached? -> RESTING
        if (nextIndex >= path.size()) {
            enterState(ctx, SimState.RESTING);
            // log.info("Bus {} reached terminus. Entering RESTING state.", bus.getBusNumber());
            return;
        }

        // --- Physics Calculation ---
        double[] p1 = path.get(currentIndex);
        double[] p2 = path.get(nextIndex);
        
        double distanceMeters = calculateDistance(p1[0], p1[1], p2[0], p2[1]);
        
        if (distanceMeters < 1.0) {
            ctx.setCurrentNodeIndex(nextIndex);
            ctx.setProgressToNextNode(0.0);
            return;
        }

        double speedMetersPerSec = ctx.getSpeedKmH() * 1000.0 / 3600.0;
        double stepFraction = speedMetersPerSec / distanceMeters;

        // Move forward
        ctx.setProgressToNextNode(ctx.getProgressToNextNode() + stepFraction);

        // --- Arrival at Next Node ---
        if (ctx.getProgressToNextNode() >= 1.0) {
            ctx.setCurrentNodeIndex(nextIndex);
            ctx.setProgressToNextNode(0.0);

            // Check for Stop (heuristic)
            if (routeCache.isStop(ctx.getRouteKey(), nextIndex) && nextIndex != path.size() - 1) {
                enterState(ctx, SimState.BOARDING);
                publishUpdate(bus, p2[0], p2[1], 0.0); 
                return;
            }
        }

        // --- Interpolation Update ---
        double[] currentPos = interpolate(p1, p2, Math.min(ctx.getProgressToNextNode(), 1.0));
        publishUpdate(bus, currentPos[0], currentPos[1], ctx.getSpeedKmH());
    }

    private void handleBoardingState(BusResponse bus, SimulationContext ctx, List<double[]> path) {
        long secondsElapsed = ChronoUnit.SECONDS.between(ctx.getStateEntryTime(), LocalDateTime.now());
        
        if (secondsElapsed >= 5) {
            enterState(ctx, SimState.MOVING);
            ctx.setSpeedKmH(30 + random.nextDouble() * 20);
        }
    }

    private void handleRestingState(BusResponse bus, SimulationContext ctx) {
        long minutesElapsed = ChronoUnit.MINUTES.between(ctx.getStateEntryTime(), LocalDateTime.now());

        // Reduced resting time for demo purposes (1 minute instead of 10)
        if (minutesElapsed >= 1) {
            ctx.setCurrentNodeIndex(0);
            ctx.setProgressToNextNode(0.0);
            enterState(ctx, SimState.MOVING);
            log.info("Bus {} finished resting. Restarting route.", bus.getBusNumber());
        }
    }

    private void enterState(SimulationContext ctx, SimState newState) {
        ctx.setState(newState);
        ctx.setStateEntryTime(LocalDateTime.now());
    }

    private void publishUpdate(BusResponse bus, double lat, double lon, double speed) {
        producer.publishLocationUpdate(new BusLocationEvent(
                bus.getId().toString(), 
                bus.getBusNumber(), 
                bus.getLineCode(), // We still publish the short code for frontend display
                lat, 
                lon, 
                speed, 
                0.0, 
                LocalDateTime.now()
        ));
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; 
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c * 1000; 
    }

    private double[] interpolate(double[] p1, double[] p2, double fraction) {
        double lat = p1[0] + (p2[0] - p1[0]) * fraction;
        double lon = p1[1] + (p2[1] - p1[1]) * fraction;
        return new double[]{lat, lon};
    }
}