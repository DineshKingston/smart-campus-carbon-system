package com.campus.carbon.service;

import com.campus.carbon.dto.*;
import com.campus.carbon.entity.User;
import com.campus.carbon.repository.UserRepository;
import com.campus.carbon.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@lombok.extern.slf4j.Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authManager;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new IllegalArgumentException("Username already taken");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new IllegalArgumentException("Email already registered");

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole(User.Role.STUDENT); // Public registration always creates STUDENT
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername());
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .message("Registration successful")
                .build();
    }

    public AuthResponse login(LoginRequest req) {
        log.info("Login attempt for user: {}", req.getUsername());
        try {
            authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        } catch (AuthenticationException ex) {
            log.warn("Login failed for user: {}: {}", req.getUsername(), ex.getMessage());
            throw new IllegalArgumentException("Invalid username or password");
        }

        User user = userRepository.findByUsername(req.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (user.getRole() == null) {
            log.error("User {} has NO ROLE assigned!", user.getUsername());
            throw new IllegalStateException("User account configuration error: No role assigned");
        }

        String token = jwtUtil.generateToken(user.getUsername());
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole().name())
                .message("Login successful")
                .build();
    }
}
