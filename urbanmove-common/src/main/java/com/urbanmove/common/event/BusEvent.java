package com.urbanmove.common.event;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.urbanmove.common.enums.BusStatus;
import com.urbanmove.common.enums.BusType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Base event for bus-related changes.
 * Used for inter-service communication via Kafka.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusEvent {

    public enum EventType {
        BUS_CREATED,
        BUS_UPDATED,
        BUS_DELETED,
        BUS_STATUS_CHANGED,
        BUS_LOCATION_UPDATED
    }

    private EventType eventType;

    private UUID busId;

    private String registrationNumber;

    private Integer capacity;

    private BusType busType;

    private BusStatus status;

    private BusStatus previousStatus;

    private UUID driverId;

    private UUID currentRouteId;

    private Double latitude;

    private Double longitude;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    private String serviceName;

    public static BusEvent createEvent(UUID busId, String registrationNumber,
                                       Integer capacity, BusType busType,
                                       BusStatus status, String serviceName) {
        return BusEvent.builder()
                .eventType(EventType.BUS_CREATED)
                .busId(busId)
                .registrationNumber(registrationNumber)
                .capacity(capacity)
                .busType(busType)
                .status(status)
                .timestamp(LocalDateTime.now())
                .serviceName(serviceName)
                .build();
    }

    public static BusEvent updateEvent(UUID busId, String registrationNumber,
                                       Integer capacity, BusType busType,
                                       BusStatus status, String serviceName) {
        return BusEvent.builder()
                .eventType(EventType.BUS_UPDATED)
                .busId(busId)
                .registrationNumber(registrationNumber)
                .capacity(capacity)
                .busType(busType)
                .status(status)
                .timestamp(LocalDateTime.now())
                .serviceName(serviceName)
                .build();
    }

    public static BusEvent deleteEvent(UUID busId, String serviceName) {
        return BusEvent.builder()
                .eventType(EventType.BUS_DELETED)
                .busId(busId)
                .timestamp(LocalDateTime.now())
                .serviceName(serviceName)
                .build();
    }

    public static BusEvent statusChangeEvent(UUID busId, BusStatus previousStatus,
                                            BusStatus newStatus, String serviceName) {
        return BusEvent.builder()
                .eventType(EventType.BUS_STATUS_CHANGED)
                .busId(busId)
                .previousStatus(previousStatus)
                .status(newStatus)
                .timestamp(LocalDateTime.now())
                .serviceName(serviceName)
                .build();
    }

    public static BusEvent locationUpdateEvent(UUID busId, Double latitude,
                                              Double longitude, String serviceName) {
        return BusEvent.builder()
                .eventType(EventType.BUS_LOCATION_UPDATED)
                .busId(busId)
                .latitude(latitude)
                .longitude(longitude)
                .timestamp(LocalDateTime.now())
                .serviceName(serviceName)
                .build();
    }
}
