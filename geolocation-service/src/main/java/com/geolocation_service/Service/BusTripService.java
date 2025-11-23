package com.geolocation_service.Service;

import com.geolocation_service.DTO.BusTripDTO;
import com.geolocation_service.Exception.CustomExceptions;
import com.geolocation_service.Model.BusTrip;
import com.geolocation_service.Model.TripStatus;
import com.geolocation_service.Repository.BusRepository;
import com.geolocation_service.Repository.BusTripRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BusTripService {

    private final BusTripRepository busTripRepository;
    private final BusRepository busRepository;

    public BusTripService(BusTripRepository busTripRepository, BusRepository busRepository) {
        this.busTripRepository = busTripRepository;
        this.busRepository = busRepository;
    }

    @Transactional
    public BusTrip create(BusTripDTO busTripDTO) {
        validateBusTripDTO(busTripDTO);

        if (!busRepository.existsById(busTripDTO.busId())) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with id " + busTripDTO.busId() + " not found"
            );
        }

        BusTrip busTrip = new BusTrip(
                busTripDTO.busId(),
                busTripDTO.routeId(),
                busTripDTO.scheduleId(),
                busTripDTO.startTime(),
                busTripDTO.endTime(),
                busTripDTO.status(),
                busTripDTO.passengersCount()
        );

        return busTripRepository.save(busTrip);
    }

    @Transactional
    public BusTrip update(UUID id, BusTripDTO busTripDTO) {
        validateBusTripDTO(busTripDTO);

        BusTrip busTrip = busTripRepository.findById(id)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException(
                        "Bus trip with id " + id + " not found"
                ));

        if (!busRepository.existsById(busTripDTO.busId())) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with id " + busTripDTO.busId() + " not found"
            );
        }

        busTrip.setBusId(busTripDTO.busId());
        busTrip.setRouteId(busTripDTO.routeId());
        busTrip.setScheduleId(busTripDTO.scheduleId());
        busTrip.setStartTime(busTripDTO.startTime());
        busTrip.setEndTime(busTripDTO.endTime());
        busTrip.setStatus(busTripDTO.status());
        busTrip.setPassengersCount(busTripDTO.passengersCount());

        return busTripRepository.save(busTrip);
    }

    @Transactional
    public void delete(UUID id) {
        if (!busTripRepository.existsById(id)) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus trip with id " + id + " not found"
            );
        }
        busTripRepository.deleteById(id);
    }

    public BusTrip getById(UUID id) {
        return busTripRepository.findById(id)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException(
                        "Bus trip with id " + id + " not found"
                ));
    }

    public List<BusTrip> getAll() {
        return busTripRepository.findAll();
    }

    public List<BusTrip> getAllByBusId(UUID busId) {
        if (busId == null) {
            throw new CustomExceptions.InvalidDataException("Bus ID cannot be null");
        }
        return busTripRepository.findAllByBusId(busId);
    }

    public List<BusTrip> getAllByRouteId(UUID routeId) {
        if (routeId == null) {
            throw new CustomExceptions.InvalidDataException("Route ID cannot be null");
        }
        return busTripRepository.findAllByRouteId(routeId);
    }

    public List<BusTrip> getAllByStatus(TripStatus status) {
        if (status == null) {
            throw new CustomExceptions.InvalidDataException("Status cannot be null");
        }
        return busTripRepository.findAllByStatus(status);
    }

    public List<BusTrip> getAllByBusIdAndStatus(UUID busId, TripStatus status) {
        if (busId == null) {
            throw new CustomExceptions.InvalidDataException("Bus ID cannot be null");
        }
        if (status == null) {
            throw new CustomExceptions.InvalidDataException("Status cannot be null");
        }
        return busTripRepository.findAllByBusIdAndStatus(busId, status);
    }

    private void validateBusTripDTO(BusTripDTO busTripDTO) {
        if (busTripDTO.busId() == null) {
            throw new CustomExceptions.InvalidDataException("Bus ID is required");
        }
        if (busTripDTO.routeId() == null) {
            throw new CustomExceptions.InvalidDataException("Route ID is required");
        }
        if (busTripDTO.scheduleId() == null) {
            throw new CustomExceptions.InvalidDataException("Schedule ID is required");
        }
        if (busTripDTO.startTime() == null) {
            throw new CustomExceptions.InvalidDataException("Start time is required");
        }
        if (busTripDTO.status() == null) {
            throw new CustomExceptions.InvalidDataException("Status is required");
        }
        if (busTripDTO.passengersCount() < 0) {
            throw new CustomExceptions.InvalidDataException("Passengers count cannot be negative");
        }
        if (busTripDTO.endTime() != null && busTripDTO.endTime().before(busTripDTO.startTime())) {
            throw new CustomExceptions.InvalidDataException("End time cannot be before start time");
        }
    }
}