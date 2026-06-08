package com.provectus.kafka.ui.controller;

import com.provectus.kafka.ui.api.ApiUsersApi;
import com.provectus.kafka.ui.config.auth.UserEntity;
import com.provectus.kafka.ui.config.auth.UserRepository;
import com.provectus.kafka.ui.model.CreateUserRequestDTO;
import com.provectus.kafka.ui.model.ResetUserPasswordRequestDTO;
import com.provectus.kafka.ui.model.SetUserEnabledRequestDTO;
import com.provectus.kafka.ui.model.UserDTO;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
public class UsersController implements ApiUsersApi {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  public Mono<ResponseEntity<UserDTO>> createUser(Mono<CreateUserRequestDTO> request) {
    return createUser(request, null);
  }

  @Override
  public Mono<ResponseEntity<UserDTO>> createUser(Mono<CreateUserRequestDTO> request,
                                                  ServerWebExchange exchange) {
    return request.map(createUserRequest -> userRepository.create(
            createUserRequest.getUsername(),
            passwordEncoder.encode(createUserRequest.getPassword()),
            Boolean.TRUE.equals(createUserRequest.getEnabled())
        ))
        .map(UsersController::toDto)
        .map(ResponseEntity::ok);
  }

  public Mono<ResponseEntity<Void>> deleteUser(Long id) {
    return deleteUser(id, null);
  }

  @Override
  public Mono<ResponseEntity<Void>> deleteUser(Long id, ServerWebExchange exchange) {
    return Mono.fromRunnable(() -> userRepository.delete(id))
        .thenReturn(ResponseEntity.noContent().build());
  }

  public Mono<ResponseEntity<List<UserDTO>>> getUsers() {
    return Mono.just(ResponseEntity.ok(userRepository.findAll().stream().map(UsersController::toDto).toList()));
  }

  @Override
  public Mono<ResponseEntity<Flux<UserDTO>>> getUsers(ServerWebExchange exchange) {
    return Mono.just(ResponseEntity.ok(Flux.fromIterable(userRepository.findAll()).map(UsersController::toDto)));
  }

  public Mono<ResponseEntity<Void>> resetUserPassword(Long id,
                                                      Mono<ResetUserPasswordRequestDTO> request) {
    return resetUserPassword(id, request, null);
  }

  @Override
  public Mono<ResponseEntity<Void>> resetUserPassword(Long id,
                                                      Mono<ResetUserPasswordRequestDTO> request,
                                                      ServerWebExchange exchange) {
    return request.map(resetPasswordRequest -> passwordEncoder.encode(resetPasswordRequest.getPassword()))
        .doOnNext(passwordHash -> userRepository.updatePassword(id, passwordHash))
        .thenReturn(ResponseEntity.noContent().build());
  }

  public Mono<ResponseEntity<Void>> setUserEnabled(Long id,
                                                   Mono<SetUserEnabledRequestDTO> request) {
    return setUserEnabled(id, request, null);
  }

  @Override
  public Mono<ResponseEntity<Void>> setUserEnabled(Long id,
                                                   Mono<SetUserEnabledRequestDTO> request,
                                                   ServerWebExchange exchange) {
    return request.map(setEnabledRequest -> Boolean.TRUE.equals(setEnabledRequest.getEnabled()))
        .doOnNext(enabled -> userRepository.setEnabled(id, enabled))
        .thenReturn(ResponseEntity.noContent().build());
  }

  private static UserDTO toDto(UserEntity user) {
    return new UserDTO()
        .id(user.id())
        .username(user.username())
        .enabled(user.enabled())
        .createdAt(user.createdAt())
        .updatedAt(user.updatedAt());
  }
}
