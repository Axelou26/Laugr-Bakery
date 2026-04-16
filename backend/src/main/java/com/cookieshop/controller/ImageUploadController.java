package com.cookieshop.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/upload")
@PreAuthorize("hasRole('ADMIN')")
public class ImageUploadController {

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    /** Vide en prod si non défini : l’URL publique est alors dérivée de la requête (proxy Render). */
    @Value("${app.base-url:http://localhost:8081}")
    private String baseUrl;

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Seules les images sont acceptées"));
        }

        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + extension;
        Path uploadPath = Paths.get(uploadDir, "cookies");

        try {
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            String url = publicBaseUrl(request) + "/uploads/cookies/" + filename;
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors de l'upload"));
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }

    /**
     * URL absolue de l’API pour construire les liens d’images visibles depuis le navigateur.
     */
    private String publicBaseUrl(HttpServletRequest request) {
        if (baseUrl != null && !baseUrl.isBlank()) {
            return baseUrl.trim().replaceAll("/+$", "");
        }
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null || scheme.isBlank()) {
            scheme = request.getScheme();
        } else {
            scheme = scheme.split(",")[0].trim();
        }
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null || host.isBlank()) {
            host = request.getHeader("Host");
        }
        if (host == null || host.isBlank()) {
            int port = request.getServerPort();
            host = request.getServerName();
            if (port > 0 && port != 80 && port != 443) {
                host = host + ":" + port;
            }
        } else {
            host = host.split(",")[0].trim();
        }
        return scheme + "://" + host;
    }
}
