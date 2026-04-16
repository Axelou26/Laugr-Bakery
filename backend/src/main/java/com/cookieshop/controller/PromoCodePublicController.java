package com.cookieshop.controller;

import com.cookieshop.service.PromoCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/promo-codes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class PromoCodePublicController {

    private final PromoCodeService promoCodeService;

    @PostMapping("/validate")
    public ResponseEntity<ValidatePromoResponse> validate(@RequestBody ValidatePromoRequest request) {
        BigDecimal subtotal = request.cartSubtotal() != null ? request.cartSubtotal() : BigDecimal.ZERO;
        PromoCodeService.PromoValidationResult r =
                promoCodeService.validateForCart(request.code() != null ? request.code() : "", subtotal);
        return ResponseEntity.ok(new ValidatePromoResponse(
                r.valid(),
                r.discountAmount(),
                r.message(),
                r.discountType() != null ? r.discountType().name() : null,
                r.discountValue()
        ));
    }

    public record ValidatePromoRequest(String code, BigDecimal cartSubtotal) {}

    public record ValidatePromoResponse(
            boolean valid,
            BigDecimal discountAmount,
            String message,
            String discountType,
            BigDecimal discountValue
    ) {}
}
