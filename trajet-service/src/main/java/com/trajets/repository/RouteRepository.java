// src/main/java/com/trajets/repository/RouteRepository.java
package com.trajets.repository;

import com.trajets.model.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByLineId(Long lineId);
    void deleteByLineId(Long lineId);
}