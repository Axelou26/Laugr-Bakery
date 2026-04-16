package com.cookieshop.repository;

import com.cookieshop.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findAllByOrderByCreatedAtDesc();

    Optional<Order> findByPaypalOrderId(String paypalOrderId);

    /** Pour capture PayPal + toDto : items / cookie / user chargés dans la même session. */
    @Query("SELECT DISTINCT o FROM Order o "
            + "LEFT JOIN FETCH o.items i "
            + "LEFT JOIN FETCH i.cookie "
            + "LEFT JOIN FETCH o.user "
            + "LEFT JOIN FETCH o.promoCode "
            + "WHERE o.paypalOrderId = :paypalOrderId")
    Optional<Order> findByPaypalOrderIdWithDetails(@Param("paypalOrderId") String paypalOrderId);
}
