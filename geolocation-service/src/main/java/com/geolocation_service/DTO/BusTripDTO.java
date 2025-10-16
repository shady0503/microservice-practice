package com.geolocation_service.DTO;

import com.geolocation_service.Model.TripStatus;

import java.sql.Timestamp;
import java.util.UUID;

public record BusTripDTO(
        UUID id,
        UUID busId,
        UUID routeId,
        UUID scheduleId,
        Timestamp startTime,
        Timestamp endTime,
        TripStatus status,
        int passengersCount,
        Timestamp createdAt
) {
}