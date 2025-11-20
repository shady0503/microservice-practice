package com.soa.busservice.dto.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Outgoing Kafka event for bus location updates (bus.location.updates topic).
 * Enriched position data sent to other services.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusLocationUpdateEvent {
    
    private String busId;
    private String routeId;
    private Double latitude;
    private Double longitude;
    private LocalDateTime timestamp;
    private Integer delayInMinutes;
}
