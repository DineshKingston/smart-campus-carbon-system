package com.campus.carbon.repository;

import com.campus.carbon.entity.EmissionCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmissionCategoryRepository extends JpaRepository<EmissionCategory, Integer> {
}
