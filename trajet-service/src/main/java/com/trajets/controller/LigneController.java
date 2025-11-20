package com.trajets.controller;


import com.trajets.event.LineChangeEvent;
import com.trajets.kafka.KafkaProducerService;
import com.trajets.model.Ligne;
import com.trajets.repository.LigneRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/lignes")
public class LigneController {

    private final LigneRepository ligneRepository;
    private final KafkaProducerService kafkaProducerService;

    public LigneController(LigneRepository ligneRepository, KafkaProducerService kafkaProducerService) {
        this.ligneRepository = ligneRepository;
        this.kafkaProducerService = kafkaProducerService;
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
}

