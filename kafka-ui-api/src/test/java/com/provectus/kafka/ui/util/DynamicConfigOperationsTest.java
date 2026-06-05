package com.provectus.kafka.ui.util;

import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY;
import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.LEGACY_DYNAMIC_CONFIG_SQLITE_PATH_PROPERTY;
import static com.provectus.kafka.ui.util.DynamicConfigOperations.DYNAMIC_CONFIG_ENABLED_ENV_PROPERTY;
import static com.provectus.kafka.ui.util.DynamicConfigOperations.DYNAMIC_CONFIG_PATH_ENV_PROPERTY;
import static org.assertj.core.api.Assertions.assertThat;

import com.provectus.kafka.ui.config.ClustersProperties;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Nullable;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.PropertySource;

class DynamicConfigOperationsTest {

  private static final String SAMPLE_YAML_CONFIG = """
       kafka:
        clusters:
          - name: test
            bootstrapServers: localhost:9092
      """;

  @TempDir
  private Path tmpDir;

  @Test
  void initializerAddsDynamicPropertySourceIfAllEnvVarsAreSet() throws Exception {
    Path propsFilePath = tmpDir.resolve("props.yaml");
    Files.writeString(propsFilePath, SAMPLE_YAML_CONFIG, StandardOpenOption.CREATE);

    GenericApplicationContext context = contextWithVars(Map.of(
        DYNAMIC_CONFIG_ENABLED_ENV_PROPERTY, "true",
        DYNAMIC_CONFIG_PATH_ENV_PROPERTY, propsFilePath.toString()
    ));
    context.getEnvironment().getPropertySources()
        .addFirst(new MapPropertySource("test", Map.of("testK", "testV")));
    int propertySourcesBefore = context.getEnvironment().getPropertySources().size();

    DynamicConfigOperations.dynamicConfigPropertiesInitializer().initialize(context);

    assertThat(context.getEnvironment().getPropertySources().size()).isEqualTo(propertySourcesBefore + 1);
    assertThat(context.getEnvironment().getPropertySources().stream())
        .element(0)
        .extracting(PropertySource::getName)
        .isEqualTo("dynamicProperties");
  }

  @ParameterizedTest
  @CsvSource({
      "false, /tmp/conf.yaml",
      "true, ",
      ", /tmp/conf.yaml",
      ",",
      "true, /tmp/conf.yaml", //vars set, but file doesn't exist
  })
  void initializerDoNothingIfAnyOfEnvVarsNotSet(@Nullable String enabledVar, @Nullable String pathVar) {
    var vars = new HashMap<String, Object>();
    vars.put(DYNAMIC_CONFIG_ENABLED_ENV_PROPERTY, enabledVar);
    vars.put(DYNAMIC_CONFIG_PATH_ENV_PROPERTY, pathVar);
    GenericApplicationContext context = contextWithVars(vars);
    int propertySourcesBefore = context.getEnvironment().getPropertySources().size();

    DynamicConfigOperations.dynamicConfigPropertiesInitializer().initialize(context);

    assertThat(context.getEnvironment().getPropertySources().size()).isEqualTo(propertySourcesBefore);
  }

  @ParameterizedTest
  @ValueSource(booleans = {true, false})
  void persistRewritesOrCreateConfigFile(boolean exists) throws Exception {
    Path propsFilePath = tmpDir.resolve("props.yaml");
    if (exists) {
      Files.writeString(propsFilePath, SAMPLE_YAML_CONFIG, StandardOpenOption.CREATE);
    }

    DynamicConfigOperations ops = new DynamicConfigOperations(contextWithVars(Map.of(
        DYNAMIC_CONFIG_ENABLED_ENV_PROPERTY, "true",
        DYNAMIC_CONFIG_PATH_ENV_PROPERTY, propsFilePath.toString()
    )));

    var overrideProps = new ClustersProperties();
    var cluster = new ClustersProperties.Cluster();
    cluster.setName("newName");
    overrideProps.setClusters(List.of(cluster));

    ops.persist(
        DynamicConfigOperations.PropertiesStructure.builder()
            .kafka(overrideProps)
            .build()
    );

    assertThat(ops.loadDynamicPropertySource())
        .get()
        .extracting(ps -> ps.getProperty("kafka.clusters[0].name"))
        .isEqualTo("newName");
  }

  @Test
  void initializerImportsLegacyYamlIntoSqlite() throws Exception {
    Path propsFilePath = tmpDir.resolve("props.yaml");
    Path sqliteFilePath = tmpDir.resolve("kafka-ui.db");
    Files.writeString(propsFilePath, SAMPLE_YAML_CONFIG, StandardOpenOption.CREATE);

    GenericApplicationContext context = contextWithVars(Map.of(
        DYNAMIC_CONFIG_ENABLED_ENV_PROPERTY, "true",
        DYNAMIC_CONFIG_PATH_ENV_PROPERTY, propsFilePath.toString(),
        KAFKA_UI_SQLITE_PATH_PROPERTY, sqliteFilePath.toString()
    ));

    DynamicConfigOperations.dynamicConfigPropertiesInitializer().initialize(context);

    assertThat(context.getEnvironment().getPropertySources().stream())
        .element(0)
        .extracting(ps -> ps.getProperty("kafka.clusters[0].name"))
        .isEqualTo("test");
    assertThat(readStoredYaml(sqliteFilePath)).contains("bootstrapServers: localhost:9092");
  }

  @Test
  void persistStoresConfigInSqlite() throws Exception {
    Path propsFilePath = tmpDir.resolve("props.yaml");
    Path sqliteFilePath = tmpDir.resolve("kafka-ui.db");
    DynamicConfigOperations ops = new DynamicConfigOperations(contextWithVars(Map.of(
        DYNAMIC_CONFIG_ENABLED_ENV_PROPERTY, "true",
        DYNAMIC_CONFIG_PATH_ENV_PROPERTY, propsFilePath.toString(),
        KAFKA_UI_SQLITE_PATH_PROPERTY, sqliteFilePath.toString()
    )));

    var overrideProps = new ClustersProperties();
    var cluster = new ClustersProperties.Cluster();
    cluster.setName("sqliteName");
    overrideProps.setClusters(List.of(cluster));

    ops.persist(
        DynamicConfigOperations.PropertiesStructure.builder()
            .kafka(overrideProps)
            .build()
    );

    assertThat(ops.loadDynamicPropertySource())
        .get()
        .extracting(ps -> ps.getProperty("kafka.clusters[0].name"))
        .isEqualTo("sqliteName");
    assertThat(readStoredYaml(sqliteFilePath)).contains("name: sqliteName");
    assertThat(propsFilePath).doesNotExist();
  }

  private GenericApplicationContext contextWithVars(Map<String, Object> envVars) {
    GenericApplicationContext context = new GenericApplicationContext();
    var vars = new HashMap<String, Object>(envVars);
    vars.putIfAbsent(KAFKA_UI_SQLITE_PATH_PROPERTY, tmpDir.resolve("kafka-ui.db").toString());
    context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("testEnv", vars));
    return context;
  }

  private String readStoredYaml(Path sqliteFilePath) throws Exception {
    try (var connection = DriverManager.getConnection("jdbc:sqlite:" + sqliteFilePath);
         var statement = connection.createStatement();
         ResultSet resultSet = statement.executeQuery("select yaml from dynamic_config where id = 1")) {
      assertThat(resultSet.next()).isTrue();
      return resultSet.getString("yaml");
    }
  }
}
