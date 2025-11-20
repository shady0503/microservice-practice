package com.urbanmovems.tickets.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Price {

    @Column(name = "price_amount", nullable = false)
    private Integer amount; // Montant en centimes (ex: 1500 = 15.00 MAD)

    @Column(name = "price_currency", nullable = false, length = 3)
    private String currency; // Code ISO 4217 (ex: MAD)

    /**
     * Crée un prix depuis un montant en unité (MAD)
     */
    public static Price fromAmount(double amountInUnits, String currency) {
        int amountInCents = (int) Math.round(amountInUnits * 100);
        return new Price(amountInCents, currency);
    }

    /**
     * Retourne le montant en unité (MAD)
     */
    public BigDecimal getAmountInUnits() {
        return BigDecimal.valueOf(amount)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
    }

    /**
     * Multiplie le prix par une quantité
     */
    public Price multiply(int quantity) {
        return new Price(amount * quantity, currency);
    }

    @Override
    public String toString() {
        return String.format("%s %s", getAmountInUnits(), currency);
    }
}