package com.provectus.kafka.ui.controller;

import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY;
import static org.assertj.core.api.Assertions.assertThat;

import com.provectus.kafka.ui.config.auth.UserRepository;
import com.provectus.kafka.ui.model.CreateUserRequestDTO;
import com.provectus.kafka.ui.model.ResetUserPasswordRequestDTO;
import com.provectus.kafka.ui.model.SetUserEnabledRequestDTO;
import com.provectus.kafka.ui.persistence.ApplicationSqliteOperations;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import reactor.core.publisher.Mono;

class UsersControllerTest {

  @TempDir
  Path tmpDir;

  UserRepository repository;
  UsersController controller;

  @BeforeEach
  void setUp() {
    GenericApplicationContext context = new GenericApplicationContext();
    context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", Map.of(
        KAFKA_UI_SQLITE_PATH_PROPERTY, tmpDir.resolve("kafka-ui.db").toString()
    )));
    repository = new UserRepository(new ApplicationSqliteOperations(context));
    controller = new UsersController(repository, PasswordEncoderFactories.createDelegatingPasswordEncoder());
  }

  @Test
  void createsAndListsUserWithoutPasswordHash() {
    CreateUserRequestDTO request = new CreateUserRequestDTO()
        .username("admin")
        .password("pass")
        .enabled(true);

    var created = controller.createUser(Mono.just(request)).block();
    var users = controller.getUsers().block();

    assertThat(created).isNotNull();
    assertThat(created.getBody().getUsername()).isEqualTo("admin");
    assertThat(users).isNotNull();
    assertThat(users.getBody()).hasSize(1);
    assertThat(users.getBody().get(0).getUsername()).isEqualTo("admin");
  }

  @Test
  void disablesResetsPasswordAndDeletesUser() {
    var first = repository.create("admin", "hash", true);
    var second = repository.create("ops", "hash", true);

    controller.setUserEnabled(
        first.id(),
        Mono.just(new SetUserEnabledRequestDTO().enabled(false))
    ).block();
    controller.resetUserPassword(
        first.id(),
        Mono.just(new ResetUserPasswordRequestDTO().password("new-pass"))
    ).block();
    controller.deleteUser(first.id()).block();

    assertThat(repository.findByUsername("admin")).isEmpty();
    assertThat(repository.findByUsername("ops")).get()
        .extracting(user -> user.id())
        .isEqualTo(second.id());
  }
}
