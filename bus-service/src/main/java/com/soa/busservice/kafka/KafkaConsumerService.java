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

            routeCache.cacheRoute(event.getRouteName(), event.getGeometry());

            String fullRouteName = event.getRouteName();
            String cleanLineCode = fullRouteName.contains(":") 
                    ? fullRouteName.split(":")[0].trim() 
                    : fullRouteName;

            // UPDATE: Increased to 5 buses per route direction
            int count = 5; 

            for (int i = 0; i < count; i++) {
                // Use unique prefixes to allow multiple buses per line
                String busNumber = cleanLineCode + "-BUS-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();

                // Skip if we already have enough buses for this line (optional check)
                if (busService.getBusesByLineCode(cleanLineCode).size() >= (count * 2)) {
                    // log.info("Enough buses for line {}", cleanLineCode);
                    // continue; // Commented out to force new simulation buses
                }

                Bus bus = new Bus();
                bus.setBusNumber(busNumber);
                bus.setLineCode(cleanLineCode); 
                bus.setCapacity(50);
                bus.setStatus(Status.ACTIVE);
                
                // Random start position
                List<double[]> path = routeCache.getPath(fullRouteName);
                if (path != null && !path.isEmpty()) {
                    int randomStart = random.nextInt(path.size());
                    bus.setLatitude(path.get(randomStart)[0]);
                    bus.setLongitude(path.get(randomStart)[1]);
                }

                try {
                    busService.saveBusWithRetry(bus);
                    // Pass full route name to simulator
                    simulator.addBus(bus.getId(), fullRouteName);
                    log.info("Deployed bus {} on route {}", busNumber, fullRouteName);
                } catch (Exception ex) {
                    log.warn("Could not deploy bus: {}", ex.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Failed to process route event: {}", e.getMessage());
        }
    }
}