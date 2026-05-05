package com.cookieshop.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryImageStorageService {

    private final Cloudinary cloudinary;
    private final boolean enabled;

    public CloudinaryImageStorageService(
            @Value("${cloudinary.cloud-name:}") String cloudName,
            @Value("${cloudinary.api-key:}") String apiKey,
            @Value("${cloudinary.api-secret:}") String apiSecret) {
        this.enabled = !isBlank(cloudName) && !isBlank(apiKey) && !isBlank(apiSecret);
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    public String uploadCookieImage(MultipartFile file, String publicId) throws IOException {
        if (!enabled) {
            throw new IllegalStateException("Cloudinary non configuré (cloud-name/api-key/api-secret).");
        }
        Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "cookieshop/cookies",
                "public_id", publicId,
                "resource_type", "image",
                "overwrite", true
        ));

        Object secureUrl = result.get("secure_url");
        if (secureUrl == null) {
            throw new IOException("Upload Cloudinary sans secure_url.");
        }
        return secureUrl.toString();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
