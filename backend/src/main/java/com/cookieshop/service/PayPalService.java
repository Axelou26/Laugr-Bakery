package com.cookieshop.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.Base64;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayPalService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${paypal.client-id:}")
    private String clientId;

    @Value("${paypal.client-secret:}")
    private String clientSecret;

    @Value("${paypal.mode:sandbox}")
    private String mode;

    private static final String SANDBOX_URL = "https://api-m.sandbox.paypal.com";
    private static final String LIVE_URL = "https://api-m.paypal.com";

    public boolean isEnabled() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }

    public String createOrder(BigDecimal totalAmount, String currency) {
        if (!isEnabled()) {
            throw new IllegalStateException("PayPal n'est pas configuré. Définissez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET.");
        }

        String token = getAccessToken();
        String baseUrl = "sandbox".equalsIgnoreCase(mode) ? SANDBOX_URL : LIVE_URL;

        ObjectNode body = objectMapper.createObjectNode();
        body.put("intent", "CAPTURE");

        ArrayNode purchaseUnits = objectMapper.createArrayNode();
        ObjectNode unit = objectMapper.createObjectNode();
        ObjectNode amount = objectMapper.createObjectNode();
        amount.put("currency_code", currency);
        amount.put("value", totalAmount.setScale(2, java.math.RoundingMode.HALF_UP).toString());
        unit.set("amount", amount);
        purchaseUnits.add(unit);
        body.set("purchase_units", purchaseUnits);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/v2/checkout/orders",
                HttpMethod.POST,
                new HttpEntity<>(body.toString(), headers),
                String.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode json = objectMapper.readTree(response.getBody());
                return json.path("id").asText();
            } catch (Exception e) {
                log.error("Erreur parsing PayPal response", e);
                throw new RuntimeException("Erreur PayPal");
            }
        }
        String body = response.getBody();
        String snippet = body == null ? "" : (body.length() > 800 ? body.substring(0, 800) + "…" : body);
        log.warn("PayPal create order failed: {} — {}", response.getStatusCode(), snippet);
        throw new RuntimeException("Échec création commande PayPal (" + response.getStatusCode() + ")"
                + (snippet.isEmpty() ? "" : " : " + snippet));
    }

    public boolean captureOrder(String paypalOrderId) {
        if (!isEnabled()) return false;

        String token = getAccessToken();
        String baseUrl = "sandbox".equalsIgnoreCase(mode) ? SANDBOX_URL : LIVE_URL;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/v2/checkout/orders/" + paypalOrderId + "/capture",
                HttpMethod.POST,
                new HttpEntity<>("{}", headers),
                String.class
        );

        return response.getStatusCode().is2xxSuccessful();
    }

    private String getAccessToken() {
        String baseUrl = "sandbox".equalsIgnoreCase(mode) ? SANDBOX_URL : LIVE_URL;
        String auth = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        headers.set("Authorization", "Basic " + auth);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        ResponseEntity<String> response = restTemplate.exchange(
                baseUrl + "/v1/oauth2/token",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                String.class
        );

        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode json = objectMapper.readTree(response.getBody());
                return json.path("access_token").asText();
            } catch (Exception e) {
                throw new RuntimeException("Erreur token PayPal");
            }
        }
        throw new RuntimeException("Échec authentification PayPal");
    }
}
