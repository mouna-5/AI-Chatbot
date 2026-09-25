package com.chatbot.demo;

import com.chatbot.demo.dto.AuthResponse;
import com.chatbot.demo.entity.User;
import com.chatbot.demo.service.AuthService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody User user) {

        try {

            User registeredUser =
                    authService.register(user);

            return ResponseEntity.ok(
                    registeredUser
            );

        } catch (RuntimeException e) {

            if ("Email already registered"
                    .equals(e.getMessage())) {

                return ResponseEntity
                        .status(HttpStatus.CONFLICT)
                        .body(
                                "Email ID already exists. Please login."
                        );
            }

            return ResponseEntity
                    .badRequest()
                    .body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody User user) {

        try {

            String token = authService.login(
                    user.getEmail(),
                    user.getPassword()
            );

            return ResponseEntity.ok(
                    new AuthResponse(token)
            );

        } catch (RuntimeException e) {

            if ("User not found"
                    .equals(e.getMessage())) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(
                                "Email ID is not registered. Please register first."
                        );
            }

            if ("Invalid password"
                    .equals(e.getMessage())) {

                return ResponseEntity
                        .status(HttpStatus.UNAUTHORIZED)
                        .body(
                                "Incorrect password. Please try again."
                        );
            }

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(e.getMessage());
        }
    }
}
