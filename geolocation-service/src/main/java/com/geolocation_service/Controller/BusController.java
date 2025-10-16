package com.geolocation_service.Controller;

import com.geolocation_service.DTO.BusDTO;
import com.geolocation_service.Model.Bus;
import com.geolocation_service.Service.BusService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/buses")
public class BusController {

    private final BusService busService;

    public BusController(BusService busService) {
        this.busService = busService;
    }

    @PostMapping
    public ResponseEntity<Bus> createBus(@RequestBody BusDTO busDTO) {
        Bus createdBus = busService.create(busDTO);
        return new ResponseEntity<>(createdBus, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bus> updateBus(@PathVariable UUID id, @RequestBody BusDTO busDTO) {
        Bus updatedBus = busService.update(id, busDTO);
        return ResponseEntity.ok(updatedBus);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBus(@PathVariable UUID id) {
        busService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bus> getBusById(@PathVariable UUID id) {
        Bus bus = busService.getBusById(id);
        return ResponseEntity.ok(bus);
    }

    @GetMapping("/registration/{registrationNumber}")
    public ResponseEntity<Bus> getBusByRegistrationNumber(@PathVariable String registrationNumber) {
        Bus bus = busService.getBusByRegistrationNumber(registrationNumber);
        return ResponseEntity.ok(bus);
    }

    @GetMapping
    public ResponseEntity<List<Bus>> getAllBuses() {
        List<Bus> buses = busService.getAll();
        return ResponseEntity.ok(buses);
    }

    @GetMapping("/driver/{driverId}")
    public ResponseEntity<List<Bus>> getBusesByDriverId(@PathVariable UUID driverId) {
        List<Bus> buses = busService.findAllByDriverId(driverId);
        return ResponseEntity.ok(buses);
    }
}