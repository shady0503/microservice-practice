package com.microservices.orders;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private WebClient.Builder webClientBuilder;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public List<Order> getOrdersByUserId(Long userId) {
        return orderRepository.findByUserId(userId);
    }

    public List<Order> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    public Order createOrder(Order order) {
        // Validate user exists by calling User Service
        Boolean userExists = webClientBuilder.build()
                .get()
                .uri("http://user-service:8080/users/" + order.getUserId())
                .retrieve()
                .toBodilessEntity()
                .map(response -> response.getStatusCode().is2xxSuccessful())
                .block();

        if (userExists == null || !userExists) {
            throw new RuntimeException("User not found with id: " + order.getUserId());
        }

        // Validate product exists by calling Product Service
        Boolean productExists = webClientBuilder.build()
                .get()
                .uri("http://product-service:8080/products/" + order.getProductId())
                .retrieve()
                .toBodilessEntity()
                .map(response -> response.getStatusCode().is2xxSuccessful())
                .block();

        if (productExists == null || !productExists) {
            throw new RuntimeException("Product not found with id: " + order.getProductId());
        }

        return orderRepository.save(order);
    }

    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        order.setStatus(status);
        return orderRepository.save(order);
    }

    public Order updateOrder(Long id, Order orderDetails) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

        order.setQuantity(orderDetails.getQuantity());
        order.setTotalPrice(orderDetails.getTotalPrice());
        order.setStatus(orderDetails.getStatus());

        return orderRepository.save(order);
    }

    public void deleteOrder(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        orderRepository.delete(order);
    }
}
