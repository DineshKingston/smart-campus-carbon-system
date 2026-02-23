package com.campus.carbon.service;

import com.campus.carbon.dto.*;
import com.campus.carbon.entity.*;
import com.campus.carbon.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmissionService {

    private final EmissionRecordRepository recordRepo;
    private final EmissionCategoryRepository categoryRepo;
    private final UserRepository userRepo;

    public List<EmissionRecordResponse> getAllRecords() {
        return recordRepo.findAllByOrderByMonthDescCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public EmissionRecordResponse addRecord(EmissionRecordRequest req) {
        EmissionCategory category = categoryRepo.findById(req.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found: " + req.getCategoryId()));
        double co2 = req.getValue() * category.getEmissionFactor();
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepo.findByUsername(username).orElseThrow();
        EmissionRecord record = new EmissionRecord();
        record.setCategory(category);
        record.setMonth(req.getMonth());
        record.setValue(req.getValue());
        record.setUnit(category.getUnit());
        record.setCo2Kg(Math.round(co2 * 100.0) / 100.0);
        record.setRecordedBy(user);
        return toResponse(recordRepo.save(record));
    }

    public void deleteRecord(Integer id) {
        if (!recordRepo.existsById(id))
            throw new IllegalArgumentException("Record not found: " + id);
        recordRepo.deleteById(id);
    }

    public List<EmissionCategory> getCategories() {
        return categoryRepo.findAll();
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // FLEXIBLE CSV UPLOAD
    //
    // Strategy:
    // 1. Read the header row to get column names.
    // 2. Scan the FIRST DATA ROW to classify each column as:
    // - DATE column : value matches known date patterns (YYYY-MM, YYYY/MM, etc.)
    // - NUMERIC col : value is a parseable number
    // - TEXT col : everything else (Food_Type, Housing_Type, etc.)
    // 3. If no DATE column found → use the current month (auto-assigned).
    // 4. Each NUMERIC column becomes a separate EmissionRecord per row,
    // using the column name as the category name.
    // 5. TEXT columns are silently ignored.
    // 6. Auto-create unknown EmissionCategory entries (factor=1.0, unit=units).
    // ─────────────────────────────────────────────────────────────────────────────
    public Map<String, Object> uploadCsv(MultipartFile file) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepo.findByUsername(username).orElseThrow();

        int imported = 0, skipped = 0;
        List<String> detectedColumns = new ArrayList<>();
        String currentMonth = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {

            // ── 1. Read header ────────────────────────────────────────────────
            String headerLine = null;
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (!line.isEmpty()) {
                    headerLine = line;
                    break;
                }
            }
            if (headerLine == null)
                return resultMap(0, 0, List.of(), "Empty file");

            String[] headers = splitCsvLine(headerLine);
            detectedColumns = Arrays.stream(headers).map(String::trim).collect(Collectors.toList());

            // ── 2. Read first data row to classify columns by their VALUES ────
            String firstDataLine = null;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (!line.isEmpty()) {
                    firstDataLine = line;
                    break;
                }
            }
            if (firstDataLine == null)
                return resultMap(0, 0, detectedColumns, "No data rows found");

            String[] firstRow = splitCsvLine(firstDataLine);

            // Column type classification based on actual cell values
            int dateColIdx = -1;
            List<Integer> numericCols = new ArrayList<>(); // indices of numeric columns

            for (int i = 0; i < headers.length; i++) {
                String val = (i < firstRow.length) ? firstRow[i].trim().replaceAll("\"", "") : "";
                if (isDateValue(val)) {
                    if (dateColIdx < 0)
                        dateColIdx = i; // first date column wins
                } else if (isNumericValue(val)) {
                    numericCols.add(i);
                }
                // else: TEXT column → ignored
            }

            if (numericCols.isEmpty()) {
                return resultMap(0, 0, detectedColumns, "No numeric columns detected in the dataset.");
            }

            log.info("CSV Upload — dateCol={}, numericCols={}", dateColIdx, numericCols);

            // ── 3. Process first data row (already read above) ────────────────
            Map<Integer, EmissionCategory> catCache = new HashMap<>();
            imported += processRow(firstRow, headers, dateColIdx, numericCols, currentMonth, user, catCache);
            if (imported == 0)
                skipped++;

            // ── 4. Process remaining rows ─────────────────────────────────────
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty())
                    continue;
                String[] parts = splitCsvLine(line);
                int rowImported = processRow(parts, headers, dateColIdx, numericCols, currentMonth, user, catCache);
                if (rowImported > 0)
                    imported += rowImported;
                else
                    skipped++;
            }

        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse CSV: " + e.getMessage());
        }

        return resultMap(imported, skipped, detectedColumns, null);
    }

    // ── Processes one CSV row, returns number of records created ───────────────
    private int processRow(String[] parts, String[] headers, int dateColIdx,
            List<Integer> numericCols, String fallbackMonth,
            User user, Map<Integer, EmissionCategory> catCache) {
        // Resolve month for this row
        String month = fallbackMonth;
        if (dateColIdx >= 0 && dateColIdx < parts.length) {
            String raw = parts[dateColIdx].trim().replaceAll("\"", "");
            String parsed = normalizeMonth(raw);
            if (parsed != null)
                month = parsed;
        }

        int count = 0;
        for (int colIdx : numericCols) {
            if (colIdx >= parts.length)
                continue;
            String rawVal = parts[colIdx].trim().replaceAll("[\",$]", "");
            if (!isNumericValue(rawVal))
                continue;
            try {
                double value = Double.parseDouble(rawVal);
                // Get/create category for this column
                EmissionCategory category = catCache.computeIfAbsent(colIdx, k -> {
                    String colName = cleanColumnName(headers[k]);
                    return getOrCreateCategory(colName);
                });
                double co2 = value * category.getEmissionFactor();
                EmissionRecord record = new EmissionRecord();
                record.setCategory(category);
                record.setMonth(month);
                record.setValue(value);
                record.setUnit(category.getUnit());
                record.setCo2Kg(Math.round(co2 * 100.0) / 100.0);
                record.setRecordedBy(user);
                recordRepo.save(record);
                count++;
            } catch (Exception e) {
                log.warn("Skipping column {} value '{}': {}", headers[colIdx], rawVal, e.getMessage());
            }
        }
        return count;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    /**
     * Returns true if the raw string represents a date in a known monthly format.
     */
    private boolean isDateValue(String val) {
        return val.matches("\\d{4}-\\d{2}") // 2025-01
                || val.matches("\\d{4}/\\d{2}") // 2025/01
                || val.matches("\\d{1,2}/\\d{4}") // 01/2025
                || val.matches("\\d{4}-\\d{2}-\\d{2}") // 2025-01-15
                || val.matches("\\d{4}/\\d{1,2}/\\d{1,2}"); // 2025/01/15
    }

    /** Returns true if the raw string is a parseable number. */
    private boolean isNumericValue(String val) {
        if (val == null || val.isEmpty())
            return false;
        try {
            Double.parseDouble(val);
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    /**
     * Normalize various month strings to YYYY-MM. Returns null if not parseable.
     */
    private String normalizeMonth(String raw) {
        if (raw == null || raw.isBlank())
            return null;
        if (raw.matches("\\d{4}-\\d{2}"))
            return raw;
        if (raw.matches("\\d{4}/\\d{2}"))
            return raw.replace('/', '-');
        if (raw.matches("(\\d{4})[/-](\\d{1,2})")) {
            String[] p = raw.split("[/-]");
            return p[0] + "-" + String.format("%02d", Integer.parseInt(p[1]));
        }
        if (raw.matches("(\\d{1,2})[/-](\\d{4})")) {
            String[] p = raw.split("[/-]");
            return p[1] + "-" + String.format("%02d", Integer.parseInt(p[0]));
        }
        if (raw.matches("\\d{4}-\\d{2}-\\d{2}") || raw.matches("\\d{4}/\\d{2}/\\d{2}")) {
            return raw.substring(0, 7).replace('/', '-');
        }
        return null;
    }

    /**
     * Convert column header to a clean category name (e.g.
     * "Energy_Usage_kWh_per_Month" → "Energy Usage").
     */
    private String cleanColumnName(String header) {
        // Remove common suffixes, replace underscores with spaces
        return header.replaceAll("(?i)_per_month|_per_day|_kWh|_kg|_CO2|_Liters?|_[Cc][Oo]2", "")
                .replaceAll("_+", " ")
                .trim();
    }

    private final Map<String, EmissionCategory> categoryCache = new HashMap<>();

    private EmissionCategory getOrCreateCategory(String name) {
        return categoryCache.computeIfAbsent(name.toLowerCase(), k -> {
            List<EmissionCategory> all = categoryRepo.findAll();
            return all.stream()
                    .filter(c -> c.getName().equalsIgnoreCase(name))
                    .findFirst()
                    .orElseGet(() -> {
                        EmissionCategory nc = new EmissionCategory();
                        nc.setName(name);
                        nc.setUnit("units");
                        nc.setEmissionFactor(1.0);
                        nc.setDescription("Auto-created from CSV upload");
                        log.info("Auto-created category: '{}'", name);
                        return categoryRepo.save(nc);
                    });
        });
    }

    /** Basic CSV line splitter that handles quoted fields with commas inside. */
    private String[] splitCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuote = false;
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuote = !inQuote;
            } else if (c == ',' && !inQuote) {
                result.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(c);
            }
        }
        result.add(cur.toString());
        return result.toArray(new String[0]);
    }

    private Map<String, Object> resultMap(int imported, int skipped, List<String> cols, String error) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("rows_imported", imported);
        m.put("rows_skipped", skipped);
        m.put("columns_detected", cols);
        if (error != null)
            m.put("error", error);
        return m;
    }

    private EmissionRecordResponse toResponse(EmissionRecord r) {
        return EmissionRecordResponse.builder()
                .id(r.getId())
                .categoryName(r.getCategory().getName())
                .month(r.getMonth())
                .value(r.getValue())
                .unit(r.getUnit())
                .co2Kg(r.getCo2Kg())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
