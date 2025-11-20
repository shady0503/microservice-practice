package com.soa.busservice.dto;

import com.soa.busservice.model.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusResponse {
    private UUID id;
    private String busNumber;
    private String lineCode;
    private Integer capacity;
    private Status status;
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double heading;
    private LocalDateTime lastLocationUpdate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
