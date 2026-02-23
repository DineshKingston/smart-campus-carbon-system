package com.campus.carbon;

import com.campus.carbon.entity.User;
import com.campus.carbon.repository.EmissionCategoryRepository;
import com.campus.carbon.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
@RequiredArgsConstructor
@Slf4j
public class CarbonApplication implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmissionCategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    public static void main(String[] args) {
        SpringApplication.run(CarbonApplication.class, args);
    }

    @Override
    public void run(String... args) {
        // Ensure default admin exists and has correct password
        userRepository.findByUsername("admin").ifPresentOrElse(
                admin -> {
                    // If admin exists but password doesn't match encoded "Admin@123", update it
                    if (!passwordEncoder.matches("Admin@123", admin.getPassword())) {
                        admin.setPassword(passwordEncoder.encode("Admin@123"));
                        userRepository.save(admin);
                        log.info("🔄 Default admin password updated to 'Admin@123'");
                    }
                },
                () -> {
                    User admin = new User();
                    admin.setUsername("admin");
                    admin.setEmail("admin@campus.edu");
                    admin.setPassword(passwordEncoder.encode("Admin@123"));
                    admin.setRole(User.Role.ADMIN);
                    userRepository.save(admin);
                    log.info("✅ Default admin user created (admin / Admin@123)");
                });
        log.info("🌱 Smart Campus Carbon Tracker started on port 8080");
    }
}
