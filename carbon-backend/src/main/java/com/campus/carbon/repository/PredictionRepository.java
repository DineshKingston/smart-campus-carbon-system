package com.campus.carbon.repository;

import com.campus.carbon.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PredictionRepository extends JpaRepository<Prediction, Integer> {
    List<Prediction> findAllByOrderByCreatedAtDesc();

    List<Prediction> findTop12ByOrderByCreatedAtDesc();
}
