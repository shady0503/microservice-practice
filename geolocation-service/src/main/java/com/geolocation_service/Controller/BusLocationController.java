package com.geolocation_service.Controller;

import com.geolocation_service.DTO.BusLocationDTO;
import com.geolocation_service.Model.BusLocation;
import com.geolocation_service.Service.BusLocationService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/bus-locations")
public class BusLocationController {

    private final BusLocationService busLocationService;

    public BusLocationController(BusLocationService busLocationService) {
        this.busLocationService = busLocationService;
    }

    @PostMapping
    public ResponseEntity<BusLocation> createBusLocation(@RequestBody BusLocationDTO busLocationDTO) {
        BusLocation createdLocation = busLocationService.create(busLocationDTO);
        return new ResponseEntity<>(createdLocation, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BusLocation> updateBusLocation(@PathVariable UUID id, @RequestBody BusLocationDTO busLocationDTO) {
        BusLocation updatedLocation = busLocationService.update(id, busLocationDTO);
        return ResponseEntity.ok(updatedLocation);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBusLocation(@PathVariable UUID id) {
        busLocationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BusLocation> getBusLocationById(@PathVariable UUID id) {
        BusLocation location = busLocationService.getById(id);
        return ResponseEntity.ok(location);
    }

    @GetMapping
    public ResponseEntity<List<BusLocation>> getAllBusLocations() {
        List<BusLocation> locations = busLocationService.getAll();
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/bus/{busId}")
    public ResponseEntity<List<BusLocation>> getLocationsByBusId(@PathVariable UUID busId) {
        List<BusLocation> locations = busLocationService.getAllByBusId(busId);
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/bus/{busId}/latest")
    public ResponseEntity<BusLocation> getLatestLocationByBusId(@PathVariable UUID busId) {
        BusLocation location = busLocationService.getLatestLocationByBusId(busId);
        return ResponseEntity.ok(location);
    }

    @GetMapping("/bus/{busId}/since")
    public ResponseEntity<List<BusLocation>> getLocationsByBusIdSince(
            @PathVariable UUID busId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since
    ) {
        Timestamp timestamp = Timestamp.valueOf(since);
        List<BusLocation> locations = busLocationService.getLocationsByBusIdSince(busId, timestamp);
        return ResponseEntity.ok(locations);
    }

    @GetMapping("/since")
    public ResponseEntity<List<BusLocation>> getAllLocationsSince(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since
    ) {
        Timestamp timestamp = Timestamp.valueOf(since);
        List<BusLocation> locations = busLocationService.getAllLocationsSince(timestamp);
        return ResponseEntity.ok(locations);
    }
}