package com.campus.carbon.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "predictions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 7)
    private String month; // YYYY-MM

    @Column(name = "predicted_co2", nullable = false)
    private Double predictedCo2;

    @Column(name = "model_used", nullable = false, length = 50)
    private String modelUsed; // e.g. "random_forest_v1"

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
