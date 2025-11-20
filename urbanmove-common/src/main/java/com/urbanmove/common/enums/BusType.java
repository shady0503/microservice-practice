package com.urbanmove.common.enums;

/**
 * Bus type classification enum.
 */
public enum BusType {
    STANDARD("Standard Bus"),
    ARTICULATED("Articulated Bus"),
    DOUBLE_DECKER("Double Decker"),
    ELECTRIC("Electric Bus"),
    HYBRID("Hybrid Bus"),
    MINIBUS("Minibus");

    private final String label;

    BusType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
