package com.campus.carbon.service;

import com.campus.carbon.entity.Prediction;
import com.campus.carbon.repository.EmissionRecordRepository;
import com.campus.carbon.repository.PredictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmissionRecordRepository recordRepo;
    private final PredictionRepository predictionRepo;

    public Map<String, Object> getSummary() {
        Double totalCo2 = recordRepo.findTotalCo2();
        long totalRecords = recordRepo.count();
        long totalPredictions = predictionRepo.count();

        List<Object[]> byCategory = recordRepo.findCo2ByCategory();
        Map<String, Double> categoryBreakdown = new LinkedHashMap<>();
        for (Object[] row : byCategory) {
            categoryBreakdown.put((String) row[0], Math.round(((Number) row[1]).doubleValue() * 100.0) / 100.0);
        }

        List<Prediction> predictions = predictionRepo.findTop12ByOrderByCreatedAtDesc();
        Double latestPrediction = predictions.isEmpty() ? 0.0 : predictions.get(0).getPredictedCo2();

        List<Object[]> monthly = recordRepo.findMonthlyCo2Totals();
        List<Map<String, Object>> monthlyTrend = new ArrayList<>();
        for (Object[] row : monthly) {
            Map<String, Object> point = new HashMap<>();
            point.put("month", row[0]);
            point.put("co2_kg", Math.round(((Number) row[1]).doubleValue() * 100.0) / 100.0);
            monthlyTrend.add(point);
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("total_co2_kg", totalCo2 != null ? Math.round(totalCo2 * 100.0) / 100.0 : 0);
        summary.put("total_predictions", latestPrediction);
        summary.put("total_records", totalRecords);
        summary.put("category_breakdown", categoryBreakdown);
        summary.put("monthly_trend", monthlyTrend);
        return summary;
    }
}
