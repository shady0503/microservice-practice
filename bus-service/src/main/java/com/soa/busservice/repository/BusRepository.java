package com.soa.busservice.repository;

import com.soa.busservice.model.Bus;
import com.soa.busservice.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusRepository extends JpaRepository<Bus, UUID> {
    Optional<Bus> findByBusNumber(String busNumber);
    List<Bus> findByStatus(Status status);
    
    // Strict exact match for line code
    List<Bus> findByLineCode(String lineCode);
    
    boolean existsByBusNumber(String busNumber);
}