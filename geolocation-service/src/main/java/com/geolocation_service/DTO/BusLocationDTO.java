package com.geolocation_service.DTO;

import java.sql.Timestamp;
import java.util.UUID;

public record BusLocationDTO(
        UUID id,
        UUID busId,
        Double latitude,
        Double longitude,
        Double speedKMH,
        Double heading,
        Timestamp createdAt
) {
}