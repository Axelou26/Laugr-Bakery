package com.cookieshop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CookieDto {

    private Long id;

    @NotBlank(message = "Le nom est obligatoire")
    private String name;

    private String description;

    @NotNull
    @DecimalMin("0.01")
    private BigDecimal price;

    private int stockQuantity;

    private String imageUrl;

    private String category;

    private boolean available;

    private boolean isBowl;
}
