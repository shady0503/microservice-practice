package com.trajets.repository;

import com.trajets.model.Ligne;
import com.trajets.model.Trajet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrajetRepository extends JpaRepository<Trajet, Long> {
    Optional<Trajet> findByNomAndLigne(String nom, Ligne ligne);
    List<Trajet> findByLigneId(Long ligneId);
}
