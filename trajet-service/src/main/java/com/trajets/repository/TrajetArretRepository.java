package com.trajets.repository;

import com.trajets.model.Arret;
import com.trajets.model.Trajet;
import com.trajets.model.TrajetArret;
import com.trajets.model.TrajetArretId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrajetArretRepository extends JpaRepository<TrajetArret, TrajetArretId> {
    boolean existsByTrajetAndArret(Trajet trajet, Arret arret);
}
