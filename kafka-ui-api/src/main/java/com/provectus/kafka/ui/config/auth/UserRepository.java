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

  public long count() {
    try (var connection = sqlite.connection();
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select count(*) from users")) {
      resultSet.next();
      return resultSet.getLong(1);
    } catch (SQLException exception) {
      throw new ValidationException("Error counting users", exception);
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
    } catch (SQLException exception) {
      if (exception.getMessage() != null && exception.getMessage().contains("UNIQUE")) {
        throw new ValidationException("User " + normalized + " already exists", exception);
      }
      throw new ValidationException("Error creating user " + normalized, exception);
    }
  }

  public void delete(long id) {
    UserEntity user = findById(id).orElseThrow(() -> new ValidationException("User not found"));
    if (user.enabled() && enabledUsersCount() == 1) {
      throw new ValidationException("Cannot delete last enabled user");
    }
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement("delete from users where id = ?")) {
      statement.setLong(1, id);
      if (statement.executeUpdate() != 1) {
        throw new ValidationException("User not found");
      }
    } catch (SQLException exception) {
      throw new ValidationException("Error deleting user " + id, exception);
    }
  }

  public List<UserEntity> findAll() {
    try (var connection = sqlite.connection();
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select * from users order by username")) {
      List<UserEntity> users = new ArrayList<>();
      while (resultSet.next()) {
        users.add(map(resultSet));
      }
      return users;
    } catch (SQLException exception) {
      throw new ValidationException("Error reading users", exception);
    }
  }

  public Optional<UserEntity> findById(long id) {
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement("select * from users where id = ?")) {
      statement.setLong(1, id);
      try (var resultSet = statement.executeQuery()) {
        return resultSet.next() ? Optional.of(map(resultSet)) : Optional.empty();
      }
    } catch (SQLException exception) {
      throw new ValidationException("Error reading user " + id, exception);
    }
  }

  public Optional<UserEntity> findByUsername(String username) {
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement("select * from users where username = ?")) {
      statement.setString(1, normalizeUsername(username));
      try (var resultSet = statement.executeQuery()) {
        return resultSet.next() ? Optional.of(map(resultSet)) : Optional.empty();
      }
    } catch (SQLException exception) {
      throw new ValidationException("Error reading user " + username, exception);
    }
  }

  public void setEnabled(long id, boolean enabled) {
    UserEntity user = findById(id).orElseThrow(() -> new ValidationException("User not found"));
    if (!enabled && user.enabled() && enabledUsersCount() == 1) {
      throw new ValidationException("Cannot disable last enabled user");
    }
    updateLong(id, "update users set enabled = ?, updated_at = datetime('now') where id = ?", enabled ? 1 : 0);
  }

  public void updatePassword(long id, String passwordHash) {
    if (passwordHash == null || passwordHash.isBlank()) {
      throw new ValidationException("Password hash cannot be empty");
    }
    updateString(id, "update users set password_hash = ?, updated_at = datetime('now') where id = ?", passwordHash);
  }

  private long enabledUsersCount() {
    try (var connection = sqlite.connection();
         var statement = connection.createStatement();
         var resultSet = statement.executeQuery("select count(*) from users where enabled = 1")) {
      resultSet.next();
      return resultSet.getLong(1);
    } catch (SQLException exception) {
      throw new ValidationException("Error counting enabled users", exception);
    }
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

  private String normalizeUsername(String username) {
    if (username == null || username.trim().isEmpty()) {
      throw new ValidationException("Username cannot be empty");
    }
    return username.trim();
  }

  private void updateLong(long id, String sql, long value) {
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement(sql)) {
      statement.setLong(1, value);
      statement.setLong(2, id);
      if (statement.executeUpdate() != 1) {
        throw new ValidationException("User not found");
      }
    } catch (SQLException exception) {
      throw new ValidationException("Error updating user " + id, exception);
    }
  }

  private void updateString(long id, String sql, String value) {
    try (var connection = sqlite.connection();
         var statement = connection.prepareStatement(sql)) {
      statement.setString(1, value);
      statement.setLong(2, id);
      if (statement.executeUpdate() != 1) {
        throw new ValidationException("User not found");
      }
    } catch (SQLException exception) {
      throw new ValidationException("Error updating user " + id, exception);
    }
  }
}
