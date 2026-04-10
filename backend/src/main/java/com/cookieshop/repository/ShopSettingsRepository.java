package com.cookieshop.repository;

import com.cookieshop.entity.ShopSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShopSettingsRepository extends JpaRepository<ShopSettings, Long> {
}
