# User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build SQLite-backed `LOGIN_FORM` users, initial admin bootstrap, user management APIs, and a simple React user management page.

**Architecture:** Introduce a shared SQLite service for `kafka-ui.db`, move dynamic config reads/writes onto it, then add a small user repository/service layer used by Spring Security and the user management controller. The frontend consumes generated OpenAPI clients through React Query hooks and adds a top-level Users page.

**Tech Stack:** Java 17, Spring Boot WebFlux/Security, sqlite-jdbc, OpenAPI generator, React, TypeScript, React Query, Jest/Testing Library.

---

## File Map

### Backend

- Create `kafka-ui-api/src/main/java/com/provectus/kafka/ui/persistence/ApplicationSqliteOperations.java` for database path resolution, schema creation, connection opening, and legacy dynamic config migration.
- Modify `kafka-ui-api/src/main/java/com/provectus/kafka/ui/util/DynamicConfigOperations.java` so dynamic config uses `ApplicationSqliteOperations` and writes only to `kafka-ui.db`.
- Create `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/UserEntity.java` as the internal user row model.
- Create `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/UserRepository.java` for SQLite user CRUD.
- Create `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/DatabaseUserDetailsService.java` for Spring Security user lookup.
- Create `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/UserBootstrapService.java` for first-admin creation from `SPRING_SECURITY_USER_NAME/PASSWORD`.
- Modify `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/EncryptedPasswordAuthenticationManager.java` to use `DatabaseUserDetailsService` through the `ReactiveUserDetailsService` interface.
- Modify `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/BasicAuthSecurityConfig.java` so it continues to inject `EncryptedPasswordAuthenticationManager` directly.
- Create `kafka-ui-api/src/main/java/com/provectus/kafka/ui/controller/UsersController.java` for `/api/users` CRUD.
- Modify `kafka-ui-contract/src/main/resources/swagger/kafka-ui-api.yaml` to add Users OpenAPI schemas and paths.
- Add tests under `kafka-ui-api/src/test/java/com/provectus/kafka/ui/persistence/`, `kafka-ui-api/src/test/java/com/provectus/kafka/ui/config/auth/`, and `kafka-ui-api/src/test/java/com/provectus/kafka/ui/controller/`.

### Frontend

- Modify `kafka-ui-react-app/src/lib/paths.ts` to add `usersPath`.
- Modify `kafka-ui-react-app/src/lib/api.ts` to export `usersApiClient` after generated sources include `UsersApi`.
- Create `kafka-ui-react-app/src/lib/hooks/api/users.ts` for React Query hooks.
- Create `kafka-ui-react-app/src/components/Users/Users.tsx` for the user management page.
- Create `kafka-ui-react-app/src/components/Users/__tests__/Users.spec.tsx` for page behavior.
- Modify `kafka-ui-react-app/src/components/App.tsx` to route `/ui/users`.
- Modify `kafka-ui-react-app/src/components/Nav/Nav.tsx` to show a top-level Users navigation item.
- Modify `kafka-ui-react-app/src/locales/en.ts` and `kafka-ui-react-app/src/locales/zh-CN.ts` for labels.

---

## Task 1: Shared SQLite Application Store

**Files:**
- Create: `kafka-ui-api/src/main/java/com/provectus/kafka/ui/persistence/ApplicationSqliteOperations.java`
- Test: `kafka-ui-api/src/test/java/com/provectus/kafka/ui/persistence/ApplicationSqliteOperationsTest.java`

- [ ] **Step 1: Write failing tests for database creation and legacy imports**

Create `ApplicationSqliteOperationsTest.java` with these tests:

```java
package com.provectus.kafka.ui.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.util.Map;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;

class ApplicationSqliteOperationsTest {

  @TempDir
  Path tmpDir;

  @Test
  void createsApplicationDatabaseAndTables() throws Exception {
    Path dbPath = tmpDir.resolve("kafka-ui.db");
    ApplicationSqliteOperations ops = new ApplicationSqliteOperations(context(Map.of(
        ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY, dbPath.toString()
    )));

    ops.migrate();

    assertThat(dbPath).exists();
    try (var connection = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
         var statement = connection.createStatement()) {
      assertThat(statement.executeQuery("select version from schema_version").next()).isTrue();
      assertThat(statement.executeQuery("select count(*) from dynamic_config").next()).isTrue();
      assertThat(statement.executeQuery("select count(*) from users").next()).isTrue();
    }
  }

  @Test
  void importsLegacySqliteDynamicConfigWhenNewDatabaseIsEmpty() throws Exception {
    Path newDb = tmpDir.resolve("kafka-ui.db");
    Path oldDb = tmpDir.resolve("dynamic_config.db");
    try (var connection = DriverManager.getConnection("jdbc:sqlite:" + oldDb);
         var statement = connection.createStatement()) {
      statement.executeUpdate("create table dynamic_config(id integer primary key, yaml text not null, updated_at text not null)");
      statement.executeUpdate("insert into dynamic_config(id, yaml, updated_at) values (1, 'kafka:\n  clusters: []', datetime('now'))");
    }

    ApplicationSqliteOperations ops = new ApplicationSqliteOperations(context(Map.of(
        ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY, newDb.toString(),
        ApplicationSqliteOperations.LEGACY_DYNAMIC_CONFIG_SQLITE_PATH_PROPERTY, oldDb.toString()
    )));

    ops.migrate();

    assertThat(readDynamicConfig(newDb)).contains("clusters");
  }

  @Test
  void importsLegacyYamlWhenLegacySqliteIsMissing() throws Exception {
    Path newDb = tmpDir.resolve("kafka-ui.db");
    Path yaml = tmpDir.resolve("dynamic_config.yaml");
    Files.writeString(yaml, "kafka:\n  clusters:\n    - name: local\n");

    ApplicationSqliteOperations ops = new ApplicationSqliteOperations(context(Map.of(
        ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY, newDb.toString(),
        ApplicationSqliteOperations.LEGACY_DYNAMIC_CONFIG_YAML_PATH_PROPERTY, yaml.toString()
    )));

    ops.migrate();

    assertThat(readDynamicConfig(newDb)).contains("name: local");
  }

  private GenericApplicationContext context(Map<String, Object> properties) {
    GenericApplicationContext context = new GenericApplicationContext();
    context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", properties));
    return context;
  }

  private String readDynamicConfig(Path dbPath) throws Exception {
    try (var connection = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select yaml from dynamic_config where id = 1")) {
      assertThat(resultSet.next()).isTrue();
      return resultSet.getString("yaml");
    }
  }
}
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=ApplicationSqliteOperationsTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: compilation fails because `ApplicationSqliteOperations` does not exist.

- [ ] **Step 3: Implement `ApplicationSqliteOperations`**

Create `ApplicationSqliteOperations.java`:

```java
package com.provectus.kafka.ui.persistence;

import com.provectus.kafka.ui.exception.ValidationException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ApplicationSqliteOperations {

  public static final String KAFKA_UI_SQLITE_PATH_PROPERTY = "kafka.ui.sqlite.path";
  public static final String KAFKA_UI_SQLITE_PATH_DEFAULT = "/etc/kafkaui/kafka-ui.db";
  public static final String LEGACY_DYNAMIC_CONFIG_SQLITE_PATH_PROPERTY = "dynamic.config.sqlite.path";
  public static final String LEGACY_DYNAMIC_CONFIG_SQLITE_PATH_DEFAULT = "/etc/kafkaui/dynamic_config.db";
  public static final String LEGACY_DYNAMIC_CONFIG_YAML_PATH_PROPERTY = "dynamic.config.path";
  public static final String LEGACY_DYNAMIC_CONFIG_YAML_PATH_DEFAULT = "/etc/kafkaui/dynamic_config.yaml";

  private final ConfigurableApplicationContext ctx;

  public Path databasePath() {
    return Paths.get(ctx.getEnvironment().getProperty(
        KAFKA_UI_SQLITE_PATH_PROPERTY,
        KAFKA_UI_SQLITE_PATH_DEFAULT
    ));
  }

  public Connection connection() throws SQLException {
    migrate();
    return DriverManager.getConnection("jdbc:sqlite:" + databasePath());
  }

  public void migrate() {
    Path dbPath = databasePath();
    if (Files.isDirectory(dbPath)) {
      throw new ValidationException("Application sqlite path is a directory, but should be a file path");
    }
    try {
      Path parent = dbPath.getParent();
      if (parent != null && !Files.exists(parent)) {
        Files.createDirectories(parent);
      }
      if (Files.exists(dbPath) && !Files.isWritable(dbPath)) {
        throw new ValidationException("Application sqlite file already exists and is not writable");
      }
      try (var connection = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
           var statement = connection.createStatement()) {
        statement.executeUpdate("create table if not exists schema_version (version integer primary key)");
        statement.executeUpdate("create table if not exists dynamic_config ("
            + "id integer primary key check (id = 1), "
            + "yaml text not null, "
            + "updated_at text not null)");
        statement.executeUpdate("create table if not exists users ("
            + "id integer primary key autoincrement, "
            + "username text not null unique, "
            + "password_hash text not null, "
            + "enabled integer not null, "
            + "created_at text not null, "
            + "updated_at text not null)");
        statement.executeUpdate("insert or ignore into schema_version(version) values (1)");
      }
      importLegacyDynamicConfigIfNeeded(dbPath);
    } catch (IOException e) {
      throw new ValidationException("Error creating directory for application sqlite " + dbPath, e);
    } catch (SQLException e) {
      throw new ValidationException("Error migrating application sqlite " + dbPath, e);
    }
  }

  public Optional<String> readDynamicConfig() {
    try (var connection = connection();
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select yaml from dynamic_config where id = 1")) {
      if (resultSet.next()) {
        return Optional.ofNullable(resultSet.getString("yaml"));
      }
      return Optional.empty();
    } catch (SQLException e) {
      throw new ValidationException("Error reading dynamic config from application sqlite", e);
    }
  }

  public void writeDynamicConfig(String yaml) {
    try (var connection = connection();
         var statement = connection.prepareStatement(
             "insert into dynamic_config(id, yaml, updated_at) values (1, ?, datetime('now')) "
                 + "on conflict(id) do update set yaml = excluded.yaml, updated_at = excluded.updated_at")) {
      statement.setString(1, yaml);
      statement.executeUpdate();
    } catch (SQLException e) {
      throw new ValidationException("Error writing dynamic config to application sqlite", e);
    }
  }

  private void importLegacyDynamicConfigIfNeeded(Path dbPath) throws SQLException, IOException {
    if (dynamicConfigExists(dbPath)) {
      return;
    }
    Optional<String> legacySqliteYaml = readLegacySqliteYaml();
    if (legacySqliteYaml.isPresent()) {
      writeDynamicConfig(legacySqliteYaml.get());
      log.info("Imported legacy sqlite dynamic config into {}", dbPath);
      return;
    }
    Path legacyYaml = Paths.get(ctx.getEnvironment().getProperty(
        LEGACY_DYNAMIC_CONFIG_YAML_PATH_PROPERTY,
        LEGACY_DYNAMIC_CONFIG_YAML_PATH_DEFAULT
    ));
    if (Files.exists(legacyYaml) && Files.isReadable(legacyYaml)) {
      writeDynamicConfig(Files.readString(legacyYaml));
      log.info("Imported legacy yaml dynamic config {} into {}", legacyYaml, dbPath);
    }
  }

  private boolean dynamicConfigExists(Path dbPath) throws SQLException {
    try (var connection = DriverManager.getConnection("jdbc:sqlite:" + dbPath);
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select 1 from dynamic_config where id = 1")) {
      return resultSet.next();
    }
  }

  private Optional<String> readLegacySqliteYaml() {
    Path legacyPath = Paths.get(ctx.getEnvironment().getProperty(
        LEGACY_DYNAMIC_CONFIG_SQLITE_PATH_PROPERTY,
        LEGACY_DYNAMIC_CONFIG_SQLITE_PATH_DEFAULT
    ));
    if (!Files.exists(legacyPath) || Files.isDirectory(legacyPath)) {
      return Optional.empty();
    }
    try (var connection = DriverManager.getConnection("jdbc:sqlite:" + legacyPath);
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select yaml from dynamic_config where id = 1")) {
      if (resultSet.next()) {
        return Optional.ofNullable(resultSet.getString("yaml"));
      }
      return Optional.empty();
    } catch (SQLException e) {
      log.warn("Legacy dynamic config sqlite {} cannot be imported", legacyPath, e);
      return Optional.empty();
    }
  }
}
```

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=ApplicationSqliteOperationsTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: `Tests run: 3, Failures: 0, Errors: 0`.

---

## Task 2: Move Dynamic Config to `kafka-ui.db`

**Files:**
- Modify: `kafka-ui-api/src/main/java/com/provectus/kafka/ui/util/DynamicConfigOperations.java`
- Modify: `kafka-ui-api/src/test/java/com/provectus/kafka/ui/util/DynamicConfigOperationsTest.java`

- [ ] **Step 1: Update failing tests to assert `kafka.ui.sqlite.path`**

In `DynamicConfigOperationsTest`, update helper properties to use `ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY` and assert legacy YAML still imports. Add this import:

```java
import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY;
```

Update `contextWithVars` default path:

```java
private GenericApplicationContext contextWithVars(Map<String, Object> envVars) {
  GenericApplicationContext context = new GenericApplicationContext();
  var vars = new HashMap<String, Object>(envVars);
  vars.putIfAbsent(KAFKA_UI_SQLITE_PATH_PROPERTY, tmpDir.resolve("kafka-ui.db").toString());
  context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("testEnv", vars));
  return context;
}
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=DynamicConfigOperationsTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: failures show `DynamicConfigOperations` still reads or writes through old SQLite helpers.

- [ ] **Step 3: Refactor `DynamicConfigOperations` constructor and methods**

Change fields and constructor to keep existing Spring component usage simple:

```java
private final ConfigurableApplicationContext ctx;
private final ApplicationSqliteOperations sqliteOperations;

public DynamicConfigOperations(ConfigurableApplicationContext ctx) {
  this.ctx = ctx;
  this.sqliteOperations = new ApplicationSqliteOperations(ctx);
}
```

Replace `loadDynamicPropertySource` body with:

```java
@SneakyThrows
public Optional<PropertySource<?>> loadDynamicPropertySource() {
  if (dynamicConfigEnabled()) {
    Optional<String> yaml = sqliteOperations.readDynamicConfig();
    if (yaml.isEmpty()) {
      log.warn("Dynamic config sqlite {} has no stored config", sqliteOperations.databasePath());
      return Optional.empty();
    }
    var propertySource = new CompositePropertySource("dynamicProperties");
    new YamlPropertySourceLoader()
        .load("dynamicProperties", new ByteArrayResource(yaml.get().getBytes()))
        .forEach(propertySource::addPropertySource);
    log.info("Dynamic config loaded from sqlite {}", sqliteOperations.databasePath());
    return Optional.of(propertySource);
  }
  return Optional.empty();
}
```

Replace `persist` write call with:

```java
String yaml = serializeToYaml(properties);
sqliteOperations.writeDynamicConfig(yaml);
```

Delete old dynamic config sqlite helper methods from `DynamicConfigOperations`: `dynamicConfigSqlitePath`, `loadYamlFromSqlite`, `importLegacyYaml`, `writeYamlToSqlite`, and `migrateSqlite`.

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=ApplicationSqliteOperationsTest,DynamicConfigOperationsTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: both test classes pass.

---

## Task 3: User Repository and Bootstrap

**Files:**
- Create: `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/UserEntity.java`
- Create: `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/UserRepository.java`
- Create: `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/UserBootstrapService.java`
- Test: `kafka-ui-api/src/test/java/com/provectus/kafka/ui/config/auth/UserRepositoryTest.java`
- Test: `kafka-ui-api/src/test/java/com/provectus/kafka/ui/config/auth/UserBootstrapServiceTest.java`

- [ ] **Step 1: Write failing repository tests**

Create `UserRepositoryTest.java`:

```java
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
```

- [ ] **Step 2: Run repository tests and verify RED**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=UserRepositoryTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: compilation fails because user classes do not exist.

- [ ] **Step 3: Implement `UserEntity`**

Create:

```java
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
```

- [ ] **Step 4: Implement `UserRepository`**

Create `UserRepository.java` with methods used by tests and APIs:

```java
package com.provectus.kafka.ui.config.auth;

import com.provectus.kafka.ui.exception.ValidationException;
import com.provectus.kafka.ui.persistence.ApplicationSqliteOperations;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class UserRepository {

  private final ApplicationSqliteOperations sqlite;

  public List<UserEntity> findAll() {
    try (var connection = sqlite.connection();
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select * from users order by username")) {
      List<UserEntity> users = new ArrayList<>();
      while (resultSet.next()) {
        users.add(map(resultSet));
      }
      return users;
    } catch (SQLException e) {
      throw new ValidationException("Error reading users", e);
    }
  }

  public Optional<UserEntity> findByUsername(String username) {
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement("select * from users where username = ?")) {
      statement.setString(1, normalizeUsername(username));
      try (var resultSet = statement.executeQuery()) {
        return resultSet.next() ? Optional.of(map(resultSet)) : Optional.empty();
      }
    } catch (SQLException e) {
      throw new ValidationException("Error reading user " + username, e);
    }
  }

  public UserEntity create(String username, String passwordHash, boolean enabled) {
    String normalized = normalizeUsername(username);
    if (passwordHash == null || passwordHash.isBlank()) {
      throw new ValidationException("Password hash cannot be empty");
    }
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement(
             "insert into users(username, password_hash, enabled, created_at, updated_at) "
                 + "values (?, ?, ?, datetime('now'), datetime('now'))")) {
      statement.setString(1, normalized);
      statement.setString(2, passwordHash);
      statement.setInt(3, enabled ? 1 : 0);
      statement.executeUpdate();
      return findByUsername(normalized).orElseThrow();
    } catch (SQLException e) {
      if (e.getMessage() != null && e.getMessage().contains("UNIQUE")) {
        throw new ValidationException("User " + normalized + " already exists", e);
      }
      throw new ValidationException("Error creating user " + normalized, e);
    }
  }

  public void setEnabled(long id, boolean enabled) {
    UserEntity user = findById(id).orElseThrow(() -> new ValidationException("User not found"));
    if (!enabled && user.enabled() && enabledUsersCount() == 1) {
      throw new ValidationException("Cannot disable last enabled user");
    }
    updateOne(id, "update users set enabled = ?, updated_at = datetime('now') where id = ?", enabled ? 1 : 0);
  }

  public void updatePassword(long id, String passwordHash) {
    if (passwordHash == null || passwordHash.isBlank()) {
      throw new ValidationException("Password hash cannot be empty");
    }
    updateOne(id, "update users set password_hash = ?, updated_at = datetime('now') where id = ?", passwordHash);
  }

  public void delete(long id) {
    UserEntity user = findById(id).orElseThrow(() -> new ValidationException("User not found"));
    if (user.enabled() && enabledUsersCount() == 1) {
      throw new ValidationException("Cannot delete last enabled user");
    }
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement("delete from users where id = ?")) {
      statement.setLong(1, id);
      statement.executeUpdate();
    } catch (SQLException e) {
      throw new ValidationException("Error deleting user " + id, e);
    }
  }

  public long count() {
    try (var connection = sqlite.connection();
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select count(*) from users")) {
      resultSet.next();
      return resultSet.getLong(1);
    } catch (SQLException e) {
      throw new ValidationException("Error counting users", e);
    }
  }

  private Optional<UserEntity> findById(long id) {
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement("select * from users where id = ?")) {
      statement.setLong(1, id);
      try (var resultSet = statement.executeQuery()) {
        return resultSet.next() ? Optional.of(map(resultSet)) : Optional.empty();
      }
    } catch (SQLException e) {
      throw new ValidationException("Error reading user " + id, e);
    }
  }

  private long enabledUsersCount() {
    try (var connection = sqlite.connection();
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select count(*) from users where enabled = 1")) {
      resultSet.next();
      return resultSet.getLong(1);
    } catch (SQLException e) {
      throw new ValidationException("Error counting enabled users", e);
    }
  }

  private void updateOne(long id, String sql, Object value) {
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement(sql)) {
      if (value instanceof Integer integer) {
        statement.setInt(1, integer);
      } else {
        statement.setString(1, String.valueOf(value));
      }
      statement.setLong(2, id);
      if (statement.executeUpdate() == 0) {
        throw new ValidationException("User not found");
      }
    } catch (SQLException e) {
      throw new ValidationException("Error updating user " + id, e);
    }
  }

  private String normalizeUsername(String username) {
    if (username == null || username.trim().isEmpty()) {
      throw new ValidationException("Username cannot be empty");
    }
    return username.trim();
  }

  private UserEntity map(ResultSet resultSet) throws SQLException {
    return new UserEntity(
        resultSet.getLong("id"),
        resultSet.getString("username"),
        resultSet.getString("password_hash"),
        resultSet.getInt("enabled") == 1,
        resultSet.getString("created_at"),
        resultSet.getString("updated_at")
    );
  }
}
```

- [ ] **Step 5: Write failing bootstrap tests**

Create `UserBootstrapServiceTest.java`:

```java
package com.provectus.kafka.ui.config.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.provectus.kafka.ui.exception.ValidationException;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.MockEnvironment;
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
```

Add these imports to the test file:

```java
import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY;

import com.provectus.kafka.ui.persistence.ApplicationSqliteOperations;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
```

- [ ] **Step 6: Implement `UserBootstrapService`**

Create:

```java
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
```

- [ ] **Step 7: Provide a single `PasswordEncoder` bean**

Create `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/PasswordEncoderConfig.java`:

```java
package com.provectus.kafka.ui.config.auth;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordEncoderConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();
  }
}
```

- [ ] **Step 8: Run repository and bootstrap tests**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=UserRepositoryTest,UserBootstrapServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: both test classes pass.

---

## Task 4: Database-backed Login Authentication

**Files:**
- Create: `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/DatabaseUserDetailsService.java`
- Modify: `kafka-ui-api/src/main/java/com/provectus/kafka/ui/config/auth/EncryptedPasswordAuthenticationManager.java`
- Test: `kafka-ui-api/src/test/java/com/provectus/kafka/ui/config/auth/DatabaseUserDetailsServiceTest.java`
- Test: `kafka-ui-api/src/test/java/com/provectus/kafka/ui/config/auth/EncryptedPasswordAuthenticationManagerTest.java`

- [ ] **Step 1: Write failing `DatabaseUserDetailsService` tests**

Create:

```java
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
```

This test uses the real `UserRepository` and temp SQLite database from the setup block above.

- [ ] **Step 2: Implement `DatabaseUserDetailsService`**

Create:

```java
package com.provectus.kafka.ui.config.auth;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@ConditionalOnProperty(value = "auth.type", havingValue = "LOGIN_FORM")
public class DatabaseUserDetailsService implements ReactiveUserDetailsService {

  private final UserRepository repository;

  @Override
  public Mono<UserDetails> findByUsername(String username) {
    return Mono.fromSupplier(() -> repository.findByUsername(username)
        .<UserDetails>map(user -> new User(
            user.username(),
            user.passwordHash(),
            user.enabled(),
            true,
            true,
            true,
            List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        ))
        .orElseThrow(() -> new UsernameNotFoundException("User " + username + " not found")));
  }
}
```

- [ ] **Step 3: Adjust authentication manager to reuse injected `PasswordEncoder`**

Modify `EncryptedPasswordAuthenticationManager` constructor fields:

```java
private final LoginEncryptionService encryptionService;
private final ReactiveUserDetailsService userDetailsService;
private final PasswordEncoder passwordEncoder;
```

Update delegate:

```java
private ReactiveAuthenticationManager delegate() {
  UserDetailsRepositoryReactiveAuthenticationManager manager =
      new UserDetailsRepositoryReactiveAuthenticationManager(userDetailsService);
  manager.setPasswordEncoder(passwordEncoder);
  return manager;
}
```

- [ ] **Step 4: Write authentication manager test for encrypted DB password login**

Create `EncryptedPasswordAuthenticationManagerTest.java`:

```java
package com.provectus.kafka.ui.config.auth;

import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY;
import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.Map;
import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

class EncryptedPasswordAuthenticationManagerTest {

  @TempDir
  Path tmpDir;

  @Test
  void authenticatesEncryptedPasswordAgainstDatabaseUser() throws Exception {
    GenericApplicationContext context = new GenericApplicationContext();
    context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", Map.of(
        KAFKA_UI_SQLITE_PATH_PROPERTY, tmpDir.resolve("kafka-ui.db").toString()
    )));
    UserRepository repository = new UserRepository(new ApplicationSqliteOperations(context));
    PasswordEncoder passwordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
    repository.create("admin", passwordEncoder.encode("secret"), true);
    LoginEncryptionService encryptionService = new LoginEncryptionService();
    EncryptedPasswordAuthenticationManager manager = new EncryptedPasswordAuthenticationManager(
        encryptionService,
        new DatabaseUserDetailsService(repository),
        passwordEncoder
    );

    String encryptedPassword = encryptLikeWebCrypto("secret", encryptionService.publicKey());
    var authentication = manager.authenticate(
        UsernamePasswordAuthenticationToken.unauthenticated("admin", encryptedPassword)
    ).block();

    assertThat(authentication).isNotNull();
    assertThat(authentication.isAuthenticated()).isTrue();
    assertThat(authentication.getName()).isEqualTo("admin");
  }

  private String encryptLikeWebCrypto(
      String plainText,
      LoginEncryptionService.PublicKeyDto publicKey) throws Exception {
    BigInteger modulus = new BigInteger(1, Base64.getUrlDecoder().decode(publicKey.n()));
    BigInteger exponent = new BigInteger(1, Base64.getUrlDecoder().decode(publicKey.e()));
    var keyFactory = KeyFactory.getInstance("RSA");
    var key = keyFactory.generatePublic(new RSAPublicKeySpec(modulus, exponent));
    var cipher = Cipher.getInstance("RSA/ECB/OAEPPadding");
    cipher.init(
        Cipher.ENCRYPT_MODE,
        key,
        new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT)
    );
    byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
    return Base64.getEncoder().encodeToString(encrypted);
  }
}
```

- [ ] **Step 5: Run auth tests**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=DatabaseUserDetailsServiceTest,EncryptedPasswordAuthenticationManagerTest,LoginEncryptionServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: all auth tests pass.

---

## Task 5: Users OpenAPI Contract and Controller

**Files:**
- Modify: `kafka-ui-contract/src/main/resources/swagger/kafka-ui-api.yaml`
- Create: `kafka-ui-api/src/main/java/com/provectus/kafka/ui/controller/UsersController.java`
- Test: `kafka-ui-api/src/test/java/com/provectus/kafka/ui/controller/UsersControllerTest.java`

- [ ] **Step 1: Add OpenAPI schemas and paths**

Add tag:

```yaml
  - name: /api/users
```

Add paths:

```yaml
  /api/users:
    get:
      tags:
        - /api/users
      operationId: getUsers
      responses:
        '200':
          description: Users list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
    post:
      tags:
        - /api/users
      operationId: createUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '200':
          description: Created user
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
  /api/users/{id}/enabled:
    patch:
      tags:
        - /api/users
      operationId: setUserEnabled
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            format: int64
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SetUserEnabledRequest'
      responses:
        '204':
          description: Updated
  /api/users/{id}/password:
    post:
      tags:
        - /api/users
      operationId: resetUserPassword
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            format: int64
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ResetUserPasswordRequest'
      responses:
        '204':
          description: Updated
  /api/users/{id}:
    delete:
      tags:
        - /api/users
      operationId: deleteUser
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            format: int64
      responses:
        '204':
          description: Deleted
```

Add component schemas:

```yaml
    User:
      type: object
      required: [id, username, enabled, createdAt, updatedAt]
      properties:
        id:
          type: integer
          format: int64
        username:
          type: string
        enabled:
          type: boolean
        createdAt:
          type: string
        updatedAt:
          type: string
    CreateUserRequest:
      type: object
      required: [username, password, enabled]
      properties:
        username:
          type: string
        password:
          type: string
        enabled:
          type: boolean
    SetUserEnabledRequest:
      type: object
      required: [enabled]
      properties:
        enabled:
          type: boolean
    ResetUserPasswordRequest:
      type: object
      required: [password]
      properties:
        password:
          type: string
```

- [ ] **Step 2: Generate API sources**

Run:

```bash
./mvnw -pl kafka-ui-contract -am generate-sources
```

Expected: Java interface `UsersApi` and frontend `UsersApi.ts` are generated.

- [ ] **Step 3: Implement `UsersController`**

Create:

```java
package com.provectus.kafka.ui.controller;

import com.provectus.kafka.ui.api.UsersApi;
import com.provectus.kafka.ui.config.auth.UserEntity;
import com.provectus.kafka.ui.config.auth.UserRepository;
import com.provectus.kafka.ui.model.CreateUserRequestDTO;
import com.provectus.kafka.ui.model.ResetUserPasswordRequestDTO;
import com.provectus.kafka.ui.model.SetUserEnabledRequestDTO;
import com.provectus.kafka.ui.model.UserDTO;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@ConditionalOnProperty(value = "auth.type", havingValue = "LOGIN_FORM")
public class UsersController implements UsersApi {

  private final UserRepository repository;
  private final PasswordEncoder passwordEncoder;

  @Override
  public Mono<ResponseEntity<List<UserDTO>>> getUsers() {
    return Mono.fromSupplier(() -> ResponseEntity.ok(repository.findAll().stream().map(this::toDto).toList()));
  }

  @Override
  public Mono<ResponseEntity<UserDTO>> createUser(Mono<CreateUserRequestDTO> request) {
    return request.map(dto -> repository.create(dto.getUsername(), passwordEncoder.encode(dto.getPassword()), dto.getEnabled()))
        .map(user -> ResponseEntity.ok(toDto(user)));
  }

  @Override
  public Mono<ResponseEntity<Void>> setUserEnabled(Long id, Mono<SetUserEnabledRequestDTO> request) {
    return request.doOnNext(dto -> repository.setEnabled(id, dto.getEnabled()))
        .thenReturn(ResponseEntity.noContent().build());
  }

  @Override
  public Mono<ResponseEntity<Void>> resetUserPassword(Long id, Mono<ResetUserPasswordRequestDTO> request) {
    return request.doOnNext(dto -> repository.updatePassword(id, passwordEncoder.encode(dto.getPassword())))
        .thenReturn(ResponseEntity.noContent().build());
  }

  @Override
  public Mono<ResponseEntity<Void>> deleteUser(Long id) {
    return Mono.fromRunnable(() -> repository.delete(id))
        .thenReturn(ResponseEntity.noContent().build());
  }

  private UserDTO toDto(UserEntity user) {
    return new UserDTO()
        .id(user.id())
        .username(user.username())
        .enabled(user.enabled())
        .createdAt(user.createdAt())
        .updatedAt(user.updatedAt());
  }
}
```

- [ ] **Step 4: Write controller tests**

Create `UsersControllerTest.java`:

```java
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
```

- [ ] **Step 5: Run contract and controller tests**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=UsersControllerTest,UserRepositoryTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: tests pass and generated interfaces compile.

---

## Task 6: Frontend User API Hooks

**Files:**
- Modify: `kafka-ui-react-app/src/lib/api.ts`
- Create: `kafka-ui-react-app/src/lib/hooks/api/users.ts`
- Test: `kafka-ui-react-app/src/lib/hooks/api/__tests__/users.spec.ts`

- [ ] **Step 1: Export generated `UsersApi` client**

Modify `lib/api.ts` imports:

```ts
import {
  UsersApi,
  KsqlApi,
  TopicsApi,
  SchemasApi,
  BrokersApi,
  MessagesApi,
  ClustersApi,
  Configuration,
  KafkaConnectApi,
  ConsumerGroupsApi,
  AuthorizationApi,
  ApplicationConfigApi,
  AclsApi,
} from 'generated-sources';
```

Add export:

```ts
export const usersApiClient = new UsersApi(apiClientConf);
```

- [ ] **Step 2: Create hooks**

Create `users.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateUserRequest,
  ResetUserPasswordRequest,
  SetUserEnabledRequest,
} from 'generated-sources';
import { usersApiClient } from 'lib/api';

const usersQueryKey = ['users'];

export const useUsers = () =>
  useQuery(usersQueryKey, () => usersApiClient.getUsers());

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (request: CreateUserRequest) => usersApiClient.createUser({ createUserRequest: request }),
    { onSuccess: () => queryClient.invalidateQueries(usersQueryKey) }
  );
};

export const useSetUserEnabled = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, enabled }: { id: number; enabled: boolean }) =>
      usersApiClient.setUserEnabled({ id, setUserEnabledRequest: { enabled } as SetUserEnabledRequest }),
    { onSuccess: () => queryClient.invalidateQueries(usersQueryKey) }
  );
};

export const useResetUserPassword = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ({ id, password }: { id: number; password: string }) =>
      usersApiClient.resetUserPassword({ id, resetUserPasswordRequest: { password } as ResetUserPasswordRequest }),
    { onSuccess: () => queryClient.invalidateQueries(usersQueryKey) }
  );
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation(
    (id: number) => usersApiClient.deleteUser({ id }),
    { onSuccess: () => queryClient.invalidateQueries(usersQueryKey) }
  );
};
```

- [ ] **Step 3: Run TypeScript check**

Run:

```bash
cd kafka-ui-react-app && pnpm tsc --noEmit
```

Expected: TypeScript passes with the generated `UsersApi` method request names used in Step 2.

---

## Task 7: Frontend Users Page and Navigation

**Files:**
- Modify: `kafka-ui-react-app/src/lib/paths.ts`
- Modify: `kafka-ui-react-app/src/components/App.tsx`
- Modify: `kafka-ui-react-app/src/components/Nav/Nav.tsx`
- Create: `kafka-ui-react-app/src/components/Users/Users.tsx`
- Create: `kafka-ui-react-app/src/components/Users/__tests__/Users.spec.tsx`
- Modify: `kafka-ui-react-app/src/locales/en.ts`
- Modify: `kafka-ui-react-app/src/locales/zh-CN.ts`

- [ ] **Step 1: Add path**

In `lib/paths.ts` add near top-level paths:

```ts
export const usersPath = '/ui/users';
```

- [ ] **Step 2: Add route**

In `components/App.tsx`, import `usersPath` and lazy load Users:

```ts
const Users = React.lazy(() => import('components/Users/Users'));
```

Add route before the cluster route:

```tsx
<Route path={usersPath} element={<Users />} />
```

- [ ] **Step 3: Add nav item**

In `components/Nav/Nav.tsx`, import `usersPath` and add after dashboard:

```tsx
<ClusterMenuItem to={usersPath} title={t('nav.users')} isTopLevel />
```

- [ ] **Step 4: Add locale keys**

Add to `en.ts`:

```ts
users: 'Users',
```

Add to `zh-CN.ts`:

```ts
users: '用户管理',
```

Add this object under the existing locale root in `en.ts`:

```ts
users: {
  title: 'Users',
  username: 'Username',
  status: 'Status',
  actions: 'Actions',
  enabled: 'Enabled',
  disabled: 'Disabled',
  create: 'Create user',
  password: 'Password',
  resetPassword: 'Reset password',
  delete: 'Delete',
  enable: 'Enable',
  disable: 'Disable',
},
```

Add this object under the existing locale root in `zh-CN.ts`:

```ts
users: {
  title: '用户管理',
  username: '用户名',
  status: '状态',
  actions: '操作',
  enabled: '已启用',
  disabled: '已禁用',
  create: '创建用户',
  password: '密码',
  resetPassword: '重置密码',
  delete: '删除',
  enable: '启用',
  disable: '禁用',
},
```

- [ ] **Step 5: Create `Users.tsx` page**

Create a small page using plain HTML controls and existing hooks:

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'components/contexts/LocaleContext';
import {
  useCreateUser,
  useDeleteUser,
  useResetUserPassword,
  useSetUserEnabled,
  useUsers,
} from 'lib/hooks/api/users';

const Users: React.FC = () => {
  const { t } = useTranslation();
  const { data = [] } = useUsers();
  const createUser = useCreateUser();
  const setEnabled = useSetUserEnabled();
  const resetPassword = useResetUserPassword();
  const deleteUser = useDeleteUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    createUser.mutate({ username, password, enabled: true });
    setUsername('');
    setPassword('');
  };

  return (
    <main>
      <h1>{t('users.title')}</h1>
      <form onSubmit={onCreate}>
        <label htmlFor="username">{t('users.username')}</label>
        <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <label htmlFor="new-password">{t('users.password')}</label>
        <input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">{t('users.create')}</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>{t('users.username')}</th>
            <th>{t('users.status')}</th>
            <th>{t('users.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user) => (
            <tr key={user.id}>
              <td>{user.username}</td>
              <td>{user.enabled ? t('users.enabled') : t('users.disabled')}</td>
              <td>
                <button type="button" onClick={() => setEnabled.mutate({ id: user.id, enabled: !user.enabled })}>
                  {user.enabled ? t('users.disable') : t('users.enable')}
                </button>
                <button type="button" onClick={() => {
                  const nextPassword = window.prompt(t('users.password'));
                  if (nextPassword) resetPassword.mutate({ id: user.id, password: nextPassword });
                }}>
                  {t('users.resetPassword')}
                </button>
                <button type="button" onClick={() => deleteUser.mutate(user.id)}>
                  {t('users.delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
};

export default Users;
```

- [ ] **Step 6: Write page tests**

Create `Users.spec.tsx`:

```tsx
import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from 'lib/testHelpers';
import Users from 'components/Users/Users';

const createMutate = jest.fn();
const setEnabledMutate = jest.fn();
const resetPasswordMutate = jest.fn();
const deleteMutate = jest.fn();

jest.mock('lib/hooks/api/users', () => ({
  useUsers: () => ({
    data: [{ id: 1, username: 'admin', enabled: true, createdAt: 'now', updatedAt: 'now' }],
  }),
  useCreateUser: () => ({ mutate: createMutate }),
  useSetUserEnabled: () => ({ mutate: setEnabledMutate }),
  useResetUserPassword: () => ({ mutate: resetPasswordMutate }),
  useDeleteUser: () => ({ mutate: deleteMutate }),
}));

describe('Users', () => {
  beforeEach(() => {
    createMutate.mockClear();
    setEnabledMutate.mockClear();
    resetPasswordMutate.mockClear();
    deleteMutate.mockClear();
  });

  it('renders users list', () => {
    render(<Users />);

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText(/enabled/i)).toBeInTheDocument();
  });

  it('creates user', async () => {
    render(<Users />);

    await userEvent.type(screen.getByLabelText(/username/i), 'ops');
    await userEvent.type(screen.getByLabelText(/password/i), 'pass');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(createMutate).toHaveBeenCalledWith({ username: 'ops', password: 'pass', enabled: true });
  });

  it('disables and deletes user', async () => {
    render(<Users />);

    await userEvent.click(screen.getByRole('button', { name: /disable/i }));
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(setEnabledMutate).toHaveBeenCalledWith({ id: 1, enabled: false });
    expect(deleteMutate).toHaveBeenCalledWith(1);
  });

  it('resets password', async () => {
    jest.spyOn(window, 'prompt').mockReturnValue('new-pass');
    render(<Users />);

    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(resetPasswordMutate).toHaveBeenCalledWith({ id: 1, password: 'new-pass' });
  });
});
```

- [ ] **Step 7: Run frontend checks**

Run:

```bash
cd kafka-ui-react-app && pnpm tsc --noEmit
cd kafka-ui-react-app && pnpm exec eslint --ext .tsx,.ts src/ --quiet
cd kafka-ui-react-app && pnpm jest src/components/Users/__tests__/Users.spec.tsx src/components/Nav/__tests__/Nav.spec.tsx --runInBand
```

Expected: TypeScript, lint, and listed Jest tests pass.

---

## Task 8: End-to-End Verification Sweep

**Files:**
- Verify all backend and frontend files changed in prior tasks.

- [ ] **Step 1: Run backend targeted suite**

Run:

```bash
./mvnw -pl kafka-ui-api -am -Dtest=ApplicationSqliteOperationsTest,DynamicConfigOperationsTest,UserRepositoryTest,UserBootstrapServiceTest,DatabaseUserDetailsServiceTest,EncryptedPasswordAuthenticationManagerTest,UsersControllerTest,AuthControllerTest,AbstractAuthSecurityConfigTest,LoginEncryptionServiceTest -Dsurefire.failIfNoSpecifiedTests=false test
```

Expected: all targeted backend tests pass.

- [ ] **Step 2: Run frontend targeted suite**

Run:

```bash
cd kafka-ui-react-app && pnpm tsc --noEmit
cd kafka-ui-react-app && pnpm exec eslint --ext .tsx,.ts src/ --quiet
cd kafka-ui-react-app && pnpm jest src/components/Users/__tests__/Users.spec.tsx src/components/Nav/__tests__/Nav.spec.tsx src/components/__tests__/App.spec.tsx --runInBand
```

Expected: TypeScript, lint, and targeted Jest tests pass.

- [ ] **Step 3: Check diff hygiene**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Status should contain only intended backend, contract, frontend, spec, and plan files. Do not commit unless the user explicitly asks for a commit.
