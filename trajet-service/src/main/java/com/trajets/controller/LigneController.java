package com.trajets.controller;


import com.trajets.event.LineChangeEvent;
import com.trajets.kafka.KafkaProducerService;
import com.trajets.model.Arret;
import com.trajets.model.Ligne;
import com.trajets.repository.LigneRepository;
import com.trajets.repository.TrajetArretRepository;
import com.trajets.repository.TrajetRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lignes")
public class LigneController {

    private final LigneRepository ligneRepository;
    private final KafkaProducerService kafkaProducerService;
    private final TrajetRepository trajetRepository;
    private final TrajetArretRepository trajetArretRepository;

    public LigneController(LigneRepository ligneRepository, KafkaProducerService kafkaProducerService, 
                          TrajetRepository trajetRepository, TrajetArretRepository trajetArretRepository) {
        this.ligneRepository = ligneRepository;
        this.kafkaProducerService = kafkaProducerService;
        this.trajetRepository = trajetRepository;
        this.trajetArretRepository = trajetArretRepository;
    }

    @GetMapping
    public List<Ligne> getAll() {
        return ligneRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ligne> getById(@PathVariable Long id) {
        return ligneRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Ligne> create(@RequestBody Ligne ligne) {
        if (ligneRepository.existsByCode(ligne.getCode())) {
            return ResponseEntity.badRequest().build();
        }
        Ligne savedLigne = ligneRepository.save(ligne);
        
        // Publish line created event
        LineChangeEvent event = new LineChangeEvent(
            savedLigne.getId(),
            savedLigne.getCode(),
            savedLigne.getNom(),
            LineChangeEvent.ChangeType.CREATED,
            LocalDateTime.now()
        );
        kafkaProducerService.publishLineChange(event);
        
        return ResponseEntity.ok(savedLigne);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ligne> update(@PathVariable Long id, @RequestBody Ligne updated) {
        return ligneRepository.findById(id)
                .map(ligne -> {
                    ligne.setCode(updated.getCode());
                    ligne.setNom(updated.getNom());
                    ligne.setDescription(updated.getDescription());
                    Ligne savedLigne = ligneRepository.save(ligne);
                    
                    // Publish line updated event
                    LineChangeEvent event = new LineChangeEvent(
                        savedLigne.getId(),
                        savedLigne.getCode(),
                        savedLigne.getNom(),
                        LineChangeEvent.ChangeType.UPDATED,
                        LocalDateTime.now()
                    );
                    kafkaProducerService.publishLineChange(event);
                    
                    return ResponseEntity.ok(savedLigne);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!ligneRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Get line info before deletion for event
        ligneRepository.findById(id).ifPresent(ligne -> {
            LineChangeEvent event = new LineChangeEvent(
                ligne.getId(),
                ligne.getCode(),
                ligne.getNom(),
                LineChangeEvent.ChangeType.DELETED,
                LocalDateTime.now()
            );
            kafkaProducerService.publishLineChange(event);
        });
        
        ligneRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/{id}/arrets")
    @Transactional(readOnly = true)
    public ResponseEntity<List<Arret>> getArretsByLigneId(@PathVariable Long id) {
        if (!ligneRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        // Get all arrets for all trajets of this ligne, ordered by ordre
        List<Long> trajetIds = trajetRepository.findByLigneId(id).stream()
                .map(trajet -> trajet.getId())
                .collect(Collectors.toList());
        
        if (trajetIds.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        
        List<Arret> arrets = trajetArretRepository.findAll().stream()
                .filter(ta -> trajetIds.contains(ta.getTrajet().getId()))
                .sorted((ta1, ta2) -> Integer.compare(ta1.getOrdre(), ta2.getOrdre()))
                .map(ta -> {
                    Arret arret = ta.getArret();
                    // Force initialization to avoid lazy loading issues
                    arret.getNom();
                    return arret;
                })
                .distinct()
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(arrets);
    }
}

