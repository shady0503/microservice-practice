package com.urbanmovems.tickets.service;

import com.urbanmovems.tickets.dto.request.TicketRequest;
import com.urbanmovems.tickets.dto.response.TicketResponse;
import com.urbanmovems.tickets.event.TicketCancelledEvent;
import com.urbanmovems.tickets.event.TicketPurchasedEvent;
import com.urbanmovems.tickets.exception.TicketNotFoundException;
import com.urbanmovems.tickets.exception.TicketNotPayableException;
import com.urbanmovems.tickets.exception.TrajetNotFoundException;
import com.urbanmovems.tickets.model.Price;
import com.urbanmovems.tickets.model.Ticket;
import com.urbanmovems.tickets.model.TicketStatus;
import com.urbanmovems.tickets.repository.TicketRepository;
import com.urbanmovems.tickets.service.EventPublisher;
import com.urbanmovems.tickets.service.TicketService;
import com.urbanmovems.tickets.service.TrajetClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final TrajetClient trajetClient;
    private final EventPublisher eventPublisher;

    @Value("${ticket.reservation.expiry-minutes:30}")
    private int reservationExpiryMinutes;

    @Value("${ticket.price.default-amount:1500}")
    private int defaultPriceAmount;

    @Value("${ticket.price.currency:MAD}")
    private String defaultCurrency;

    @Value("${services.trajet.enabled:true}")
    private boolean trajetServiceEnabled;

    @Override
    @Transactional
    public TicketResponse createTicket(TicketRequest request, UUID idempotencyKey) {
        log.info("Creating ticket for user {} and trajet {}", request.getUserId(), request.getTrajetId());

        // Vérifier que le trajet existe (si service trajet actif)
        if (trajetServiceEnabled && !trajetClient.trajetExists(request.getTrajetId())) {
            throw new TrajetNotFoundException("Le trajet avec l'ID " + request.getTrajetId() + " n'existe pas");
        }

        // Calculer le prix (prix par défaut * quantité ou prix du trajet si disponible)
        int unitPrice = trajetServiceEnabled ?
                trajetClient.getTrajetPrice(request.getTrajetId()) :
                defaultPriceAmount;

        Price totalPrice = new Price(unitPrice * request.getQuantity(), defaultCurrency);

        // Créer le ticket
        Ticket ticket = Ticket.builder()
                .userId(request.getUserId())
                .trajetId(request.getTrajetId())
                .quantity(request.getQuantity())
                .status(TicketStatus.RESERVED)
                .price(totalPrice)
                .expiresAt(LocalDateTime.now().plusMinutes(reservationExpiryMinutes))
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);
        log.info("Ticket created successfully with ID: {}", savedTicket.getId());

        // Publier l'événement
        TicketPurchasedEvent event = TicketPurchasedEvent.builder()
                .ticketId(savedTicket.getId())
                .userId(savedTicket.getUserId())
                .trajetId(savedTicket.getTrajetId())
                .quantity(savedTicket.getQuantity())
                .priceAmount(savedTicket.getPrice().getAmount())
                .priceCurrency(savedTicket.getPrice().getCurrency())
                .purchasedAt(savedTicket.getCreatedAt())
                .expiresAt(savedTicket.getExpiresAt())
                .build();

        eventPublisher.publishTicketPurchased(event);

        return TicketResponse.fromTicket(savedTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketResponse getTicketById(UUID ticketId) {
        log.debug("Fetching ticket with ID: {}", ticketId);
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket avec l'ID " + ticketId + " non trouvé"));
        return TicketResponse.fromTicket(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getAllTickets() {
        log.debug("Fetching all tickets");
        return ticketRepository.findAll().stream()
                .map(TicketResponse::fromTicket)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsByUserId(UUID userId) {
        log.debug("Fetching tickets for user: {}", userId);
        return ticketRepository.findByUserId(userId).stream()
                .map(TicketResponse::fromTicket)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsByStatus(TicketStatus status) {
        log.debug("Fetching tickets with status: {}", status);
        return ticketRepository.findByStatus(status).stream()
                .map(TicketResponse::fromTicket)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<TicketResponse> getTicketsByTrajetId(Long trajetId) {
        log.debug("Fetching tickets for trajet: {}", trajetId);
        return ticketRepository.findByTrajetId(trajetId).stream()
                .map(TicketResponse::fromTicket)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TicketResponse cancelTicket(UUID ticketId) {
        log.info("Cancelling ticket with ID: {}", ticketId);

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new TicketNotFoundException("Ticket avec l'ID " + ticketId + " non trouvé"));

        if (!ticket.canBeCancelled()) {
            throw new TicketNotPayableException(
                    "Le ticket ne peut pas être annulé car il est déjà dans l'état: " + ticket.getStatus());
        }

        ticket.markAsCancelled();
        Ticket savedTicket = ticketRepository.save(ticket);
        log.info("Ticket cancelled successfully: {}", ticketId);

        // Publier l'événement
        TicketCancelledEvent event = TicketCancelledEvent.builder()
                .ticketId(savedTicket.getId())
                .userId(savedTicket.getUserId())
                .trajetId(savedTicket.getTrajetId())
                .cancelledAt(LocalDateTime.now())
                .reason("Annulation par l'utilisateur")
                .build();

        eventPublisher.publishTicketCancelled(event);

        return TicketResponse.fromTicket(savedTicket);
    }

    @Override
    @Transactional
    public void markExpiredTickets() {
        log.info("Marking expired tickets");
        List<Ticket> expiredTickets = ticketRepository.findExpiredTickets(LocalDateTime.now());

        for (Ticket ticket : expiredTickets) {
            ticket.markAsExpired();
            ticketRepository.save(ticket);
            log.info("Ticket {} marked as expired", ticket.getId());
        }

        log.info("Marked {} expired tickets", expiredTickets.size());
    }
}