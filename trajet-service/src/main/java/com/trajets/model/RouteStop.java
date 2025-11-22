// src/main/java/com/trajets/model/RouteStop.java
package com.trajets.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "route_stops")
@Data
public class RouteStop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stop_id", nullable = false)
    private Stop stop;
    
    @Column(nullable = false)
    private Integer stopOrder; // 1-based ordering
}