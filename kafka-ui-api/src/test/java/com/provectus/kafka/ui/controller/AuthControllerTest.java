package com.provectus.kafka.ui.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.provectus.kafka.ui.config.auth.LoginEncryptionService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

class AuthControllerTest {

  @Test
  void authPageSubmitsEncryptedPasswordInsteadOfPlainPassword() throws Exception {
    AuthController controller = new AuthController(new LoginEncryptionService());
    MockServerWebExchange exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/auth"));

    byte[] body = controller.getAuth(exchange).block();

    assertThat(body).isNotNull();
    String page = new String(body);
    assertThat(page).doesNotContain("id=\"password\" name=\"password\"");
    assertThat(page).contains("id=\"encryptedPassword\" name=\"password\"");
    assertThat(page).contains("crypto.subtle.encrypt");
    assertThat(page).contains("/auth/public-key");
  }
}
