package com.urbanmovems.tickets.service;

public interface TrajetClient {

    /**
     * Vérifie si un trajet existe
     * Utilise Resilience4j pour circuit breaker et retry
     */
    boolean trajetExists(Long trajetId);

    /**
     * Récupère le prix d'un trajet (si disponible)
     */
    Integer getTrajetPrice(Long trajetId);
}