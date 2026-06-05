package com.provectus.kafka.ui.config.auth;

import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.provectus.kafka.ui.exception.ValidationException;
import com.provectus.kafka.ui.persistence.ApplicationSqliteOperations;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;

class UserBootstrapServiceTest {

  @TempDir
  Path tmpDir;

  UserRepository repository;

  @BeforeEach
  void setUp() {
    GenericApplicationContext context = new GenericApplicationContext();
    context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", Map.of(
        KAFKA_UI_SQLITE_PATH_PROPERTY, tmpDir.resolve("kafka-ui.db").toString()
    )));
    repository = new UserRepository(new ApplicationSqliteOperations(context));
  }

  @Test
  void createsInitialUserWhenRepositoryIsEmpty() {
    MockEnvironment environment = new MockEnvironment()
        .withProperty("spring.security.user.name", "admin")
        .withProperty("spring.security.user.password", "pass");
    UserBootstrapService service = new UserBootstrapService(
        repository,
        environment,
        PasswordEncoderFactories.createDelegatingPasswordEncoder()
    );

    service.bootstrap();

    UserEntity user = repository.findByUsername("admin").orElseThrow();
    assertThat(user.enabled()).isTrue();
    assertThat(user.passwordHash()).startsWith("{bcrypt}");
  }

  @Test
  void doesNotOverwriteExistingUsers() {
    repository.create("existing", "hash", true);
    MockEnvironment environment = new MockEnvironment()
        .withProperty("spring.security.user.name", "admin")
        .withProperty("spring.security.user.password", "pass");
    UserBootstrapService service = new UserBootstrapService(
        repository,
        environment,
        PasswordEncoderFactories.createDelegatingPasswordEncoder()
    );

    service.bootstrap();

    assertThat(repository.count()).isEqualTo(1);
    assertThat(repository.findByUsername("existing")).isPresent();
  }

  @Test
  void failsWhenInitialCredentialsAreMissing() {
    UserBootstrapService service = new UserBootstrapService(
        repository,
        new MockEnvironment(),
        PasswordEncoderFactories.createDelegatingPasswordEncoder()
    );

    assertThatThrownBy(service::bootstrap)
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("SPRING_SECURITY_USER_NAME");
  }
}
