package com.example.coffee_pos_backend2.controller;

import com.example.coffee_pos_backend2.entity.Customer;
import com.example.coffee_pos_backend2.entity.OrderEntity;

public class OrderRequest {

    private Customer customer;
    private OrderEntity order;

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public OrderEntity getOrder() { return order; }
    public void setOrder(OrderEntity order) { this.order = order; }
}
