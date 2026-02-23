package com.campus.carbon.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emission_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmissionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private EmissionCategory category;

    @Column(nullable = false, length = 7)
    private String month; // YYYY-MM

    @Column(nullable = false)
    private Double value;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "co2_kg", nullable = false)
    private Double co2Kg; // Calculated by service layer

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}
