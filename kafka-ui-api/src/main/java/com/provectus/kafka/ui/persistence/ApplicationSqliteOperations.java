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
    return openConnection(databasePath());
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
      createSchema(dbPath);
      importLegacyDynamicConfigIfNeeded(dbPath);
    } catch (IOException e) {
      throw new ValidationException("Error creating directory for application sqlite " + dbPath, e);
    } catch (SQLException e) {
      throw new ValidationException("Error migrating application sqlite " + dbPath, e);
    }
  }

  public Optional<String> readDynamicConfig() {
    try (var connection = connection()) {
      return readDynamicConfig(connection);
    } catch (SQLException e) {
      throw new ValidationException("Error reading dynamic config from application sqlite", e);
    }
  }

  private Optional<String> readDynamicConfig(Connection connection) throws SQLException {
    try (var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select yaml from dynamic_config where id = 1")) {
      if (resultSet.next()) {
        return Optional.ofNullable(resultSet.getString("yaml"));
      }
      return Optional.empty();
    }
  }

  public void writeDynamicConfig(String yaml) {
    migrate();
    try (var connection = openConnection(databasePath())) {
      writeDynamicConfig(connection, yaml);
    } catch (SQLException e) {
      throw new ValidationException("Error writing dynamic config to application sqlite", e);
    }
  }

  private void writeDynamicConfig(Connection connection, String yaml) throws SQLException {
    try (var statement = connection.prepareStatement(
        "insert into dynamic_config(id, yaml, updated_at) values (1, ?, datetime('now')) "
            + "on conflict(id) do update set yaml = excluded.yaml, updated_at = excluded.updated_at")) {
      statement.setString(1, yaml);
      statement.executeUpdate();
    }
  }

  private Connection openConnection(Path dbPath) throws SQLException {
    return DriverManager.getConnection("jdbc:sqlite:" + dbPath);
  }

  private void createSchema(Path dbPath) throws SQLException {
    try (var connection = openConnection(dbPath);
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
  }

  private void importLegacyDynamicConfigIfNeeded(Path dbPath) throws SQLException, IOException {
    try (var connection = openConnection(dbPath)) {
      if (readDynamicConfig(connection).isPresent()) {
        return;
      }
      Optional<String> legacySqliteYaml = readLegacySqliteYaml();
      if (legacySqliteYaml.isPresent()) {
        writeDynamicConfig(connection, legacySqliteYaml.get());
        log.info("Imported legacy sqlite dynamic config into {}", dbPath);
        return;
      }
      Path legacyYaml = Paths.get(ctx.getEnvironment().getProperty(
          LEGACY_DYNAMIC_CONFIG_YAML_PATH_PROPERTY,
          LEGACY_DYNAMIC_CONFIG_YAML_PATH_DEFAULT
      ));
      if (Files.exists(legacyYaml) && Files.isReadable(legacyYaml)) {
        writeDynamicConfig(connection, Files.readString(legacyYaml));
        log.info("Imported legacy yaml dynamic config {} into {}", legacyYaml, dbPath);
      }
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
    try (var connection = openConnection(legacyPath);
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
