package com.cookieshop.service;

import com.cookieshop.dto.OrderDto;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEmailNotificationService {

    private static final DateTimeFormatter DATE_TIME =
            DateTimeFormatter.ofPattern("d MMMM yyyy 'à' HH:mm", Locale.FRANCE);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.notifications.owner-email:laura.judooo@icloud.com}")
    private String ownerEmail;

    @Value("${spring.mail.username:}")
    private String mailFrom;

    /**
     * Envoie un e-mail à la boutique (sans propager d’erreur : une panne SMTP n’annule pas la commande).
     */
    public void sendNewOrderNotification(OrderDto order) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.debug("JavaMailSender absent (définissez MAIL_HOST) — e-mail commande #{} non envoyé.", order.getId());
            return;
        }
        if (mailFrom == null || mailFrom.isBlank()) {
            log.warn("spring.mail.username vide — e-mail pour commande #{} non envoyé.", order.getId());
            return;
        }
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, StandardCharsets.UTF_8.name());
            helper.setFrom(mailFrom);
            helper.setTo(ownerEmail);
            helper.setSubject("Nouvelle commande #" + order.getId() + " — " + formatMoney(order.getTotalAmount()) + " €");
            helper.setText(buildBody(order), false);
            mailSender.send(mime);
            log.info("Notification e-mail envoyée pour la commande #{} à {}", order.getId(), ownerEmail);
        } catch (Exception e) {
            log.error("Échec envoi e-mail commande #{} : {}", order.getId(), e.getMessage());
        }
    }

    private static String formatMoney(BigDecimal amount) {
        if (amount == null) {
            return "—";
        }
        return amount.stripTrailingZeros().toPlainString();
    }

    private static String buildBody(OrderDto order) {
        StringBuilder sb = new StringBuilder();
        sb.append("Une nouvelle commande a été enregistrée.\n\n");
        sb.append("Commande n° ").append(order.getId()).append("\n");
        sb.append("Client : ").append(nvl(order.getCustomerName())).append("\n");
        sb.append("E-mail client : ").append(nvl(order.getCustomerEmail())).append("\n");
        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            sb.append("Code promo : ").append(nvl(order.getAppliedPromoCode())).append("\n");
            sb.append("Remise : -").append(formatMoney(order.getDiscountAmount())).append(" €\n");
        }
        sb.append("Montant total : ").append(formatMoney(order.getTotalAmount())).append(" €\n");
        sb.append("Statut : ").append(order.getStatus()).append("\n");
        sb.append("Paiement : ").append(order.getPaymentMethod()).append("\n");
        sb.append("Livraison / retrait : ").append(nvl(order.getShippingAddress())).append("\n");
        if (order.getDeliveryDate() != null) {
            sb.append("Créneau : ").append(order.getDeliveryDate().format(DATE_TIME)).append("\n");
        }
        sb.append("\nDétail :\n");
        if (order.getItems() != null) {
            for (OrderDto.OrderItemDto i : order.getItems()) {
                sb.append(" - ")
                        .append(nvl(i.getCookieName()))
                        .append(" × ")
                        .append(i.getQuantity())
                        .append(" @ ")
                        .append(formatMoney(i.getUnitPrice()))
                        .append(" €\n");
            }
        }
        sb.append("\n— Message automatique Laugr Bakery");
        return sb.toString();
    }

    private static String nvl(String s) {
        return s != null ? s : "";
    }
}
