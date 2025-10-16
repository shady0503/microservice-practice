package com.geolocation_service.Service;

import com.geolocation_service.DTO.BusLocationDTO;
import com.geolocation_service.Exception.CustomExceptions;
import com.geolocation_service.Model.BusLocation;
import com.geolocation_service.Repository.BusLocationRepository;
import com.geolocation_service.Repository.BusRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

@Service
public class BusLocationService {

    private final BusLocationRepository busLocationRepository;
    private final BusRepository busRepository;

    public BusLocationService(BusLocationRepository busLocationRepository, BusRepository busRepository) {
        this.busLocationRepository = busLocationRepository;
        this.busRepository = busRepository;
    }

    @Transactional
    public BusLocation create(BusLocationDTO busLocationDTO) {
        validateBusLocationDTO(busLocationDTO);

        if (!busRepository.existsById(busLocationDTO.busId())) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with id " + busLocationDTO.busId() + " not found"
            );
        }

        BusLocation busLocation = new BusLocation(
                busLocationDTO.busId(),
                busLocationDTO.latitude(),
                busLocationDTO.longitude(),
                busLocationDTO.speedKMH(),
                busLocationDTO.heading()
        );

        return busLocationRepository.save(busLocation);
    }

    @Transactional
    public BusLocation update(UUID id, BusLocationDTO busLocationDTO) {
        validateBusLocationDTO(busLocationDTO);

        BusLocation busLocation = busLocationRepository.findById(id)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException(
                        "Bus location with id " + id + " not found"
                ));

        if (!busRepository.existsById(busLocationDTO.busId())) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with id " + busLocationDTO.busId() + " not found"
            );
        }

        busLocation.setBusId(busLocationDTO.busId());
        busLocation.setLatitude(busLocationDTO.latitude());
        busLocation.setLongitude(busLocationDTO.longitude());
        busLocation.setSpeedKMH(busLocationDTO.speedKMH());
        busLocation.setHeading(busLocationDTO.heading());

        return busLocationRepository.save(busLocation);
    }

    @Transactional
    public void delete(UUID id) {
        if (!busLocationRepository.existsById(id)) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus location with id " + id + " not found"
            );
        }
        busLocationRepository.deleteById(id);
    }

    public BusLocation getById(UUID id) {
        return busLocationRepository.findById(id)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException(
                        "Bus location with id " + id + " not found"
                ));
    }

    public List<BusLocation> getAll() {
        return busLocationRepository.findAll();
    }

    public List<BusLocation> getAllByBusId(UUID busId) {
        if (busId == null) {
            throw new CustomExceptions.InvalidDataException("Bus ID cannot be null");
        }
        if (!busRepository.existsById(busId)) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with id " + busId + " not found"
            );
        }
        return busLocationRepository.findAllByBusId(busId);
    }

    public BusLocation getLatestLocationByBusId(UUID busId) {
        if (busId == null) {
            throw new CustomExceptions.InvalidDataException("Bus ID cannot be null");
        }
        if (!busRepository.existsById(busId)) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with id " + busId + " not found"
            );
        }
        return busLocationRepository.findLatestByBusId(busId)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException(
                        "No location found for bus with id " + busId
                ));
    }

    public List<BusLocation> getLocationsByBusIdSince(UUID busId, Timestamp since) {
        if (busId == null) {
            throw new CustomExceptions.InvalidDataException("Bus ID cannot be null");
        }
        if (since == null) {
            throw new CustomExceptions.InvalidDataException("Timestamp cannot be null");
        }
        if (!busRepository.existsById(busId)) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with id " + busId + " not found"
            );
        }
        return busLocationRepository.findByBusIdSince(busId, since);
    }

    public List<BusLocation> getAllLocationsSince(Timestamp since) {
        if (since == null) {
            throw new CustomExceptions.InvalidDataException("Timestamp cannot be null");
        }
        return busLocationRepository.findAllSince(since);
    }

    private void validateBusLocationDTO(BusLocationDTO busLocationDTO) {
        if (busLocationDTO.busId() == null) {
            throw new CustomExceptions.InvalidDataException("Bus ID is required");
        }
        if (busLocationDTO.latitude() == null || busLocationDTO.latitude() < -90 || busLocationDTO.latitude() > 90) {
            throw new CustomExceptions.InvalidDataException("Invalid latitude value");
        }
        if (busLocationDTO.longitude() == null || busLocationDTO.longitude() < -180 || busLocationDTO.longitude() > 180) {
            throw new CustomExceptions.InvalidDataException("Invalid longitude value");
        }
        if (busLocationDTO.speedKMH() != null && busLocationDTO.speedKMH() < 0) {
            throw new CustomExceptions.InvalidDataException("Speed cannot be negative");
        }
        if (busLocationDTO.heading() != null && (busLocationDTO.heading() < 0 || busLocationDTO.heading() > 360)) {
            throw new CustomExceptions.InvalidDataException("Heading must be between 0 and 360 degrees");
        }
    }
}