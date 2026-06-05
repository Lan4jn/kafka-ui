package com.provectus.kafka.ui.config.auth;

import static com.provectus.kafka.ui.persistence.ApplicationSqliteOperations.KAFKA_UI_SQLITE_PATH_PROPERTY;
import static org.assertj.core.api.Assertions.assertThat;

import com.provectus.kafka.ui.persistence.ApplicationSqliteOperations;
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
