package com.cookieshop.dto;

import com.cookieshop.entity.PromoCode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PromoCodeDto {
    private Long id;
    private String code;
    private String description;
    private PromoCode.DiscountType discountType;
    private BigDecimal discountValue;
    private boolean active;
    private LocalDateTime validFrom;
    private LocalDateTime validTo;
    private BigDecimal minOrderAmount;
    private Integer maxUses;
    private int usedCount;
    private LocalDateTime createdAt;
}
