package com.cookieshop.repository;

import com.cookieshop.entity.Cookie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface CookieRepository extends JpaRepository<Cookie, Long> {

    List<Cookie> findByAvailableTrue();

    @Query("SELECT c FROM Cookie c WHERE " +
           "(:search IS NULL OR :search = '' OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(COALESCE(c.description,'')) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:category IS NULL OR :category = '' OR c.category = :category) AND " +
           "(:minPrice IS NULL OR c.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR c.price <= :maxPrice) AND " +
           "(:availableOnly IS NULL OR :availableOnly = false OR (c.available = true AND c.stockQuantity > 0))")
    List<Cookie> search(@Param("search") String search,
                        @Param("category") String category,
                        @Param("minPrice") BigDecimal minPrice,
                        @Param("maxPrice") BigDecimal maxPrice,
                        @Param("availableOnly") Boolean availableOnly);

    @Query("SELECT DISTINCT c.category FROM Cookie c WHERE c.category IS NOT NULL AND c.category != '' ORDER BY c.category")
    List<String> findDistinctCategories();
}
