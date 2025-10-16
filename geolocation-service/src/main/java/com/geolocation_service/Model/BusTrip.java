package com.geolocation_service.Model;


import jakarta.persistence.*;

import java.sql.Timestamp;
import java.util.UUID;

@Table
@Entity
public class BusTrip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    private UUID busId;
    private UUID routeId;
    private UUID scheduleId;

    private Timestamp startTime;
    private Timestamp endTime;

    private TripStatus status;

    private int passengersCount;

    private Timestamp createdAt;

    public BusTrip(UUID busId, UUID routeId, UUID scheduleId, Timestamp startTime, Timestamp endTime, TripStatus status, int passengersCount) {
        this.id = UUID.randomUUID();
        this.busId = busId;
        this.routeId = routeId;
        this.scheduleId = scheduleId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.passengersCount = passengersCount;
        this.createdAt = new Timestamp(System.currentTimeMillis());
    }

    public BusTrip() {

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

    public UUID getRouteId() {
        return routeId;
    }

    public void setRouteId(UUID routeId) {
        this.routeId = routeId;
    }

    public UUID getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(UUID scheduleId) {
        this.scheduleId = scheduleId;
    }

    public Timestamp getStartTime() {
        return startTime;
    }

    public void setStartTime(Timestamp startTime) {
        this.startTime = startTime;
    }

    public Timestamp getEndTime() {
        return endTime;
    }

    public void setEndTime(Timestamp endTime) {
        this.endTime = endTime;
    }

    public TripStatus getStatus() {
        return status;
    }

    public void setStatus(TripStatus status) {
        this.status = status;
    }

    public int getPassengersCount() {
        return passengersCount;
    }

    public void setPassengersCount(int passengersCount) {
        this.passengersCount = passengersCount;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }
}
