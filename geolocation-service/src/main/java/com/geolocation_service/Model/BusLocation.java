package com.geolocation_service.Model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.sql.Timestamp;
import java.util.UUID;

@Table
@Entity
public class BusLocation {

    @Id
    @GeneratedValue
    private UUID id;

    private UUID busId;

    private Double latitude;
    private Double longitude;
    private Double speedKMH;
    private Double heading;
    private Timestamp createdAt;


    public BusLocation(UUID busId, Double latitude, Double longitude, Double speedKMH, Double heading) {
        this.id = UUID.randomUUID();
        this.busId = busId;
        this.latitude = latitude;
        this.longitude = longitude;
        this.speedKMH = speedKMH;
        this.heading = heading;
        this.createdAt = new Timestamp(System.currentTimeMillis());
    }

    public BusLocation() {

    }

    public UUID getId() {
        return this.id;
    }

    public UUID getBusId() {
        return busId;
    }

    public void setBusId(UUID busId) {
        this.busId = busId;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getSpeedKMH() {
        return speedKMH;
    }

    public void setSpeedKMH(Double speedKMH) {
        this.speedKMH = speedKMH;
    }

    public Double getHeading() {
        return heading;
    }

    public void setHeading(Double heading) {
        this.heading = heading;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }
}
