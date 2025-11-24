package com.urbanmovems.tickets.service.impl;

import com.urbanmovems.tickets.service.TrajetClient;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrajetClientImpl implements TrajetClient {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.trajet.base-url:http://localhost:8080}")
    private String trajetServiceUrl;

    @Value("${ticket.price.default-amount:1500}")
    private int defaultPriceAmount;

    @Override
    @CircuitBreaker(name = "trajetService", fallbackMethod = "trajetExistsFallback")
    @Retry(name = "trajetService")
    public boolean trajetExists(Long trajetId) {
        log.debug("Checking if trajet exists: {}", trajetId);

        try {
            WebClient webClient = webClientBuilder.baseUrl(trajetServiceUrl).build();

            webClient.get()
                    .uri("/api/trajets/{id}", trajetId)
                    .retrieve()
                    .toBodilessEntity()
                    .block();

            log.debug("Trajet {} exists", trajetId);
            return true;
        } catch (WebClientResponseException.NotFound e) {
            log.warn("Trajet {} not found", trajetId);
            return false;
        } catch (Exception e) {
            log.error("Error checking trajet existence", e);
            throw e;
        }
    }

    @Override
    @CircuitBreaker(name = "trajetService", fallbackMethod = "getTrajetPriceFallback")
    @Retry(name = "trajetService")
    public Integer getTrajetPrice(Long trajetId) {
        log.debug("Fetching price for trajet: {}", trajetId);

        try {
            // Pour l'instant, le service trajet ne retourne pas de prix
            // On utilise le prix par défaut
            // TODO: Implémenter quand le service trajet expose le prix
            return defaultPriceAmount;
        } catch (Exception e) {
            log.error("Error fetching trajet price", e);
            throw e;
        }
    }

    // Fallback methods
    private boolean trajetExistsFallback(Long trajetId, Exception e) {
        log.warn("Fallback: Assuming trajet {} exists due to service unavailability", trajetId);
        return true; // Par défaut, on assume que le trajet existe
    }

    private Integer getTrajetPriceFallback(Long trajetId, Exception e) {
        log.warn("Fallback: Using default price for trajet {} due to service unavailability", trajetId);
        return defaultPriceAmount;
    }
}