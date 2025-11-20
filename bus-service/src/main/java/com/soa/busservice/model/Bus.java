package com.soa.busservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Bus entity representing a vehicle in the fleet.
 * Managed with its own operational status and current route assignment.
 */
@Entity
@Table(name = "buses", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bus {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "bus_id")
    private UUID busId;

    @NotBlank(message = "Matricule is required")
    @Column(name = "matricule", unique = true, nullable = false, length = 50)
    private String matricule;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private BusStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "current_route_id", referencedColumnName = "route_id")
    private Route currentRoute;

    @Column(name = "last_latitude", precision = 10)
    private Double lastLatitude;

    @Column(name = "last_longitude", precision = 11)
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
            status = BusStatus.EN_SERVICE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
