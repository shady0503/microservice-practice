package com.trajets.service.impl;

import com.trajets.dto.request.ArretCreateRequest;
import com.trajets.dto.response.ArretDTO;
import com.trajets.model.Arret;
import com.trajets.repository.ArretRepository;
import com.trajets.service.ArretService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ArretServiceImpl implements ArretService {

    private final ArretRepository arretRepository;

    @Override
    public List<ArretDTO> getAllArrets() {
        return arretRepository.findAll().stream()
                .map(a -> new ArretDTO(a.getId(), a.getNom(), a.getLatitude(), a.getLongitude(), a.getAddress()))
                .collect(Collectors.toList());
    }

    @Override
    public ArretDTO getArretById(Long id) {
        Arret arret = arretRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Arret non trouvé"));
        return new ArretDTO(arret.getId(), arret.getNom(), arret.getLatitude(), arret.getLongitude(), arret.getAddress());
    }

    @Override
    public ArretDTO createArret(ArretCreateRequest request) {
        Arret arret = new Arret();
        arret.setNom(request.getNom());
        arret.setLatitude(request.getLatitude());
        arret.setLongitude(request.getLongitude());
        arret.setAddress(request.getAddress());
        Arret saved = arretRepository.save(arret);
        return new ArretDTO(saved.getId(), saved.getNom(), saved.getLatitude(), saved.getLongitude(), saved.getAddress());
    }

    @Override
    public void deleteArret(Long id) {
        arretRepository.deleteById(id);
    }
}
