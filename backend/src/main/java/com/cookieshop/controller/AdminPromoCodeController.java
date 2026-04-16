package com.cookieshop.controller;

import com.cookieshop.dto.PromoCodeDto;
import com.cookieshop.service.PromoCodeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/promo-codes")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPromoCodeController {

    private final PromoCodeService promoCodeService;

    @GetMapping
    public List<PromoCodeDto> list() {
        return promoCodeService.listAll();
    }

    @PostMapping
    public ResponseEntity<PromoCodeDto> create(@RequestBody PromoCodeDto body) {
        return ResponseEntity.status(HttpStatus.CREATED).body(promoCodeService.create(body));
    }

    @PutMapping("/{id}")
    public PromoCodeDto update(@PathVariable Long id, @RequestBody PromoCodeDto body) {
        return promoCodeService.update(id, body);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        promoCodeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
