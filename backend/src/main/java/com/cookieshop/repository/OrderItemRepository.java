package com.cookieshop.repository;

import com.cookieshop.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    boolean existsByCookie_Id(Long cookieId);
}
