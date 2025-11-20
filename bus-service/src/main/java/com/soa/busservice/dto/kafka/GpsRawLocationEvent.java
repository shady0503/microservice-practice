package com.soa.busservice.dto.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Incoming Kafka event from GPS devices (gps.raw.locations topic).
 * Represents raw GPS coordinates with metadata.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GpsRawLocationEvent {
    
    private String busId;
    private String busMatricule;
    private String lineNumber;
    private String routeName;
    private String routeId;
    private String direction; // GOING, RETURN, CIRCULAR
    private Integer busCapacity;
    private String busStatus;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private LocalDateTime timestamp;
    private List<List<Double>> routeGeometry; // [[lat, lon], [lat, lon], ...]
}
