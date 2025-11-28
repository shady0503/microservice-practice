package com.soa.busservice.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusLocationEvent implements Serializable {
    private String busId;
    private String busNumber;
    private String lineCode;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double heading;
    
    // New Metadata
    private Integer capacity;
    private Integer occupancy;
    private String nextStop;
    private String estimatedArrival;
    
    private LocalDateTime timestamp;
}