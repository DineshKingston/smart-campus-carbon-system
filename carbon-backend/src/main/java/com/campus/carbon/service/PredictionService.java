package com.campus.carbon.service;

import com.campus.carbon.entity.Prediction;
import com.campus.carbon.repository.EmissionRecordRepository;
import com.campus.carbon.repository.PredictionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PredictionService {

    private final PredictionRepository predictionRepo;
    private final EmissionRecordRepository recordRepo;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Proxy health check to Flask — React calls /api/predictions/health → Spring
     * Boot → Flask /health
     * Flask port is never exposed publicly.
     */
    public Map<String, Object> checkMlHealth() {
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    mlServiceUrl + "/health",
                    org.springframework.http.HttpMethod.GET,
                    null,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                    });
            return resp.getBody();
        } catch (Exception e) {
            return Map.of("status", "error", "message", e.getMessage());
        }
    }

    /**
     * Generate a CO₂ prediction for the next month using aggregated monthly inputs.
     * Stores the result in the predictions table (with model_used).
     */
    public Map<String, Object> forecast(String month) {
        // Build input features from latest known monthly totals
        Map<String, Double> totals = buildLatestMonthTotals();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("electricity_kwh", totals.getOrDefault("electricity", 14000.0));
        requestBody.put("diesel_litres", totals.getOrDefault("diesel", 310.0));
        requestBody.put("transport_km", totals.getOrDefault("transport", 8500.0));
        requestBody.put("waste_kg", totals.getOrDefault("waste", 1050.0));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    mlServiceUrl + "/predict",
                    org.springframework.http.HttpMethod.POST,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {
                    });
            Map<String, Object> mlResult = resp.getBody();

            // ─── Store prediction in DB (with model_used) ───────────────
            String modelUsed = (String) mlResult.getOrDefault("model_used", "unknown");
            Double predictedCo2 = ((Number) mlResult.get("predicted_co2")).doubleValue();

            Prediction prediction = new Prediction();
            prediction.setMonth(month);
            prediction.setPredictedCo2(predictedCo2);
            prediction.setModelUsed(modelUsed);
            predictionRepo.save(prediction);

            mlResult.put("month", month);
            mlResult.put("stored", true);
            return mlResult;

        } catch (Exception e) {
            log.error("ML prediction failed: {}", e.getMessage());
            return Map.of("error", "ML service unavailable: " + e.getMessage());
        }
    }

    public List<Prediction> getHistory() {
        return predictionRepo.findTop12ByOrderByCreatedAtDesc();
    }

    /** Aggregate latest month's emission values per category */
    private Map<String, Double> buildLatestMonthTotals() {
        Map<String, Double> totals = new HashMap<>();
        List<Object[]> byCat = recordRepo.findCo2ByCategory();
        // This is simplified — returns category totals
        for (Object[] row : byCat) {
            String cat = ((String) row[0]).toLowerCase();
            double val = ((Number) row[1]).doubleValue();
            totals.put(cat, val);
        }
        return totals;
    }
}
