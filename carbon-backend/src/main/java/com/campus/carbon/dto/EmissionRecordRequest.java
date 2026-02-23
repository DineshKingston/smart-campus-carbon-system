package com.campus.carbon.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class EmissionRecordRequest {
    @NotNull
    private Integer categoryId;
    @NotBlank
    @Pattern(regexp = "\\d{4}-\\d{2}")
    private String month;
    @NotNull
    @Positive
    private Double value;
}
