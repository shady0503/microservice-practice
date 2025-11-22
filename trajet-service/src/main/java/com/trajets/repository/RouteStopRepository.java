// src/main/java/com/trajets/repository/RouteStopRepository.java
package com.trajets.repository;

import com.trajets.model.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RouteStopRepository extends JpaRepository<RouteStop, Long> {
    List<RouteStop> findByRouteIdOrderByStopOrder(Long routeId);
    void deleteByRouteId(Long routeId);
}