package com.cookieshop.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Bases déjà créées avant l'ajout de {@code delivery_pickup_dates_csv} : Hibernate
 * n'ajoute pas toujours la colonne sur H2 fichier. Patch idempotent (H2 / PostgreSQL).
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class SchemaPatchRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute(
                    "ALTER TABLE shop_settings ADD COLUMN IF NOT EXISTS delivery_pickup_dates_csv VARCHAR(1200) DEFAULT '' NOT NULL");
        } catch (Exception e) {
            log.warn("Impossible d'appliquer le patch schema shop_settings (colonne retrait) : {}", e.getMessage());
        }
    }
}
