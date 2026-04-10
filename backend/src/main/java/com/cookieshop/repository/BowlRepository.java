package com.cookieshop.repository;

import com.cookieshop.entity.Bowl;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BowlRepository extends JpaRepository<Bowl, Long> {
}

