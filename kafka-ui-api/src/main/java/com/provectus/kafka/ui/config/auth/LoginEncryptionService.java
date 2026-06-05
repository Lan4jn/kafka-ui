package com.provectus.kafka.ui.config.auth;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.MGF1ParameterSpec;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.OAEPParameterSpec;
import javax.crypto.spec.PSource;
import org.springframework.stereotype.Component;

@Component
public class LoginEncryptionService {

  private final KeyPair keyPair;

  public LoginEncryptionService() throws GeneralSecurityException {
    KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
    generator.initialize(2048);
    this.keyPair = generator.generateKeyPair();
  }

  public PublicKeyDto publicKey() {
    RSAPublicKey publicKey = (RSAPublicKey) keyPair.getPublic();
    return new PublicKeyDto(
        base64Url(publicKey.getModulus().toByteArray()),
        base64Url(publicKey.getPublicExponent().toByteArray())
    );
  }

  public String decrypt(String encryptedPassword) throws GeneralSecurityException {
    Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPPadding");
    cipher.init(
        Cipher.DECRYPT_MODE,
        keyPair.getPrivate(),
        new OAEPParameterSpec(
            "SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT)
    );
    byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedPassword));
    return new String(decrypted, StandardCharsets.UTF_8);
  }

  private static String base64Url(byte[] bytes) {
    int offset = 0;
    while (offset < bytes.length - 1 && bytes[offset] == 0) {
      offset++;
    }
    return Base64.getUrlEncoder().withoutPadding().encodeToString(
        java.util.Arrays.copyOfRange(bytes, offset, bytes.length)
    );
  }

  public record PublicKeyDto(String n, String e) {
  }
}
