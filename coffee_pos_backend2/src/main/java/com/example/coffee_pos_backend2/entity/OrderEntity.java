package com.example.coffee_pos_backend2.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
public class OrderEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String items;
    private double totalAmount;
    private LocalDateTime orderTime;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    @com.fasterxml.jackson.annotation.JsonBackReference
    private Customer customer;


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getItems() { return items; }
    public void setItems(String items) { this.items = items; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public LocalDateTime getOrderTime() { return orderTime; }
    public void setOrderTime(LocalDateTime orderTime) { this.orderTime = orderTime; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }
}
