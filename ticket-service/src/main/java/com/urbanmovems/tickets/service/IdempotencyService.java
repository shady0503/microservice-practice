package com.urbanmovems.tickets.service;

import org.springframework.http.ResponseEntity;

import java.util.UUID;
import java.util.function.Supplier;

public interface IdempotencyService {

    /**
     * Exécute une opération avec idempotence
     * Si la clé existe déjà, retourne la réponse cachée
     * Sinon, exécute l'opération et cache la réponse
     */
    <T> ResponseEntity<T> executeIdempotent(
            UUID idempotencyKey,
            String requestPath,
            String requestMethod,
            Supplier<ResponseEntity<T>> operation);

    /**
     * Nettoie les enregistrements expirés
     */
    void cleanupExpiredRecords();
}