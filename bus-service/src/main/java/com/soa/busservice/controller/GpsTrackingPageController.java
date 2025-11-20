package com.soa.busservice.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller to serve the GPS Tracking WebSocket client page.
 */
@Controller
public class GpsTrackingPageController {
    
    /**
     * Serve the GPS tracking real-time dashboard.
     * 
     * Access at: http://localhost:8080/gps-tracking
     */
    @GetMapping("/gps-tracking")
    public String gpsTrackingPage() {
        return "gps-tracking";
    }
}
