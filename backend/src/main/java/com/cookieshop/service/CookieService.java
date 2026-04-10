package com.cookieshop.service;

import com.cookieshop.dto.CookieDto;
import com.cookieshop.entity.Cookie;
import com.cookieshop.exception.ConflictException;
import com.cookieshop.exception.ResourceNotFoundException;
import com.cookieshop.repository.CookieRepository;
import com.cookieshop.repository.OrderItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CookieService {

    private final CookieRepository cookieRepository;
    private final OrderItemRepository orderItemRepository;

    public List<CookieDto> getAllCookies() {
        return cookieRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<CookieDto> getAvailableCookies() {
        return cookieRepository.findByAvailableTrue().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<CookieDto> search(
            String search,
            String category,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean availableOnly
    ) {
        return cookieRepository.search(search, category, minPrice, maxPrice, availableOnly).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<String> getDistinctCategories() {
        return cookieRepository.findDistinctCategories();
    }

    public List<CookieDto> getLowStockCookies(int threshold) {
        return cookieRepository.findAll().stream()
                .filter(c -> c.getStockQuantity() <= threshold && c.getStockQuantity() >= 0)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public CookieDto getById(Long id) {
        Cookie cookie = cookieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cookie", id));
        return toDto(cookie);
    }

    @Transactional
    public CookieDto create(CookieDto dto) {
        Cookie cookie = Cookie.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .stockQuantity(dto.getStockQuantity())
                .imageUrl(dto.getImageUrl())
                .category(dto.getCategory())
                .available(dto.isAvailable())
                .build();
        cookie = cookieRepository.save(cookie);
        return toDto(cookie);
    }

    @Transactional
    public CookieDto update(Long id, CookieDto dto) {
        Cookie cookie = cookieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cookie", id));
        cookie.setName(dto.getName());
        cookie.setDescription(dto.getDescription());
        cookie.setPrice(dto.getPrice());
        cookie.setStockQuantity(dto.getStockQuantity());
        cookie.setImageUrl(dto.getImageUrl());
        cookie.setCategory(dto.getCategory());
        cookie.setAvailable(dto.isAvailable());
        cookie = cookieRepository.save(cookie);
        return toDto(cookie);
    }

    @Transactional
    public void delete(Long id) {
        if (!cookieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cookie", id);
        }
        if (orderItemRepository.existsByCookie_Id(id)) {
            throw new ConflictException(
                    "Impossible de supprimer ce cookie : il figure dans une ou plusieurs commandes. "
                            + "Désactivez-le à la vente (rupture) ou masquez-le plutôt que de le supprimer.");
        }
        cookieRepository.deleteById(id);
    }

    private CookieDto toDto(Cookie cookie) {
        return CookieDto.builder()
                .id(cookie.getId())
                .name(cookie.getName())
                .description(cookie.getDescription())
                .price(cookie.getPrice())
                .stockQuantity(cookie.getStockQuantity())
                .imageUrl(cookie.getImageUrl())
                .category(cookie.getCategory())
                .available(cookie.isAvailable())
                .build();
    }
}
