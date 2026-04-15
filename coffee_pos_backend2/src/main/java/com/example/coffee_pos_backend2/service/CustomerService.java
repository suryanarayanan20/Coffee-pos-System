package com.example.coffee_pos_backend2.service;

import com.example.coffee_pos_backend2.entity.Customer;
import com.example.coffee_pos_backend2.repository.CustomerRepository;
import org.springframework.stereotype.Service;

@Service
public class CustomerService {

    private final CustomerRepository repo;

    public CustomerService(CustomerRepository repo) {
        this.repo = repo;
    }

    public Customer findOrCreate(Customer input) {
        return repo.findByPhoneOrEmail(input.getPhone(), input.getEmail())
                .orElseGet(() -> repo.save(input));
    }
}
