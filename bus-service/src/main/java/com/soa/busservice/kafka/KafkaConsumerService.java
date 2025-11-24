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
    private final BusMovementSimulator simulator;
    private final Random random = new Random();

    @KafkaListener(topics = "line.changes", groupId = "bus-service-group")
    public void consumeLineChange(String message) {
        try {
            Map<String, Object> payload = objectMapper.readValue(message, new TypeReference<Map<String, Object>>() {});
            String changeType = (String) payload.get("changeType");
            String lineCode = (String) payload.get("lineCode");
            log.info("Processed line change event: {} for line {}", changeType, lineCode);
        } catch (Exception e) {
            log.error("Error processing line change event: {}", message, e);
        }
    }

    @KafkaListener(topics = "route-created", groupId = "bus-service-group")
    public void consumeRouteCreatedEvent(String payload) {
        try {
            RouteCreatedEvent event = objectMapper.readValue(payload, RouteCreatedEvent.class);
            log.info("New Route Received: {}", event.getRouteName());

            // 1. Cache Geometry
            routeCache.cacheRoute(event.getRouteName(), event.getGeometry());

            // 2. Deploy Simulation Buses
            int count = 2; 

            for (int i = 0; i < count; i++) {
                Bus bus = new Bus();
                String busNumber = event.getRouteName().split(":")[0].trim() 
                        + "-BUS-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
                
                if (busService.getAllBuses().stream().anyMatch(b -> b.getBusNumber().equals(busNumber))) {
                    continue;
                }

                bus.setBusNumber(busNumber);
                bus.setLineCode(event.getRouteName());
                bus.setCapacity(50);
                bus.setStatus(Status.ACTIVE);
                
                // Set Random Start Position
                List<double[]> path = routeCache.getPath(event.getRouteName());
                if (path != null && !path.isEmpty()) {
                    int randomStart = random.nextInt(path.size());
                    bus.setLatitude(path.get(randomStart)[0]);
                    bus.setLongitude(path.get(randomStart)[1]);
                }

                try {
                    busService.saveBusWithRetry(bus);
                    simulator.addBus(bus.getId());
                    log.info("Deployed bus {} on route {}", busNumber, event.getRouteName());
                } catch (Exception ex) {
                    log.warn("Could not deploy bus: {}", ex.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Failed to process route event: {}", e.getMessage());
        }
    }
}