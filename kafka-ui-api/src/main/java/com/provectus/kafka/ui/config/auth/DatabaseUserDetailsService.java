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
