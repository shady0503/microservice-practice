// src/main/java/com/trajets/repository/StopRepository.java
package com.trajets.repository;

import com.trajets.model.Stop;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface StopRepository extends JpaRepository<Stop, Long> {
    Optional<Stop> findByOsmNodeId(String osmNodeId);
    Optional<Stop> findFirstByLatitudeAndLongitude(Double latitude, Double longitude);
}