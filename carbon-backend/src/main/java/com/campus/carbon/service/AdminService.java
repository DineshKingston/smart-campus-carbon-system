package com.campus.carbon.service;

import com.campus.carbon.dto.*;
import com.campus.carbon.entity.User;
import com.campus.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse createUser(CreateUserRequest req) {
        if (userRepository.existsByUsername(req.getUsername()))
            throw new IllegalArgumentException("Username already taken");
        if (userRepository.existsByEmail(req.getEmail()))
            throw new IllegalArgumentException("Email already registered");

        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setRole("ADMIN".equalsIgnoreCase(req.getRole()) ? User.Role.ADMIN : User.Role.STUDENT);
        userRepository.save(user);
        return toResponse(user);
    }

    public void deleteUser(Integer id) {
        if (!userRepository.existsById(id))
            throw new IllegalArgumentException("User not found: " + id);
        userRepository.deleteById(id);
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .role(u.getRole().name())
                .createdAt(u.getCreatedAt() != null ? u.getCreatedAt().toString() : "")
                .build();
    }
}
