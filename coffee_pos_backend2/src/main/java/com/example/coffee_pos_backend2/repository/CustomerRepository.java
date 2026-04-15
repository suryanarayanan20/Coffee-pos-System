package com.example.coffee_pos_backend2.repository;

import com.example.coffee_pos_backend2.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhoneOrEmail(String phone, String email);

    Optional<Customer> findByPhone(String phone);
}
