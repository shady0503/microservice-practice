package com.trajets.repository;

import com.trajets.model.Arret;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArretRepository extends JpaRepository<Arret, Long> {
    Optional<Arret> findByLatitudeAndLongitude(Double latitude, Double longitude);
}
