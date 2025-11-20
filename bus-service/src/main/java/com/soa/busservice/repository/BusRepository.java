package com.soa.busservice.repository;

import com.soa.busservice.model.Bus;
import com.soa.busservice.model.BusStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for Bus entity providing CRUD and custom query operations.
 */
@Repository
public interface BusRepository extends JpaRepository<Bus, UUID> {
    
    /**
     * Find a bus by its matricule (registration number).
     */
    Optional<Bus> findByMatricule(String matricule);
    
    /**
     * Find all buses with a specific operational status.
     */
    List<Bus> findByStatus(BusStatus status);
    
    /**
     * Find all buses assigned to a specific route by route ID.
     */
    List<Bus> findByCurrentRouteRouteId(UUID routeId);
    
    /**
     * Find all buses assigned to a specific route (legacy - for backward compatibility).
     */
    @Query("SELECT b FROM Bus b WHERE b.currentRoute.routeId = :routeId")
    List<Bus> findByCurrentRouteId(@Param("routeId") UUID routeId);
    
    /**
     * Find all buses with a given status and optionally assigned to a route.
     */
    @Query("SELECT b FROM Bus b WHERE b.status = :status AND (:routeId IS NULL OR b.currentRoute.routeId = :routeId)")
    List<Bus> findByStatusAndRoute(@Param("status") BusStatus status, @Param("routeId") UUID routeId);
    
    /**
     * Find all buses that are currently in service (EN_SERVICE status).
     */
    @Query("SELECT b FROM Bus b WHERE b.status = 'EN_SERVICE'")
    List<Bus> findAllActiveBuses();
}
