package com.soa.busservice.kafka;

import com.fasterxml.jackson.core.type.TypeReference;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumerService {

    private final BusService busService;
    private final ObjectMapper objectMapper;
    private final RouteGeometryCache routeCache;
    private final BusMovementSimulator simulator; // Inject ObjectMapper for JSON parsing

    // Listener for general line changes (updates/deletes)
    // Updated to accept String and parse manually to avoid conversion errors
    @KafkaListener(topics = "line.changes", groupId = "bus-service-group")
    public void consumeLineChange(String message) {
        try {
            log.info("Received line change payload: {}", message);
            
            // Manually parse JSON String to Map
            Map<String, Object> payload = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {});
            
            String changeType = (String) payload.get("changeType");
            String lineCode = (String) payload.get("lineCode");
            
            log.info("Processed line change event: {} for line {}", changeType, lineCode);
            
            if ("DELETED".equals(changeType)) {
                log.warn("Line {} deleted. Buses may need reassignment.", lineCode);
            }
        } catch (Exception e) {
            log.error("Error processing line change event: {}", message, e);
        }
    }

    // Listener that creates buses when a new route appears
    // Updated to accept String and parse manually
@KafkaListener(topics = "route-created", groupId = "bus-service-group")
    public void consumeRouteCreatedEvent(String payload) {
        try {
            RouteCreatedEvent event = objectMapper.readValue(payload, RouteCreatedEvent.class);
            log.info("New Route: {}", event.getRouteName());

            // 1. Cache Geometry
            routeCache.cacheRoute(event.getRouteName(), event.getGeometry());

            // 2. Create Buses
            Random rand = new Random();
            int count = rand.nextInt(3) + 2; // 2-4 buses

            for (int i = 0; i < count; i++) {
                Bus bus = new Bus();
                bus.setBusNumber("BUS-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
                bus.setLineCode(event.getRouteName());
                bus.setCapacity(50);
                bus.setStatus(Status.ACTIVE);
                
                // Initialize position (Start of route or default)
                List<double[]> path = routeCache.getPath(event.getRouteName());
                double[] start = (path != null && !path.isEmpty()) ? path.get(0) : new double[]{34.0, -6.8};
                bus.setLatitude(start[0]);
                bus.setLongitude(start[1]);

                // Persist & Activate Simulation
                busService.saveBusWithRetry(bus);
                simulator.addBus(bus);
            }
            log.info("Deployed {} buses on route {}", count, event.getRouteName());

        } catch (Exception e) {
            log.error("Failed to process route event: {}", e.getMessage());
        }
    }}