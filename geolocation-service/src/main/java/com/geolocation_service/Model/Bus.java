package com.geolocation_service.Model;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.sql.Timestamp;
import java.util.UUID;

@Table
@Entity
public class Bus {

    @Id
    @GeneratedValue
    private UUID id;


    private String registrationNumber;
    private int capacity;
    private Type type;
    private UUID driverId;
    private BusStatus status;
    private Timestamp createdAt;

    public Bus() {
    }
    public Bus(String registrationNumber, int capacity, Type type, UUID driverId, BusStatus status) {
        this.id = UUID.randomUUID();
        this.registrationNumber = registrationNumber;
        this.capacity = capacity;
        this.type = type;
        this.driverId = driverId;
        this.status = status;
        this.createdAt = new Timestamp(System.currentTimeMillis());
    }


    public UUID getId() {
        return id;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public int getCapacity() {
        return capacity;
    }

    public void setCapacity(int capacity) {
        this.capacity = capacity;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public UUID getDriverId() {
        return driverId;
    }

    public void setDriverId(UUID driverId) {
        this.driverId = driverId;
    }

    public BusStatus getStatus() {
        return status;
    }

    public void setStatus(BusStatus status) {
        this.status = status;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }
}
