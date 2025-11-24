// src/main/java/com/trajets/model/Line.java
package com.trajets.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "lines")
@Data
public class Line {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String ref; // e.g., "32H", "L01"
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(length = 50)
    private String osmRelationId; // The OSM relation ID used
    
    @Column(columnDefinition = "TEXT")
    private String metadata; // JSON: operator, color, etc.
    
    private LocalDateTime importedAt;
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        importedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}