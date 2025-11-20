package com.urbanmove.common.dto;

import com.urbanmove.common.enums.BusStatus;
import com.urbanmove.common.enums.BusType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for creating a new Bus.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateBusDto {

    @NotBlank(message = "Registration number is required")
    private String registrationNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private BusType busType;

    private BusStatus status;

    private UUID driverId;

    private UUID currentRouteId;
}
