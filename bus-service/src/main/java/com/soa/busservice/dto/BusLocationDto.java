package com.soa.busservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for bus location information (last known position).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusLocationDto {
    
    private UUID busId;
    private String matricule;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private LocalDateTime timestamp;
}
