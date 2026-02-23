package com.campus.carbon.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> welcome() {
        return Map.of(
                "message", "🌱 Smart Campus Carbon Tracker API is Running",
                "frontend_url", "http://localhost:3000",
                "grafana_url", "http://localhost:3001",
                "documentation", "Check project_guide.md for API documentation");
    }
}
