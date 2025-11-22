package com.soa.busservice.dto;

import com.soa.busservice.model.Status;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusRequest {
    @NotBlank(message = "Bus number is required")
    private String busNumber;

    @NotBlank(message = "Line code is required")
    private String lineCode;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    private Status status;

    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double heading;
}
