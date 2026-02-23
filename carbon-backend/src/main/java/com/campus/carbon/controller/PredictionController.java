package com.campus.carbon.controller;

import com.campus.carbon.entity.Prediction;
import com.campus.carbon.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    /**
     * Proxy health check: React → Spring Boot → Flask (Flask port never public)
     * GET /api/predictions/health
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> mlHealth() {
        return ResponseEntity.ok(predictionService.checkMlHealth());
    }

    /**
     * Trigger a new ML forecast for the given month (default = next month).
     * Spring Boot calls Flask internally and stores the result in DB.
     * GET /api/predictions/forecast?month=2026-03
     */
    @GetMapping("/forecast")
    public ResponseEntity<Map<String, Object>> forecast(
            @RequestParam(required = false) String month) {

        if (month == null || month.isBlank()) {
            // Default: next calendar month
            month = LocalDate.now().plusMonths(1)
                    .format(DateTimeFormatter.ofPattern("yyyy-MM"));
        }
        return ResponseEntity.ok(predictionService.forecast(month));
    }

    /**
     * Get the last 12 stored predictions for trend analysis in Grafana / React
     * GET /api/predictions/history
     */
    @GetMapping("/history")
    public ResponseEntity<List<Prediction>> history() {
        return ResponseEntity.ok(predictionService.getHistory());
    }
}
