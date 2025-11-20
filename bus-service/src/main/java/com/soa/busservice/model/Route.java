package com.soa.busservice.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Route entity representing a bus line/route.
 * Contains information about the route's origin, destination, line number, and geometry from OpenStreetMap.
 */
@Entity
@Table(name = "routes", schema = "public")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "route_id")
    private UUID routeId;

    @NotBlank(message = "Line number is required")
    @Column(name = "line_number", unique = true, nullable = false, length = 20)
    private String lineNumber;

    @NotBlank(message = "Route name is required")
    @Column(name = "route_name", nullable = false, length = 200)
    private String routeName;

    @Column(name = "origin", length = 100)
    private String origin;

    @Column(name = "destination", length = 100)
    private String destination;

    @Column(name = "route_type", length = 50)
    private String routeType; // STRUCTURANTE, INTERCOMMUNALE, INTERNE_RABAT, INTERNE_SALE, INTERNE_TEMARA, SPECIALE

    @Column(name = "direction", length = 20)
    private String direction; // GOING, RETURN, CIRCULAR

    @Column(name = "is_active")
    private Boolean isActive;
    
    @Column(name = "geometry", columnDefinition = "TEXT")
    private String geometry; // JSON string of coordinates: [[lat, lon], [lat, lon], ...]
    
    @Column(name = "osm_relation_id")
    private Long osmRelationId; // OpenStreetMap relation ID for reference

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) {
            isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}