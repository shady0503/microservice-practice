package com.soa.busservice.service;

import com.soa.busservice.dto.CreateBusDto;
import com.soa.busservice.dto.BusDto;
import com.soa.busservice.model.Bus;
import com.soa.busservice.model.BusStatus;
import com.soa.busservice.repository.BusRepository;
import com.soa.busservice.repository.BusLocationHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BusService.
 */
@ExtendWith(MockitoExtension.class)
class BusServiceTest {
    
    @Mock
    private BusRepository busRepository;
    
    @Mock
    private BusLocationHistoryRepository busLocationHistoryRepository;
    
    @Mock
    private KafkaTemplate<String, Object> kafkaTemplate;
    
    @InjectMocks
    private BusService busService;
    
    private UUID testBusId;
    private CreateBusDto createBusDto;
    private Bus testBus;
    
    @BeforeEach
    void setUp() {
        testBusId = UUID.randomUUID();
        
        createBusDto = CreateBusDto.builder()
                .matricule("TEST001")
                .capacity(50)
                .status(BusStatus.EN_SERVICE)
                .build();
        
        testBus = Bus.builder()
                .busId(testBusId)
                .matricule("TEST001")
                .capacity(50)
                .status(BusStatus.EN_SERVICE)
                .build();
    }
    
    @Test
    void testCreateBus() {
        when(busRepository.findByMatricule(any())).thenReturn(Optional.empty());
        when(busRepository.save(any(Bus.class))).thenReturn(testBus);
        
        BusDto result = busService.createBus(createBusDto);
        
        assertNotNull(result);
        assertEquals(testBus.getMatricule(), result.getMatricule());
        assertEquals(testBus.getCapacity(), result.getCapacity());
        verify(busRepository, times(1)).save(any(Bus.class));
    }
    
    @Test
    void testCreateBusDuplicateMatricule() {
        when(busRepository.findByMatricule(any())).thenReturn(Optional.of(testBus));
        
        assertThrows(IllegalArgumentException.class, () -> busService.createBus(createBusDto));
        verify(busRepository, never()).save(any(Bus.class));
    }
    
    @Test
    void testGetBusById() {
        when(busRepository.findById(testBusId)).thenReturn(Optional.of(testBus));
        
        BusDto result = busService.getBusById(testBusId);
        
        assertNotNull(result);
        assertEquals(testBus.getMatricule(), result.getMatricule());
    }
    
    @Test
    void testGetBusByIdNotFound() {
        when(busRepository.findById(any())).thenReturn(Optional.empty());
        
        assertThrows(java.util.NoSuchElementException.class, () -> busService.getBusById(testBusId));
    }
    
    @Test
    void testUpdateBus() {
        when(busRepository.findById(testBusId)).thenReturn(Optional.of(testBus));
        when(busRepository.save(any(Bus.class))).thenReturn(testBus);
        
        BusDto result = busService.updateBus(testBusId, createBusDto);
        
        assertNotNull(result);
        verify(busRepository, times(1)).save(any(Bus.class));
    }
    
    @Test
    void testDeleteBus() {
        when(busRepository.existsById(testBusId)).thenReturn(true);
        
        busService.deleteBus(testBusId);
        
        verify(busRepository, times(1)).deleteById(testBusId);
    }
    
    @Test
    void testDeleteBusNotFound() {
        when(busRepository.existsById(any())).thenReturn(false);
        
        assertThrows(java.util.NoSuchElementException.class, () -> busService.deleteBus(testBusId));
        verify(busRepository, never()).deleteById(any());
    }
}
