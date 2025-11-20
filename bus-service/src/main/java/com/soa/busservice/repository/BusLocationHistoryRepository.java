package com.soa.busservice.repository;

import com.soa.busservice.model.BusLocationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for BusLocationHistory entity providing persistence for GPS history records.
 */
@Repository
public interface BusLocationHistoryRepository extends JpaRepository<BusLocationHistory, UUID> {
    
    /**
     * Find all location records for a specific bus.
     */
    List<BusLocationHistory> findByBusId(UUID busId);
    
    /**
     * Find location records for a bus within a specific time period.
     */
    @Query("SELECT blh FROM BusLocationHistory blh WHERE blh.busId = :busId AND blh.timestamp BETWEEN :startTime AND :endTime ORDER BY blh.timestamp DESC")
    List<BusLocationHistory> findBusLocationHistory(
            @Param("busId") UUID busId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime
    );
    
    /**
     * Get the most recent location record for a specific bus.
     */
    @Query(value = "SELECT * FROM bus_location_history WHERE bus_id = :busId ORDER BY timestamp DESC LIMIT 1", nativeQuery = true)
    BusLocationHistory findLatestLocationForBus(@Param("busId") UUID busId);
}
