package com.urbanmove.common.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.urbanmove.common.enums.BusStatus;
import com.urbanmove.common.enums.BusType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Common DTO for Bus entity.
 * Used for API responses and inter-service communication.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BusDto {

    private UUID busId;

    private String registrationNumber;

    private Integer capacity;

    private BusType busType;

    private BusStatus status;

    private UUID driverId;

    private UUID currentRouteId;

    private String routeName;

    private Double lastLatitude;

    private Double lastLongitude;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime lastPositionTime;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedAt;
}
