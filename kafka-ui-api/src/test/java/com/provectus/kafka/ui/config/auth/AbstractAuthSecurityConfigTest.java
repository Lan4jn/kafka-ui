package com.provectus.kafka.ui.config.auth;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

class AbstractAuthSecurityConfigTest {

  @Test
  void authPublicKeyEndpointIsWhitelisted() {
    assertThat(AbstractAuthSecurityConfig.AUTH_WHITELIST).contains("/auth/public-key");
  }

  @Test
  void encryptedPasswordAuthenticationManagerIsOnlyCreatedForLoginForm() {
    assertThat(EncryptedPasswordAuthenticationManager.class)
        .hasAnnotation(ConditionalOnProperty.class);
    ConditionalOnProperty annotation = EncryptedPasswordAuthenticationManager.class
        .getAnnotation(ConditionalOnProperty.class);
    assertThat(annotation.value()).containsExactly("auth.type");
    assertThat(annotation.havingValue()).isEqualTo("LOGIN_FORM");
  }
}
