package com.provectus.kafka.ui.config.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.spec.MGF1ParameterSpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import org.junit.jupiter.api.Test;

class LoginEncryptionServiceTest {

  @Test
  void decryptsRsaOaepSha256EncryptedPassword() throws Exception {
    LoginEncryptionService service = new LoginEncryptionService();
    LoginEncryptionService.PublicKeyDto publicKey = service.publicKey();

    String encryptedPassword = encryptLikeWebCrypto("secret", publicKey);

    assertThat(service.decrypt(encryptedPassword)).isEqualTo("secret");
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
