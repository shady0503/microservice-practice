package com.urbanmove.common.enums;

/**
 * Unified bus operational status enum.
 * Combines statuses from both bus-service and geolocation-service.
 */
public enum BusStatus {
    AVAILABLE("Available"),
    IN_SERVICE("In Service"),
    EN_SERVICE("En Service"), // Legacy compatibility
    MAINTENANCE("Maintenance"),
    EN_MAINTENANCE("En Maintenance"), // Legacy compatibility
    OUT_OF_SERVICE("Out of Service"),
    HORS_SERVICE("Hors Service"), // Legacy compatibility
    BREAKDOWN("Breakdown");

    private final String label;

    BusStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public boolean isOperational() {
        return this == AVAILABLE || this == IN_SERVICE || this == EN_SERVICE;
    }

    public boolean needsMaintenance() {
        return this == MAINTENANCE || this == EN_MAINTENANCE || this == BREAKDOWN;
    }
}
