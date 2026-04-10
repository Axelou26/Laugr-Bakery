package com.cookieshop.service;

import com.cookieshop.dto.BoxOrderDto;
import com.cookieshop.dto.CartItemDto;
import com.cookieshop.dto.OrderDto;
import com.cookieshop.entity.*;
import com.cookieshop.exception.ResourceNotFoundException;
import com.cookieshop.repository.CookieRepository;
import com.cookieshop.repository.OrderRepository;
import com.cookieshop.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CookieRepository cookieRepository;
    private final PayPalService payPalService;
    private final ShopStatusService shopStatusService;
    private final OrderNotificationPublisher orderNotificationPublisher;

    private static final int BOX_SIZE = 6;
    private static final BigDecimal BOX_PRICE = new BigDecimal("18.00");

    @Transactional
    public OrderDto createOrder(Long userId, List<CartItemDto> cartItems, List<BoxOrderDto> boxes,
                               String shippingAddress, LocalDate deliveryDate, Order.PaymentMethod paymentMethod) {
        if (!shopStatusService.isSalesOpen()) {
            throw new IllegalStateException("Les ventes sont actuellement fermées. Revenez plus tard.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if ((cartItems == null || cartItems.isEmpty()) && (boxes == null || boxes.isEmpty())) {
            throw new IllegalArgumentException("Le panier ne peut pas être vide");
        }

        if (deliveryDate == null) {
            throw new IllegalArgumentException("La date de livraison est obligatoire");
        }
        if (shippingAddress == null || shippingAddress.isBlank()) {
            throw new IllegalArgumentException("Choisissez un mode de livraison ou de retrait");
        }
        List<LocalDate> allowedDates = shopStatusService.getDeliveryDates();
        if (allowedDates.isEmpty()) {
            throw new IllegalStateException("Aucune date de livraison n'est configurée pour le moment.");
        }
        if (!allowedDates.contains(deliveryDate)) {
            throw new IllegalArgumentException("Cette date de livraison n'est pas disponible");
        }

        Order order = Order.builder()
                .user(user)
                .shippingAddress(shippingAddress)
                .deliveryDate(deliveryDate)
                .paymentMethod(paymentMethod)
                .status(Order.OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        if (cartItems != null) {
            for (CartItemDto item : cartItems) {
                Cookie cookie = cookieRepository.findById(item.getCookieId())
                        .orElseThrow(() -> new ResourceNotFoundException("Cookie", item.getCookieId()));

                if (cookie.getStockQuantity() < item.getQuantity()) {
                    throw new RuntimeException("Stock insuffisant pour : " + cookie.getName());
                }

                BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : cookie.getPrice();
                BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.getQuantity()));
                total = total.add(subtotal);

                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .cookie(cookie)
                        .quantity(item.getQuantity())
                        .unitPrice(unitPrice)
                        .build();
                order.getItems().add(orderItem);

                cookie.setStockQuantity(cookie.getStockQuantity() - item.getQuantity());
                cookieRepository.save(cookie);
            }
        }

        if (boxes != null) {
            for (BoxOrderDto box : boxes) {
                int totalQty = box.getItems().stream()
                        .mapToInt(BoxOrderDto.BoxItemDto::getQuantity)
                        .sum();
                if (totalQty != BOX_SIZE) {
                    throw new IllegalArgumentException("Une box doit contenir exactement 6 cookies");
                }

                BigDecimal pricePerUnit = BOX_PRICE.divide(BigDecimal.valueOf(BOX_SIZE), 2, java.math.RoundingMode.HALF_UP);

                for (BoxOrderDto.BoxItemDto bi : box.getItems()) {
                    Cookie cookie = cookieRepository.findById(bi.getCookieId())
                            .orElseThrow(() -> new ResourceNotFoundException("Cookie", bi.getCookieId()));

                    if (cookie.getStockQuantity() < bi.getQuantity()) {
                        throw new RuntimeException("Stock insuffisant pour : " + cookie.getName());
                    }

                    OrderItem orderItem = OrderItem.builder()
                            .order(order)
                            .cookie(cookie)
                            .quantity(bi.getQuantity())
                            .unitPrice(pricePerUnit)
                            .build();
                    order.getItems().add(orderItem);

                    cookie.setStockQuantity(cookie.getStockQuantity() - bi.getQuantity());
                    cookieRepository.save(cookie);
                }
                total = total.add(BOX_PRICE);
            }
        }

        order.setTotalAmount(total);

        if (paymentMethod == Order.PaymentMethod.PAYPAL) {
            if (!payPalService.isEnabled()) {
                throw new RuntimeException("Le paiement PayPal n'est pas disponible. Choisissez « Paiement à la livraison ».");
            }
            String paypalOrderId = payPalService.createOrder(total, "EUR");
            order.setPaypalOrderId(paypalOrderId);
        }

        order = orderRepository.save(order);
        OrderDto dto = toDto(order);
        orderNotificationPublisher.notifyNewOrder(dto);
        return dto;
    }

    @Transactional
    public OrderDto capturePayPalOrder(Long userId, String paypalOrderId) {
        com.cookieshop.entity.Order order = orderRepository.findByPaypalOrderId(paypalOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande non trouvée"));

        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé");
        }
        if (order.getPaymentMethod() != Order.PaymentMethod.PAYPAL) {
            throw new RuntimeException("Cette commande n'est pas une commande PayPal");
        }
        if (order.getStatus() != Order.OrderStatus.PENDING) {
            throw new RuntimeException("Cette commande a déjà été traitée");
        }

        if (!payPalService.captureOrder(paypalOrderId)) {
            throw new RuntimeException("Échec du paiement PayPal");
        }

        order.setStatus(Order.OrderStatus.CONFIRMED);
        orderRepository.save(order);
        OrderDto dto = toDto(order);
        orderNotificationPublisher.notifyOrderStatusToUser(dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getOrdersByUser(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderDto getOrderById(Long id, Long userId) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Commande", id));
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Accès non autorisé");
        }
        return toDto(order);
    }

    @Transactional(readOnly = true)
    public List<OrderDto> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderDto updateOrderStatus(Long orderId, Order.OrderStatus status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Commande", orderId));
        order.setStatus(status);
        order = orderRepository.save(order);
        OrderDto dto = toDto(order);
        orderNotificationPublisher.notifyOrderStatusToUser(dto);
        return dto;
    }

    private OrderDto toDto(Order order) {
        List<OrderDto.OrderItemDto> items = order.getItems().stream()
                .map(i -> new OrderDto.OrderItemDto(
                        i.getCookie().getId(),
                        i.getCookie().getName(),
                        i.getQuantity(),
                        i.getUnitPrice()
                ))
                .collect(Collectors.toList());

        return OrderDto.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .customerEmail(order.getUser().getEmail())
                .customerName(order.getUser().getFirstName() + " " + order.getUser().getLastName())
                .items(items)
                .totalAmount(order.getTotalAmount())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .shippingAddress(order.getShippingAddress())
                .deliveryDate(order.getDeliveryDate())
                .paymentMethod(order.getPaymentMethod())
                .paypalOrderId(order.getPaypalOrderId())
                .build();
    }
}
