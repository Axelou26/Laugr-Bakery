package com.cookieshop.config;

import com.cookieshop.entity.Cookie;
import com.cookieshop.entity.User;
import com.cookieshop.repository.CookieRepository;
import com.cookieshop.repository.UserRepository;
import com.cookieshop.service.ShopStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CookieRepository cookieRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ShopStatusService shopStatusService;

    @Override
    public void run(String... args) {
        if (cookieRepository.count() == 0) {
            cookieRepository.save(Cookie.builder()
                    .name("Cookie au chocolat")
                    .description("Délicieux cookie avec pépites de chocolat noir")
                    .price(new BigDecimal("2.50"))
                    .stockQuantity(100)
                    .category("Chocolat")
                    .available(true)
                    .build());
            cookieRepository.save(Cookie.builder()
                    .name("Cookie aux noix")
                    .description("Cookie croquant aux noix de pécan")
                    .price(new BigDecimal("3.00"))
                    .stockQuantity(80)
                    .category("Noix")
                    .available(true)
                    .build());
            cookieRepository.save(Cookie.builder()
                    .name("Cookie double chocolat")
                    .description("Pour les amateurs de chocolat !")
                    .price(new BigDecimal("3.50"))
                    .stockQuantity(60)
                    .category("Chocolat")
                    .available(true)
                    .build());
        }

        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .firstName("Test")
                    .lastName("User")
                    .email("test@test.com")
                    .password(passwordEncoder.encode("password123"))
                    .role("CUSTOMER")
                    .build());
        }
        if (userRepository.findByEmail("admin@cookieshop.com").isEmpty()) {
            userRepository.save(User.builder()
                    .firstName("Admin")
                    .lastName("Cookie Shop")
                    .email("admin@cookieshop.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role("ADMIN")
                    .build());
        }

        shopStatusService.ensureInitialized();
    }
}
