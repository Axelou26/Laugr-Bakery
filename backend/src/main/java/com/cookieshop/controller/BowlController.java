package com.cookieshop.controller;

import com.cookieshop.dto.BowlDto;
import com.cookieshop.service.BowlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bowls")
@RequiredArgsConstructor
public class BowlController {

    private final BowlService bowlService;

    @GetMapping
    public List<BowlDto> getAll(@RequestParam(required = false) Boolean availableOnly) {
        return bowlService.getAll(availableOnly);
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<BowlDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(bowlService.getById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BowlDto> create(@Valid @RequestBody BowlDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bowlService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BowlDto> update(@PathVariable Long id, @Valid @RequestBody BowlDto dto) {
        return ResponseEntity.ok(bowlService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bowlService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

