package com.campus.carbon.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateUserRequest {
    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    /** "ADMIN" or "STUDENT" — only admins can call this endpoint */
    private String role = "STUDENT";
}
