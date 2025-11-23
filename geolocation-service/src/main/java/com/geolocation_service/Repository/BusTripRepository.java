package com.geolocation_service.Repository;

import com.geolocation_service.Model.BusTrip;
import com.geolocation_service.Model.TripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusTripRepository extends JpaRepository<BusTrip, UUID> {
    List<BusTrip> findAllByBusId(UUID busId);
    List<BusTrip> findAllByRouteId(UUID routeId);
    List<BusTrip> findAllByStatus(TripStatus status);
    List<BusTrip> findAllByBusIdAndStatus(UUID busId, TripStatus status);
}