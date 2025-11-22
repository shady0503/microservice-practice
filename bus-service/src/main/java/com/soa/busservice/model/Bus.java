package com.soa.busservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "buses")
public class Bus implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String busNumber;

    @Column(nullable = false)
    private String lineCode;

    @Column(nullable = false)
    private Integer capacity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status;

    // Geolocation fields
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double heading;

    private LocalDateTime lastLocationUpdate;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = Status.INACTIVE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void updateFrom(Bus other) {
        this.busNumber = other.getBusNumber();
        this.lineCode = other.getLineCode();
        this.capacity = other.getCapacity();
        this.status = other.getStatus();
        this.latitude = other.getLatitude();
        this.longitude = other.getLongitude();
        this.speed = other.getSpeed();
        this.heading = other.getHeading();
        this.lastLocationUpdate = other.getLastLocationUpdate();
        this.updatedAt = LocalDateTime.now();
    }
}
