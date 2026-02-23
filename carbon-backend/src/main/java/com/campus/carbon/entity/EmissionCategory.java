package com.campus.carbon.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "emission_categories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmissionCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 20)
    private String unit;

    @Column(name = "emission_factor", nullable = false)
    private Double emissionFactor; // kg CO2 per unit

    private String description;
}
