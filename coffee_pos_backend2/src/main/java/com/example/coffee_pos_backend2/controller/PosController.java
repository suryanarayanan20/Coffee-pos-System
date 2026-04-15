package com.example.coffee_pos_backend2.controller;

import com.example.coffee_pos_backend2.entity.Customer;
import com.example.coffee_pos_backend2.entity.OrderEntity;
import com.example.coffee_pos_backend2.repository.CustomerRepository;
import com.example.coffee_pos_backend2.service.CustomerService;
import com.example.coffee_pos_backend2.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin
public class PosController {

    private final CustomerService customerService;
    private final OrderService orderService;
    private final CustomerRepository customerRepository;

    public PosController(CustomerService customerService,
                         OrderService orderService,
                         CustomerRepository customerRepository) {
        this.customerService = customerService;
        this.orderService = orderService;
        this.customerRepository = customerRepository;
    }

    @PostMapping("/order")
    public Customer placeOrder(@RequestBody OrderRequest request) {
        Customer customer = customerService.findOrCreate(request.getCustomer());
        orderService.createOrder(customer, request.getOrder());
        return customer;
    }

    @GetMapping("/customer/check/{phone}")
    public Customer checkCustomer(@PathVariable String phone) {
        return customerRepository.findByPhone(phone).orElse(null);
    }

    @GetMapping("/customer/{id}/orders")
    public List<OrderEntity> getOrders(@PathVariable Long id) {
        return orderService.getOrders(id);
    }
}
