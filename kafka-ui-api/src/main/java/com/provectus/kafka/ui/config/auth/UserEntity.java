package com.provectus.kafka.ui.config.auth;

public record UserEntity(
    long id,
    String username,
    String passwordHash,
    boolean enabled,
    String createdAt,
    String updatedAt
) {
}
