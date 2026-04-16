package com.cookieshop.service;

import com.cookieshop.dto.PromoCodeDto;
import com.cookieshop.entity.PromoCode;
import com.cookieshop.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    public static String normalizeCode(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim().toUpperCase();
    }

    @Transactional(readOnly = true)
    public List<PromoCodeDto> listAll() {
        return promoCodeRepository.findAll().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public PromoCodeDto create(PromoCodeDto input) {
        String code = normalizeCode(input.getCode());
        if (code.isEmpty()) {
            throw new IllegalArgumentException("Le code promo est obligatoire");
        }
        if (promoCodeRepository.existsByCodeIgnoreCase(code)) {
            throw new IllegalArgumentException("Ce code promo existe déjà");
        }
        validateDiscount(input.getDiscountType(), input.getDiscountValue());
        PromoCode entity = PromoCode.builder()
                .code(code)
                .description(input.getDescription() != null ? input.getDescription().trim() : null)
                .discountType(input.getDiscountType())
                .discountValue(input.getDiscountValue().setScale(2, RoundingMode.HALF_UP))
                .active(input.isActive())
                .validFrom(input.getValidFrom())
                .validTo(input.getValidTo())
                .minOrderAmount(input.getMinOrderAmount() != null
                        ? input.getMinOrderAmount().setScale(2, RoundingMode.HALF_UP)
                        : null)
                .maxUses(input.getMaxUses())
                .usedCount(0)
                .build();
        return toDto(promoCodeRepository.save(entity));
    }

    @Transactional
    public PromoCodeDto update(Long id, PromoCodeDto input) {
        PromoCode entity = promoCodeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Code promo introuvable"));
        String newCode = normalizeCode(input.getCode());
        if (newCode.isEmpty()) {
            throw new IllegalArgumentException("Le code promo est obligatoire");
        }
        if (!newCode.equalsIgnoreCase(entity.getCode())
                && promoCodeRepository.existsByCodeIgnoreCase(newCode)) {
            throw new IllegalArgumentException("Ce code promo existe déjà");
        }
        validateDiscount(input.getDiscountType(), input.getDiscountValue());
        entity.setCode(newCode);
        entity.setDescription(input.getDescription() != null ? input.getDescription().trim() : null);
        entity.setDiscountType(input.getDiscountType());
        entity.setDiscountValue(input.getDiscountValue().setScale(2, RoundingMode.HALF_UP));
        entity.setActive(input.isActive());
        entity.setValidFrom(input.getValidFrom());
        entity.setValidTo(input.getValidTo());
        entity.setMinOrderAmount(input.getMinOrderAmount() != null
                ? input.getMinOrderAmount().setScale(2, RoundingMode.HALF_UP)
                : null);
        entity.setMaxUses(input.getMaxUses());
        if (entity.getMaxUses() != null && entity.getMaxUses() < entity.getUsedCount()) {
            throw new IllegalArgumentException(
                    "Le nombre d'utilisations max ne peut pas être inférieur au nombre déjà utilisé (" + entity.getUsedCount() + ")");
        }
        return toDto(promoCodeRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        if (!promoCodeRepository.existsById(id)) {
            throw new IllegalArgumentException("Code promo introuvable");
        }
        promoCodeRepository.deleteById(id);
    }

    /**
     * Aperçu public (sans verrou) pour le panier : le montant réel est recalculé à la commande.
     */
    @Transactional(readOnly = true)
    public PromoValidationResult validateForCart(String rawCode, BigDecimal cartSubtotal) {
        String code = normalizeCode(rawCode);
        if (code.isEmpty()) {
            return PromoValidationResult.invalid("Saisissez un code promo");
        }
        BigDecimal normalized = cartSubtotal == null || cartSubtotal.compareTo(BigDecimal.ZERO) < 0
                ? BigDecimal.ZERO
                : cartSubtotal;
        final BigDecimal subtotal = normalized.setScale(2, RoundingMode.HALF_UP);
        return promoCodeRepository.findByCodeIgnoreCase(code)
                .map(p -> buildValidResult(p, subtotal))
                .orElseGet(() -> PromoValidationResult.invalid("Code promo inconnu"));
    }

    /**
     * Charge le code avec verrou pessimiste et vérifie les règles (commande).
     */
    @Transactional
    public PromoResolution resolveWithLockOrThrow(String rawCode, BigDecimal orderSubtotal) {
        String code = normalizeCode(rawCode);
        if (code.isEmpty()) {
            throw new IllegalArgumentException("Code promo invalide");
        }
        orderSubtotal = orderSubtotal != null ? orderSubtotal.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        PromoCode promo = promoCodeRepository.findByNormalizedCodeForUpdate(code)
                .orElseThrow(() -> new IllegalArgumentException("Code promo inconnu ou expiré"));
        PromoValidationResult check = buildValidResult(promo, orderSubtotal);
        if (!check.valid()) {
            throw new IllegalArgumentException(check.message() != null ? check.message() : "Code promo non applicable");
        }
        BigDecimal discount = check.discountAmount().setScale(2, RoundingMode.HALF_UP);
        return new PromoResolution(promo, discount, promo.getCode());
    }

    @Transactional
    public void recordRedemption(PromoCode promo) {
        if (promo == null) {
            return;
        }
        promo.setUsedCount(promo.getUsedCount() + 1);
        promoCodeRepository.save(promo);
    }

    private void validateDiscount(PromoCode.DiscountType type, BigDecimal value) {
        if (type == null) {
            throw new IllegalArgumentException("Type de remise obligatoire");
        }
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("La valeur de remise doit être positive");
        }
        if (type == PromoCode.DiscountType.PERCENTAGE && value.compareTo(new BigDecimal("100")) > 0) {
            throw new IllegalArgumentException("Le pourcentage ne peut pas dépasser 100 %");
        }
    }

    private PromoValidationResult buildValidResult(PromoCode p, BigDecimal cartSubtotal) {
        if (!p.isActive()) {
            return PromoValidationResult.invalid("Ce code promo n'est plus actif");
        }
        LocalDateTime now = LocalDateTime.now();
        if (p.getValidFrom() != null && now.isBefore(p.getValidFrom())) {
            return PromoValidationResult.invalid("Ce code promo n'est pas encore valable");
        }
        if (p.getValidTo() != null && now.isAfter(p.getValidTo())) {
            return PromoValidationResult.invalid("Ce code promo a expiré");
        }
        if (p.getMinOrderAmount() != null && cartSubtotal.compareTo(p.getMinOrderAmount()) < 0) {
            return PromoValidationResult.invalid(
                    "Montant minimum non atteint (" + p.getMinOrderAmount().stripTrailingZeros().toPlainString() + " €)");
        }
        if (p.getMaxUses() != null && p.getUsedCount() >= p.getMaxUses()) {
            return PromoValidationResult.invalid("Ce code promo n'a plus d'utilisations disponibles");
        }
        BigDecimal discount = computeDiscountAmount(p, cartSubtotal);
        if (discount.compareTo(BigDecimal.ZERO) <= 0) {
            return PromoValidationResult.invalid("Panier vide ou remise nulle");
        }
        return new PromoValidationResult(true, discount, "Code appliqué", p.getDiscountType(), p.getDiscountValue());
    }

    public BigDecimal computeDiscountAmount(PromoCode p, BigDecimal orderSubtotal) {
        if (orderSubtotal == null || orderSubtotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        orderSubtotal = orderSubtotal.setScale(2, RoundingMode.HALF_UP);
        if (p.getDiscountType() == PromoCode.DiscountType.PERCENTAGE) {
            return orderSubtotal
                    .multiply(p.getDiscountValue())
                    .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP)
                    .min(orderSubtotal);
        }
        return p.getDiscountValue().min(orderSubtotal).setScale(2, RoundingMode.HALF_UP);
    }

    private PromoCodeDto toDto(PromoCode p) {
        return PromoCodeDto.builder()
                .id(p.getId())
                .code(p.getCode())
                .description(p.getDescription())
                .discountType(p.getDiscountType())
                .discountValue(p.getDiscountValue())
                .active(p.isActive())
                .validFrom(p.getValidFrom())
                .validTo(p.getValidTo())
                .minOrderAmount(p.getMinOrderAmount())
                .maxUses(p.getMaxUses())
                .usedCount(p.getUsedCount())
                .createdAt(p.getCreatedAt())
                .build();
    }

    public record PromoValidationResult(
            boolean valid,
            BigDecimal discountAmount,
            String message,
            PromoCode.DiscountType discountType,
            BigDecimal discountValue
    ) {
        public static PromoValidationResult invalid(String message) {
            return new PromoValidationResult(false, BigDecimal.ZERO, message, null, null);
        }
    }

    public record PromoResolution(PromoCode promo, BigDecimal discountAmount, String displayCode) {}
}
