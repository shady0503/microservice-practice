// src/main/java/com/trajets/model/Stop.java
package com.trajets.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "stops", indexes = {
    @Index(name = "idx_stop_coords", columnList = "latitude,longitude")
})
@Data
public class Stop {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(nullable = false)
    private Double latitude;
    
    @Column(nullable = false)
    private Double longitude;
    
    @Column(length = 500)
    private String address;
    
    @Column(length = 50)
    private String osmNodeId;
}