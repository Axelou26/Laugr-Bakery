package com.cookieshop.controller;

import com.cookieshop.service.CloudinaryImageStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/upload")
@PreAuthorize("hasRole('ADMIN')")
public class ImageUploadController {

    private final CloudinaryImageStorageService cloudinaryImageStorageService;

    public ImageUploadController(CloudinaryImageStorageService cloudinaryImageStorageService) {
        this.cloudinaryImageStorageService = cloudinaryImageStorageService;
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> uploadImage(
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Fichier vide"));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Seules les images sont acceptées"));
        }

        try {
            String publicId = UUID.randomUUID().toString();
            String url = cloudinaryImageStorageService.uploadCookieImage(file, publicId);
            return ResponseEntity.ok(Map.of("url", url));
        } catch (IllegalStateException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors de l'upload"));
        }
    }
}
