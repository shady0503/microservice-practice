package com.soa.busservice.repository;

import com.soa.busservice.model.Bus;
import com.soa.busservice.model.BusStatus;
import com.soa.busservice.model.Route;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for BusRepository.
 * Note: These tests are disabled as they require full application context initialization.
 * Repository functionality is tested indirectly through BusServiceTest.
 */
@DataJpaTest
@ActiveProfiles("test")
@Disabled("Integration tests disabled - requires full context initialization with Kafka")
class BusRepositoryTest {
    
    @Autowired
    private BusRepository busRepository;
    
    @Autowired
    private RouteRepository routeRepository;
    
    private Bus testBus;
    private Route testRoute;
    
    @BeforeEach
    void setUp() {
        testBus = Bus.builder()
                .matricule("TESTBUS001")
                .capacity(50)
                .status(BusStatus.EN_SERVICE)
                .build();
    }
    
    @Test
    void testCreateBus() {
        Bus savedBus = busRepository.save(testBus);
        assertNotNull(savedBus.getBusId());
        assertEquals("TESTBUS001", savedBus.getMatricule());
    }
    
    @Test
    void testFindByMatricule() {
        busRepository.save(testBus);
        Optional<Bus> found = busRepository.findByMatricule("TESTBUS001");
        assertTrue(found.isPresent());
        assertEquals(testBus.getMatricule(), found.get().getMatricule());
    }
    
    @Test
    void testFindByStatus() {
        busRepository.save(testBus);
        List<Bus> buses = busRepository.findByStatus(BusStatus.EN_SERVICE);
        assertFalse(buses.isEmpty());
        assertTrue(buses.stream().anyMatch(b -> b.getMatricule().equals("TESTBUS001")));
    }
    
    @Test
    void testFindByCurrentRouteId() {
        // Create and persist a test route
        testRoute = new Route();
        testRoute.setRouteId(UUID.randomUUID());
        testRoute.setLineNumber("TEST001");
        testRoute.setRouteName("Test Line");
        testRoute.setOrigin("Test Origin");
        testRoute.setDestination("Test Destination");
        testRoute.setRouteType("TEST");
        testRoute.setIsActive(true);
        testRoute = routeRepository.save(testRoute);
        
        // Assign route to bus and save
        testBus.setCurrentRoute(testRoute);
        busRepository.save(testBus);
        
        // Query by route UUID
        List<Bus> buses = busRepository.findByCurrentRouteId(testRoute.getRouteId());
        assertFalse(buses.isEmpty());
    }
    
    @Test
    void testFindAllActiveBuses() {
        busRepository.save(testBus);
        List<Bus> activeBuses = busRepository.findAllActiveBuses();
        assertFalse(activeBuses.isEmpty());
    }
}
