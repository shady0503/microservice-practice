package com.soa.busservice.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.soa.busservice.event.RouteCreatedEvent;
import com.soa.busservice.model.Bus;
import com.soa.busservice.model.Status;
import com.soa.busservice.service.BusService;
import com.soa.busservice.simulation.BusMovementSimulator;
import com.soa.busservice.simulation.RouteGeometryCache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final BusService busService;
    private final ObjectMapper objectMapper;
    private final RouteGeometryCache routeCache;
    private final BusMovementSimulator simulator;
    private final Random random = new Random();

    @KafkaListener(topics = "route-created", groupId = "bus-service-group")
    public void consumeRouteCreatedEvent(String payload) {
        try {
            RouteCreatedEvent event = objectMapper.readValue(payload, RouteCreatedEvent.class);
            log.info("New Route Received: {}", event.getRouteName());

            // 1. Cache Geometry using the FULL name (key for simulator)
            routeCache.cacheRoute(event.getRouteName(), event.getGeometry());

            // 2. Extract clean line code (e.g., "L32H: Name..." -> "L32H")
            String fullRouteName = event.getRouteName();
            String cleanLineCode = fullRouteName.contains(":") 
                    ? fullRouteName.split(":")[0].trim() 
                    : fullRouteName;

            // 3. Deploy Simulation Buses
            int count = 2; // Buses per route

            for (int i = 0; i < count; i++) {
                // Check to avoid duplicate buses on restart
                String busNumberPrefix = cleanLineCode + "-BUS-";
                
                // Simple check if we already have buses for this line to prevent flooding on restart
                if (busService.getBusesByLineCode(cleanLineCode).size() >= count) {
                    continue;
                }

                String busNumber = busNumberPrefix + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

                Bus bus = new Bus();
                bus.setBusNumber(busNumber);
                // CRITICAL: Use clean code "L7" instead of full name for matching
                bus.setLineCode(cleanLineCode); 
                bus.setCapacity(50);
                bus.setStatus(Status.ACTIVE);
                
                // Set Random Start Position
                List<double[]> path = routeCache.getPath(fullRouteName);
                if (path != null && !path.isEmpty()) {
                    int randomStart = random.nextInt(path.size());
                    bus.setLatitude(path.get(randomStart)[0]);
                    bus.setLongitude(path.get(randomStart)[1]);
                }

                try {
                    busService.saveBusWithRetry(bus);
                    simulator.addBus(bus.getId());
                    log.info("Deployed bus {} on route {} (Ref: {})", busNumber, fullRouteName, cleanLineCode);
                } catch (Exception ex) {
                    log.warn("Could not deploy bus: {}", ex.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Failed to process route event: {}", e.getMessage());
        }
    }
}