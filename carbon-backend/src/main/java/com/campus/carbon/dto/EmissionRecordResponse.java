package com.campus.carbon.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EmissionRecordResponse {
    private Integer id;
    private String categoryName;
    private String month;
    private Double value;
    private String unit;
    private Double co2Kg;
    private LocalDateTime createdAt;
}
