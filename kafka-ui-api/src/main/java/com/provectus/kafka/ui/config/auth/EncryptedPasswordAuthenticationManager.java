package com.provectus.kafka.ui.config.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.authentication.ReactiveAuthenticationManager;
import org.springframework.security.authentication.UserDetailsRepositoryReactiveAuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.ReactiveUserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

@Component
@ConditionalOnProperty(value = "auth.type", havingValue = "LOGIN_FORM")
@RequiredArgsConstructor
public class EncryptedPasswordAuthenticationManager implements ReactiveAuthenticationManager {

  private final LoginEncryptionService encryptionService;
  private final ReactiveUserDetailsService userDetailsService;
  private final PasswordEncoder passwordEncoder;

  @Override
  public Mono<Authentication> authenticate(Authentication authentication) throws AuthenticationException {
    return Mono.fromCallable(() -> decrypt(authentication))
        .flatMap(delegate()::authenticate);
  }

  private Authentication decrypt(Authentication authentication) throws Exception {
    String encryptedPassword = String.valueOf(authentication.getCredentials());
    String password = encryptionService.decrypt(encryptedPassword);
    return UsernamePasswordAuthenticationToken.unauthenticated(authentication.getName(), password);
  }

  private ReactiveAuthenticationManager delegate() {
    UserDetailsRepositoryReactiveAuthenticationManager manager =
        new UserDetailsRepositoryReactiveAuthenticationManager(userDetailsService);
    manager.setPasswordEncoder(passwordEncoder);
    return manager;
  }
}
