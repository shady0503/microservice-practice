package com.soa.busservice.dto;

import com.soa.busservice.model.BusStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating and updating bus information via REST API.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateBusDto {
    
    @NotBlank(message = "Matricule is required")
    private String matricule;
    
    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
    
    @NotNull(message = "Status is required")
    private BusStatus status;
    
    // Optional: Route assignment during creation
    private String currentRouteId;
}
