package com.urbanmove.common.model;

import com.urbanmove.common.enums.BusStatus;
import com.urbanmove.common.enums.BusType;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Abstract base class for Bus entity.
 * Contains common fields shared across all microservices.
 * Services can extend this class with service-specific fields.
 */
@MappedSuperclass
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public abstract class BaseBus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "bus_id")
    private UUID busId;

    @NotBlank(message = "Registration number is required")
    @Column(name = "registration_number", unique = true, nullable = false, length = 50)
    private String registrationNumber;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "bus_type", length = 30)
    private BusType busType;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private BusStatus status;

    @Column(name = "last_latitude", precision = 10, scale = 7)
    private Double lastLatitude;

    @Column(name = "last_longitude", precision = 11, scale = 7)
    private Double lastLongitude;

    @Column(name = "last_position_time")
    private LocalDateTime lastPositionTime;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = BusStatus.IN_SERVICE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isOperational() {
        return status != null && status.isOperational();
    }

    public boolean hasValidLocation() {
        return lastLatitude != null && lastLongitude != null
                && lastLatitude >= -90 && lastLatitude <= 90
                && lastLongitude >= -180 && lastLongitude <= 180;
    }
}
