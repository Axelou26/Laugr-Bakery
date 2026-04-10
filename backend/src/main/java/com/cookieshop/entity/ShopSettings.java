package com.cookieshop.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "shop_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopSettings {
    @Id
    private Long id;

    @Column(nullable = false)
    @Builder.Default
    private boolean salesOpen = true;

    private LocalDateTime nextOpeningAt;

    @Column(nullable = false, length = 600)
    @Builder.Default
    private String deliveryDatesCsv = "";
}
