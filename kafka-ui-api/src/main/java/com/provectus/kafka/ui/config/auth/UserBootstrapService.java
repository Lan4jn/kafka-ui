package com.provectus.kafka.ui.config.auth;

import com.provectus.kafka.ui.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(value = "auth.type", havingValue = "LOGIN_FORM")
public class UserBootstrapService implements ApplicationRunner {

  private final UserRepository repository;
  private final Environment environment;
  private final PasswordEncoder passwordEncoder;

  @Override
  public void run(ApplicationArguments args) {
    bootstrap();
  }

  void bootstrap() {
    if (repository.count() > 0) {
      return;
    }
    String username = environment.getProperty("spring.security.user.name");
    String password = environment.getProperty("spring.security.user.password");
    if (username == null || username.isBlank() || password == null || password.isBlank()) {
      throw new ValidationException(
          "Initial admin requires SPRING_SECURITY_USER_NAME and SPRING_SECURITY_USER_PASSWORD");
    }
    repository.create(username, passwordEncoder.encode(password), true);
  }
}
