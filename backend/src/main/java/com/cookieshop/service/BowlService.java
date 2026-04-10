package com.cookieshop.service;

import com.cookieshop.dto.BowlDto;
import com.cookieshop.entity.Bowl;
import com.cookieshop.exception.ResourceNotFoundException;
import com.cookieshop.repository.BowlRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BowlService {

    private final BowlRepository bowlRepository;

    public List<BowlDto> getAll(Boolean availableOnly) {
        return bowlRepository.findAll().stream()
                .filter(b -> !Boolean.TRUE.equals(availableOnly)
                        || (b.isAvailable() && b.getStockQuantity() > 0))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public BowlDto getById(Long id) {
        Bowl bowl = bowlRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bowl", id));
        return toDto(bowl);
    }

    @Transactional
    public BowlDto create(BowlDto dto) {
        Bowl bowl = Bowl.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .stockQuantity(dto.getStockQuantity())
                .imageUrl(dto.getImageUrl())
                .available(dto.isAvailable())
                .build();
        return toDto(bowlRepository.save(bowl));
    }

    @Transactional
    public BowlDto update(Long id, BowlDto dto) {
        Bowl bowl = bowlRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bowl", id));
        bowl.setName(dto.getName());
        bowl.setDescription(dto.getDescription());
        bowl.setPrice(dto.getPrice());
        bowl.setStockQuantity(dto.getStockQuantity());
        bowl.setImageUrl(dto.getImageUrl());
        bowl.setAvailable(dto.isAvailable());
        return toDto(bowlRepository.save(bowl));
    }

    @Transactional
    public void delete(Long id) {
        if (!bowlRepository.existsById(id)) {
            throw new ResourceNotFoundException("Bowl", id);
        }
        bowlRepository.deleteById(id);
    }

    private BowlDto toDto(Bowl bowl) {
        return BowlDto.builder()
                .id(bowl.getId())
                .name(bowl.getName())
                .description(bowl.getDescription())
                .price(bowl.getPrice())
                .stockQuantity(bowl.getStockQuantity())
                .imageUrl(bowl.getImageUrl())
                .available(bowl.isAvailable())
                .build();
    }
}

