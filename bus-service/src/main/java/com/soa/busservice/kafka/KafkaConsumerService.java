package com.soa.busservice.kafka;

import com.soa.busservice.event.RouteCreatedEvent;
import com.soa.busservice.model.Bus;
import com.soa.busservice.model.Status;
import com.soa.busservice.service.BusService;
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

    @KafkaListener(topics = "line.changes", groupId = "bus-service-group")
    public void consumeLineChange(Map<String, Object> message) {
        try {
            String changeType = (String) message.get("changeType");
            String lineCode = (String) message.get("lineCode");
            String lineName = (String) message.get("lineName");
            
            log.info("Received line change event: {} for line {} ({})", changeType, lineCode, lineName);
            
            switch (changeType) {
                case "DELETED":
                    log.warn("Line {} has been deleted. Buses on this line should be reassigned.", lineCode);
                    // TODO: Alert system or mark buses on this line for review
                    break;
                case "UPDATED":
                    log.info("Line {} has been updated. Bus assignments may need review.", lineCode);
                    // TODO: Check if lineCode changed and update buses accordingly
                    break;
                case "CREATED":
                    log.info("New line {} created and available for bus assignment.", lineCode);
                    break;
                default:
                    log.warn("Unknown change type: {}", changeType);
            }
            
        } catch (Exception e) {
            log.error("Error processing line change event", e);
        }
    }

    @KafkaListener(topics = "route-created", groupId = "bus-service-group")
    public void consumeRouteCreatedEvent(RouteCreatedEvent event) {
        log.info("Received RouteCreatedEvent: {}", event);

        // Generate random buses for the route
        Random random = new Random();
        int numberOfBuses = random.nextInt(4) + 2; // Create 2 to 5 buses per route
        List<Bus> buses = new ArrayList<>();

        for (int i = 0; i < numberOfBuses; i++) {
            Bus bus = new Bus();
            bus.setId(UUID.randomUUID());
            bus.setBusNumber("Bus-" + UUID.randomUUID().toString().substring(0, 8));
            bus.setLineCode(event.getRouteName());
            bus.setCapacity(random.nextInt(50) + 20); // Capacity between 20 and 70
            bus.setStatus(Status.ACTIVE);

            // Randomize initial geolocation
            bus.setLatitude(40.0 + random.nextDouble());
            bus.setLongitude(-74.0 + random.nextDouble());
            bus.setSpeed(random.nextDouble() * 50); // Speed between 0 and 50 km/h
            bus.setHeading(random.nextDouble() * 360); // Heading in degrees

            buses.add(bus);
        }

        // Save buses to the database using the retry mechanism
        buses.forEach(busService::saveBusWithRetry);
        log.info("Created {} buses for route: {}", numberOfBuses, event.getRouteName());
    }
}
