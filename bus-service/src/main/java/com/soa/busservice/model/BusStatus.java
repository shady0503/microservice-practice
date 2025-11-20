package com.soa.busservice.model;

/**
 * Bus operational status enum.
 */
public enum BusStatus {
    EN_SERVICE("En Service"),
    HORS_SERVICE("Hors Service"),
    EN_MAINTENANCE("En Maintenance");

    private final String label;

    BusStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
