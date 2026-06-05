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

class UserRepositoryTest {

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
  void createsAndFindsUserByUsername() {
    UserEntity created = repository.create("admin", "{bcrypt}hash", true);

    assertThat(created.id()).isPositive();
    assertThat(repository.findByUsername("admin")).get()
        .extracting(UserEntity::passwordHash)
        .isEqualTo("{bcrypt}hash");
  }

  @Test
  void rejectsDuplicateUsername() {
    repository.create("admin", "hash", true);

    assertThatThrownBy(() -> repository.create("admin", "hash2", true))
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("already exists");
  }

  @Test
  void protectsLastEnabledUserFromDisableAndDelete() {
    UserEntity user = repository.create("admin", "hash", true);

    assertThatThrownBy(() -> repository.setEnabled(user.id(), false))
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("last enabled user");
    assertThatThrownBy(() -> repository.delete(user.id()))
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("last enabled user");
  }

  @Test
  void allowsDisableWhenAnotherEnabledUserExists() {
    UserEntity first = repository.create("admin", "hash", true);
    repository.create("ops", "hash", true);

    repository.setEnabled(first.id(), false);

    assertThat(repository.findByUsername("admin")).get()
        .extracting(UserEntity::enabled)
        .isEqualTo(false);
  }
}
