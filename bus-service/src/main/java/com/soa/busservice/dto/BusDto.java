package com.soa.busservice.dto;

import com.soa.busservice.model.BusStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning bus information via REST API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusDto {
    
    private UUID busId;
    private String matricule;
    private Integer capacity;
    private BusStatus status;
    private String currentRouteId;
    private Double lastLatitude;
    private Double lastLongitude;
    private LocalDateTime lastPositionTime;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
