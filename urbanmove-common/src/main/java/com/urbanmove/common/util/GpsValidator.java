package com.urbanmove.common.util;

import com.urbanmove.common.exception.InvalidDataException;

/**
 * Utility class for GPS coordinate validation.
 */
public final class GpsValidator {

    private static final double MIN_LATITUDE = -90.0;
    private static final double MAX_LATITUDE = 90.0;
    private static final double MIN_LONGITUDE = -180.0;
    private static final double MAX_LONGITUDE = 180.0;

    private GpsValidator() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static boolean isValidLatitude(Double latitude) {
        return latitude != null && latitude >= MIN_LATITUDE && latitude <= MAX_LATITUDE;
    }

    public static boolean isValidLongitude(Double longitude) {
        return longitude != null && longitude >= MIN_LONGITUDE && longitude <= MAX_LONGITUDE;
    }

    public static boolean isValidCoordinates(Double latitude, Double longitude) {
        return isValidLatitude(latitude) && isValidLongitude(longitude);
    }

    public static void validateLatitude(Double latitude) {
        if (!isValidLatitude(latitude)) {
            throw new InvalidDataException("latitude",
                    String.format("must be between %.1f and %.1f", MIN_LATITUDE, MAX_LATITUDE));
        }
    }

    public static void validateLongitude(Double longitude) {
        if (!isValidLongitude(longitude)) {
            throw new InvalidDataException("longitude",
                    String.format("must be between %.1f and %.1f", MIN_LONGITUDE, MAX_LONGITUDE));
        }
    }

    public static void validateCoordinates(Double latitude, Double longitude) {
        validateLatitude(latitude);
        validateLongitude(longitude);
    }
}
