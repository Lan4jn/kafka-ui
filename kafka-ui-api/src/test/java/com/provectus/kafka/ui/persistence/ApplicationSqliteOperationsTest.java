package com.provectus.kafka.ui.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.DriverManager;
import java.util.Map;
import org.junit.jupiter.api.Test;
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
      statement.executeUpdate(
          "create table dynamic_config(id integer primary key, yaml text not null, updated_at text not null)");
      statement.executeUpdate(
          "insert into dynamic_config(id, yaml, updated_at) values (1, 'kafka:\n  clusters: []', datetime('now'))");
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
