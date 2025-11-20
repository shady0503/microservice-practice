package com.geolocation_service.Kafka;

import com.geolocation_service.Model.Bus;
import com.geolocation_service.Model.BusStatus;
import com.geolocation_service.Repository.BusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.util.Map;
import java.util.UUID;

/**
 * Kafka consumer for synchronizing bus data from bus-service.
 * Listens to bus lifecycle events (create, update, delete) and keeps
 * the geolocation service's bus data in sync.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BusLifecycleEventConsumer {

    private final BusRepository busRepository;

    @KafkaListener(topics = "bus.lifecycle.events", groupId = "geolocation-service-group")
    public void consumeBusLifecycleEvent(Map<String, String> event) {
        try {
            String eventType = event.get("eventType");
            String busIdStr = event.get("busId");
            UUID busId = UUID.fromString(busIdStr);

            log.info("Received {} event for bus {}", eventType, busId);

            switch (eventType) {
                case "CREATED" -> handleBusCreated(event, busId);
                case "UPDATED" -> handleBusUpdated(event, busId);
                case "DELETED" -> handleBusDeleted(busId);
                default -> log.warn("Unknown event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing bus lifecycle event: {}", e.getMessage(), e);
        }
    }

    private void handleBusCreated(Map<String, String> event, UUID busId) {
        // Check if bus already exists (idempotency)
        if (busRepository.existsById(busId)) {
            log.info("Bus {} already exists, skipping creation", busId);
            return;
        }

        Bus bus = new Bus();
        bus.setRegistrationNumber(event.get("registrationNumber"));
        bus.setCapacity(Integer.parseInt(event.get("capacity")));
        bus.setStatus(mapStatus(event.get("status")));
        bus.setCreatedAt(new Timestamp(System.currentTimeMillis()));

        busRepository.save(bus);
        log.info("Bus {} synchronized (created) in geolocation service", busId);
    }

    private void handleBusUpdated(Map<String, String> event, UUID busId) {
        Bus bus = busRepository.findById(busId).orElseGet(() -> {
            log.info("Bus {} not found locally, creating new record", busId);
            return new Bus();
        });

        bus.setRegistrationNumber(event.get("registrationNumber"));
        bus.setCapacity(Integer.parseInt(event.get("capacity")));
        bus.setStatus(mapStatus(event.get("status")));

        if (bus.getCreatedAt() == null) {
            bus.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        }

        busRepository.save(bus);
        log.info("Bus {} synchronized (updated) in geolocation service", busId);
    }

    private void handleBusDeleted(UUID busId) {
        if (busRepository.existsById(busId)) {
            busRepository.deleteById(busId);
            log.info("Bus {} synchronized (deleted) in geolocation service", busId);
        } else {
            log.info("Bus {} not found locally, nothing to delete", busId);
        }
    }

    /**
     * Map status from bus-service format to geolocation-service format.
     */
    private BusStatus mapStatus(String status) {
        return switch (status) {
            case "EN_SERVICE" -> BusStatus.IN_SERVICE;
            case "HORS_SERVICE" -> BusStatus.OUT_OF_SERVICE;
            case "EN_MAINTENANCE" -> BusStatus.MAINTENANCE;
            default -> {
                try {
                    yield BusStatus.valueOf(status);
                } catch (IllegalArgumentException e) {
                    log.warn("Unknown status {}, defaulting to AVAILABLE", status);
                    yield BusStatus.AVAILABLE;
                }
            }
        };
    }
}
