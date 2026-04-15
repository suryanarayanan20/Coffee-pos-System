package com.example.coffee_pos_backend2.repository;

import com.example.coffee_pos_backend2.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
