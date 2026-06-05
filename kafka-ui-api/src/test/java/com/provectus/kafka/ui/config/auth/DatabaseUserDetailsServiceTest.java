package com.provectus.kafka.ui.config.auth;

import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.provectus.kafka.ui.persistence.ApplicationSqliteOperations;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

class DatabaseUserDetailsServiceTest {

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
  void returnsEnabledUserDetails() {
    repository.create("admin", "{bcrypt}hash", true);
    DatabaseUserDetailsService service = new DatabaseUserDetailsService(repository);

    var user = service.findByUsername("admin").block();

    assertThat(user).isNotNull();
    assertThat(user.getUsername()).isEqualTo("admin");
    assertThat(user.isEnabled()).isTrue();
  }

  @Test
  void errorsWhenUserDoesNotExist() {
    DatabaseUserDetailsService service = new DatabaseUserDetailsService(repository);

    assertThatThrownBy(() -> service.findByUsername("missing").block())
        .isInstanceOf(UsernameNotFoundException.class);
  }
}
