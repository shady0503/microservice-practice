package com.geolocation_service.DTO;

import com.geolocation_service.Model.BusStatus;
import com.geolocation_service.Model.Type;

import java.sql.Timestamp;
import java.util.UUID;

public record BusDTO(
        UUID id,
        String registrationNumber,
        int capacity,
        Type type,
        UUID driverId,
        BusStatus status,
        Timestamp createdAt
) {
}