package com.cookieshop.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemDto {

    @NotNull(message = "L'ID du cookie est obligatoire")
    private Long cookieId;

    private String cookieName;

    @NotNull
    @Min(value = 1, message = "La quantité doit être au moins 1")
    private Integer quantity;

    private BigDecimal unitPrice;
    private BigDecimal subtotal;
}
