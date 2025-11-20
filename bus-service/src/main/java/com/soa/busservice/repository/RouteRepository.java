package com.soa.busservice.repository;

import com.soa.busservice.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    Optional<Route> findByLineNumber(String lineNumber);
}
