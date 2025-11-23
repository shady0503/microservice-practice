package com.geolocation_service.Service;

import com.geolocation_service.DTO.BusDTO;
import com.geolocation_service.Exception.CustomExceptions;
import com.geolocation_service.Model.Bus;
import com.geolocation_service.Repository.BusRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class BusService {

    private final BusRepository busRepository;

    public BusService(BusRepository busRepository) {
        this.busRepository = busRepository;
    }

    @Transactional
    public Bus create(BusDTO busDTO) {
        validateBusDTO(busDTO);

        Bus existingBus = busRepository.findByRegistrationNumber(busDTO.registrationNumber());
        if (existingBus != null) {
            throw new CustomExceptions.ResourceAlreadyExistsException(
                    "Bus with registration number " + busDTO.registrationNumber() + " already exists"
            );
        }

        Bus bus = new Bus(
                busDTO.registrationNumber(),
                busDTO.capacity(),
                busDTO.type(),
                busDTO.driverId(),
                busDTO.status()
        );

        return busRepository.save(bus);
    }

    @Transactional
    public Bus update(UUID id, BusDTO busDTO) {
        validateBusDTO(busDTO);

        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException(
                        "Bus with id " + id + " not found"
                ));

        Bus existingBusWithRegNumber = busRepository.findByRegistrationNumber(busDTO.registrationNumber());
        if (existingBusWithRegNumber != null && !existingBusWithRegNumber.getId().equals(id)) {
            throw new CustomExceptions.ResourceAlreadyExistsException(
                    "Another bus with registration number " + busDTO.registrationNumber() + " already exists"
            );
        }

        bus.setRegistrationNumber(busDTO.registrationNumber());
        bus.setCapacity(busDTO.capacity());
        bus.setType(busDTO.type());
        bus.setDriverId(busDTO.driverId());
        bus.setStatus(busDTO.status());

        return busRepository.save(bus);
    }

    @Transactional
    public void delete(UUID id) {
        if (!busRepository.existsById(id)) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with id " + id + " not found"
            );
        }
        busRepository.deleteById(id);
    }

    public Bus getBusById(UUID id) {
        return busRepository.findById(id)
                .orElseThrow(() -> new CustomExceptions.ResourceNotFoundException(
                        "Bus with id " + id + " not found"
                ));
    }

    public Bus getBusByRegistrationNumber(String registrationNumber) {
        Bus bus = busRepository.findByRegistrationNumber(registrationNumber);
        if (bus == null) {
            throw new CustomExceptions.ResourceNotFoundException(
                    "Bus with registration number " + registrationNumber + " not found"
            );
        }
        return bus;
    }

    public List<Bus> getAll() {
        return busRepository.findAll();
    }

    public List<Bus> findAllByDriverId(UUID driverId) {
        if (driverId == null) {
            throw new CustomExceptions.InvalidDataException("Driver ID cannot be null");
        }
        return busRepository.findAllByDriverId(driverId);
    }

    private void validateBusDTO(BusDTO busDTO) {
        if (busDTO.registrationNumber() == null || busDTO.registrationNumber().trim().isEmpty()) {
            throw new CustomExceptions.InvalidDataException("Registration number is required");
        }
        if (busDTO.capacity() <= 0) {
            throw new CustomExceptions.InvalidDataException("Capacity must be greater than 0");
        }
        if (busDTO.type() == null) {
            throw new CustomExceptions.InvalidDataException("Bus type is required");
        }
        if (busDTO.status() == null) {
            throw new CustomExceptions.InvalidDataException("Bus status is required");
        }
    }
}