// src/main/java/com/trajets/model/Route.java
package com.trajets.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "routes")
@Data
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Line line;

    @Column(nullable = false, length = 255)
    private String name; // e.g., "Harhoura → Bab El Had"

    @Column(columnDefinition = "TEXT")
    private String geometry; // GeoJSON LineString

    @Column(length = 20)
    private String direction; // GOING, RETURN, CIRCULAR
}