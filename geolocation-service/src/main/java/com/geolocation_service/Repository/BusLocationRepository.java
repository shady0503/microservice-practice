package com.geolocation_service.Repository;

import com.geolocation_service.Model.BusLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusLocationRepository extends JpaRepository<BusLocation, UUID> {

    List<BusLocation> findAllByBusId(UUID busId);

    @Query("SELECT bl FROM BusLocation bl WHERE bl.busId = :busId ORDER BY bl.createdAt DESC")
    Optional<BusLocation> findLatestByBusId(UUID busId);

    @Query("SELECT bl FROM BusLocation bl WHERE bl.busId = :busId AND bl.createdAt >= :since ORDER BY bl.createdAt DESC")
    List<BusLocation> findByBusIdSince(UUID busId, Timestamp since);

    @Query("SELECT bl FROM BusLocation bl WHERE bl.createdAt >= :since")
    List<BusLocation> findAllSince(Timestamp since);
}