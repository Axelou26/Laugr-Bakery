package com.cookieshop.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoxOrderDto {

    @NotEmpty(message = "La box doit contenir des cookies")
    @Valid
    private List<BoxItemDto> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BoxItemDto {
        @NotNull
        private Long cookieId;
        @NotNull
        private Integer quantity;
    }
}
