package com.soa.busservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * BusLocationHistory entity storing GPS position records for historical tracking.
 * Each record represents a GPS update received and processed for a specific bus.
 */
@Entity
@Table(name = "bus_location_history", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusLocationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "location_id")
    private UUID locationId;

    @NotNull(message = "Bus ID is required")
    @Column(name = "bus_id", nullable = false)
    private UUID busId;

    @NotNull(message = "Timestamp is required")
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @NotNull(message = "Latitude is required")
    @Column(name = "latitude", nullable = false, precision = 10)
    private Double latitude;

    @NotNull(message = "Longitude is required")
    @Column(name = "longitude", nullable = false, precision = 11)
    private Double longitude;

    @Column(name = "speed", precision = 6)
    private Double speed;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
