package com.geolocation_service.Repository;

import com.geolocation_service.Model.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;


@Repository
public interface BusRepository extends JpaRepository<Bus, UUID> {

    public Bus findByRegistrationNumber(String registrationNumber);
    public List<Bus> findAllByDriverId(UUID driverId);
}
