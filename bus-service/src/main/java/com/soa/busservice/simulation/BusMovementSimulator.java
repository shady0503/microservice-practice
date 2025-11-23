package com.soa.busservice.simulation;

import com.soa.busservice.dto.BusResponse;
import com.soa.busservice.event.BusLocationEvent;
import com.soa.busservice.kafka.KafkaProducerService;
import com.soa.busservice.model.Bus;
import com.soa.busservice.model.Status;
import com.soa.busservice.service.BusService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class BusMovementSimulator {

    private final BusService busService;
    private final KafkaProducerService producer;
    private final RouteGeometryCache routeCache;

    // In-memory state for high performance
    private final Map<UUID, Integer> busIndex = new ConcurrentHashMap<>();
    private final Map<UUID, Boolean> busDirection = new ConcurrentHashMap<>();

    @PostConstruct
    public void loadActiveBuses() {
        // Recover simulation state from DB on startup
        busService.getBusesByStatus(Status.ACTIVE).forEach(bus -> {
            busIndex.put(bus.getId(), 0);
            busDirection.put(bus.getId(), true);
        });
    }

    public void addBus(Bus bus) {
        busIndex.put(bus.getId(), 0);
        busDirection.put(bus.getId(), true);
    }

    @Scheduled(fixedRate = 1000)
    public void moveBuses() {
        busIndex.keySet().forEach(busId -> {
            try {
                // FIX: Changed type from 'Bus' to 'BusResponse'
                BusResponse bus = busService.getBusById(busId);
                List<double[]> path = routeCache.getPath(bus.getLineCode());

                if (path != null && !path.isEmpty()) {
                    int idx = busIndex.getOrDefault(busId, 0);
                    boolean forward = busDirection.getOrDefault(busId, true);

                    // Calculate next position
                    if (forward) {
                        if (++idx >= path.size()) { idx = path.size() - 2; forward = false; }
                    } else {
                        if (--idx < 0) { idx = 1; forward = true; }
                    }

                    // Update memory state
                    busIndex.put(busId, idx);
                    busDirection.put(busId, forward);

                    // Stream update
                    double[] coords = path.get(idx);
                    producer.publishLocationUpdate(new BusLocationEvent(
                        bus.getId().toString(), bus.getBusNumber(), bus.getLineCode(),
                        coords[0], coords[1], 45.0, 0.0, LocalDateTime.now()
                    ));
                }
            } catch (Exception e) {
                // This handles cases where a bus might have been deleted
                log.warn("Skipping update for bus {}", busId);
            }
        });
    }
}