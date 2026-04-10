package com.cookieshop.controller;

import com.cookieshop.dto.CookieDto;
import com.cookieshop.service.CookieService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/cookies")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:4200")
public class CookieController {

    private final CookieService cookieService;

    @GetMapping("/categories")
    public List<String> getCategories() {
        return cookieService.getDistinctCategories();
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CookieDto> getLowStock(@RequestParam(defaultValue = "10") int threshold) {
        return cookieService.getLowStockCookies(threshold);
    }

    @GetMapping
    public List<CookieDto> getCookies(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean availableOnly) {
        if (search != null || category != null || minPrice != null || maxPrice != null || Boolean.TRUE.equals(availableOnly)) {
            return cookieService.search(search, category, minPrice, maxPrice, availableOnly);
        }
        return cookieService.getAllCookies();
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<CookieDto> getCookie(@PathVariable Long id) {
        return ResponseEntity.ok(cookieService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CookieDto> createCookie(@Valid @RequestBody CookieDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cookieService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CookieDto> updateCookie(@PathVariable Long id, @Valid @RequestBody CookieDto dto) {
        return ResponseEntity.ok(cookieService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCookie(@PathVariable Long id) {
        cookieService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
