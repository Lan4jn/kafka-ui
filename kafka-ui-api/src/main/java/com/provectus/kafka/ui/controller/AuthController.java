package com.provectus.kafka.ui.controller;

import com.provectus.kafka.ui.config.auth.LoginEncryptionService;
import com.provectus.kafka.ui.config.auth.LoginEncryptionService.PublicKeyDto;
import java.nio.charset.Charset;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.web.server.csrf.CsrfToken;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AuthController {

  private final LoginEncryptionService loginEncryptionService;

  @GetMapping(value = "/auth", produces = {"text/html"})
  public Mono<byte[]> getAuth(ServerWebExchange exchange) {
    Mono<CsrfToken> token = exchange.getAttributeOrDefault(CsrfToken.class.getName(), Mono.empty());
    return token
        .map(AuthController::csrfToken)
        .defaultIfEmpty("")
        .map(csrfTokenHtmlInput -> createPage(exchange, csrfTokenHtmlInput));
  }

  @GetMapping(value = "/auth/public-key", produces = {"application/json"})
  public Mono<PublicKeyDto> getPublicKey() {
    return Mono.just(loginEncryptionService.publicKey());
  }

  private byte[] createPage(ServerWebExchange exchange, String csrfTokenHtmlInput) {
    MultiValueMap<String, String> queryParams = exchange.getRequest()
        .getQueryParams();
    String contextPath = exchange.getRequest().getPath().contextPath().value();
    String page =
        "<!DOCTYPE html>\n" + "<html lang=\"en\">\n" + "  <head>\n"
        + "    <meta charset=\"utf-8\">\n"
        + "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, "
        + "shrink-to-fit=no\">\n"
        + "    <meta name=\"description\" content=\"\">\n"
        + "    <meta name=\"author\" content=\"\">\n"
        + "    <title>Please sign in</title>\n"
        + "    <link href=\"" + contextPath + "/static/css/bootstrap.min.css\" rel=\"stylesheet\" "
        + "integrity=\"sha384-/Y6pD6FV/Vv2HJnA6t+vslU6fwYXjCFtcEpHbNJ0lyAFsXTsjBbfaDjzALeQsN6M\" "
        + "crossorigin=\"anonymous\">\n"
        + "    <link href=\"" + contextPath + "/static/css/signin.css\" "
        + "rel=\"stylesheet\" crossorigin=\"anonymous\"/>\n"
        + "  </head>\n"
        + "  <body>\n"
        + "     <div class=\"container\">\n"
        + formLogin(queryParams, contextPath, csrfTokenHtmlInput)
        + "    </div>\n"
        + "  </body>\n"
        + "</html>";

    return page.getBytes(Charset.defaultCharset());
  }

  private String formLogin(
      MultiValueMap<String, String> queryParams,
      String contextPath, String csrfTokenHtmlInput) {

    boolean isError = queryParams.containsKey("error");
    boolean isLogoutSuccess = queryParams.containsKey("logout");
    return
        "      <form class=\"form-signin\" method=\"post\" action=\"" + contextPath + "/auth\">\n"
        + "        <h2 class=\"form-signin-heading\">Please sign in</h2>\n"
        + createError(isError)
        + createLogoutSuccess(isLogoutSuccess)
        + "        <p>\n"
        + "          <label for=\"username\" class=\"sr-only\">Username</label>\n"
        + "          <input type=\"text\" id=\"username\" name=\"username\" class=\"form-control\" "
        + "placeholder=\"Username\" required autofocus>\n"
        + "        </p>\n" + "        <p>\n"
        + "          <label for=\"password\" class=\"sr-only\">Password</label>\n"
        + "          <input type=\"password\" id=\"password\" "
        + "class=\"form-control\" placeholder=\"Password\" required>\n"
        + "        </p>\n"
        + "        <input type=\"hidden\" id=\"encryptedPassword\" name=\"password\">\n"
        + csrfTokenHtmlInput
        + "        <button class=\"btn btn-lg btn-primary btn-block\" "
        + "type=\"submit\">Sign in</button>\n"
        + "        <script>\n"
        + "          const form = document.querySelector('form');\n"
        + "          form.addEventListener('submit', async (event) => {\n"
        + "            event.preventDefault();\n"
        + "            const password = document.getElementById('password');\n"
        + "            const keyResponse = await fetch('" + contextPath + "/auth/public-key');\n"
        + "            const key = await keyResponse.json();\n"
        + "            const decode = (value) => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), "
        + "(char) => char.charCodeAt(0));\n"
        + "            const publicKey = await crypto.subtle.importKey('jwk', { kty: 'RSA', n: key.n, e: key.e, "
        + "alg: 'RSA-OAEP-256', ext: true }, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);\n"
        + "            const encrypted = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, "
        + "new TextEncoder().encode(password.value));\n"
        + "            const encryptedBytes = new Uint8Array(encrypted);\n"
        + "            document.getElementById('encryptedPassword').value = "
        + "btoa(String.fromCharCode(...encryptedBytes));\n"
        + "            form.submit();\n"
        + "          });\n"
        + "        </script>\n"
        + "      </form>\n";
  }

  private static String csrfToken(CsrfToken token) {
    return "          <input type=\"hidden\" name=\""
        + token.getParameterName()
        + "\" value=\""
        + token.getToken()
        + "\">\n";
  }

  private static String createError(boolean isError) {
    return isError
        ? "<div class=\"alert alert-danger\" role=\"alert\">Invalid credentials</div>"
        : "";
  }

  private static String createLogoutSuccess(boolean isLogoutSuccess) {
    return isLogoutSuccess
        ? "<div class=\"alert alert-success\" role=\"alert\">You have been signed out</div>"
        : "";
  }
}
