package com.example.coffee_pos_backend2.service;

import com.example.coffee_pos_backend2.entity.Customer;
import com.example.coffee_pos_backend2.entity.OrderEntity;
import com.example.coffee_pos_backend2.repository.OrderRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository repo;

    public OrderService(OrderRepository repo) {
        this.repo = repo;
    }

    public OrderEntity createOrder(Customer customer, OrderEntity order) {
        order.setCustomer(customer);
        order.setOrderTime(LocalDateTime.now());
        return repo.save(order);
    }

    public List<OrderEntity> getOrders(Long customerId) {
        return repo.findByCustomerId(customerId);
    }
}
