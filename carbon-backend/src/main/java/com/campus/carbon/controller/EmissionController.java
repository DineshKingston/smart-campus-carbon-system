package com.campus.carbon.controller;

import com.campus.carbon.dto.*;
import com.campus.carbon.entity.EmissionCategory;
import com.campus.carbon.service.EmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emissions")
@RequiredArgsConstructor
public class EmissionController {

    private final EmissionService emissionService;

    @GetMapping
    public ResponseEntity<List<EmissionRecordResponse>> getAll() {
        return ResponseEntity.ok(emissionService.getAllRecords());
    }

    @PostMapping
    public ResponseEntity<EmissionRecordResponse> add(
            @Valid @RequestBody EmissionRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(emissionService.addRecord(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        emissionService.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    public ResponseEntity<List<EmissionCategory>> categories() {
        return ResponseEntity.ok(emissionService.getCategories());
    }

    /**
     * CSV bulk upload endpoint.
     * Flexible format: accepts any CSV with recognisable month + value columns.
     * Category can be numeric ID or free-text name (auto-created if new).
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadCsv(
            @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty", "rows_imported", 0, "rows_skipped", 0));
        }
        Map<String, Object> result = emissionService.uploadCsv(file);
        if (result.containsKey("error") && (int) result.get("rows_imported") == 0) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }
}
