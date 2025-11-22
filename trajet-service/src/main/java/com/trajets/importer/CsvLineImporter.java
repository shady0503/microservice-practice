// src/main/java/com/trajets/importer/CsvLineImporter.java
package com.trajets.importer;

import com.trajets.dto.CsvRouteRecord;
import com.trajets.service.LineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class CsvLineImporter implements CommandLineRunner {
    
    private final LineService lineService;
    private static final String CSV_FILE = "bus_lines_export.csv";
    private static final int RATE_LIMIT_DELAY_MS = 1000; // 1 second between requests
    
    @Override
    public void run(String... args) throws Exception {
        log.info("═════════════════════════════════════════════════════════");
        log.info("          Bus Lines Import from CSV - Single Direction");
        log.info("═════════════════════════════════════════════════════════");
        
        List<CsvRouteRecord> records = readCsvFile();
        
        if (records.isEmpty()) {
            log.warn("No records found in CSV file");
            return;
        }
        
        // Group by line ref (each line may have multiple direction options)
        Map<String, List<CsvRouteRecord>> lineGroups = records.stream()
                .collect(Collectors.groupingBy(CsvRouteRecord::getRef));
        
        log.info("Total CSV records:  {}", records.size());
        log.info("Unique lines:       {}", lineGroups.size());
        log.info("");
        
        // Show what we'll process
        log.info("Lines to import:");
        lineGroups.forEach((ref, routes) -> 
                log.info("  {} -> {} route option(s)", ref, routes.size()));
        log.info("");
        
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);
        AtomicInteger skippedCount = new AtomicInteger(0);
        
        int lineNumber = 0;
        int totalLines = lineGroups.size();
        
        for (Map.Entry<String, List<CsvRouteRecord>> entry : lineGroups.entrySet()) {
            lineNumber++;
            String ref = entry.getKey();
            List<CsvRouteRecord> routeOptions = entry.getValue();
            
            log.info("─────────────────────────────────────────────────────────");
            log.info("Processing line {}/{}: {}", lineNumber, totalLines, ref);
            log.info("  Available route options: {}", routeOptions.size());
            
            for (int i = 0; i < routeOptions.size(); i++) {
                log.info("    Option {}: {} (OSM: {})", 
                        i + 1, 
                        routeOptions.get(i).getName(), 
                        routeOptions.get(i).getOsmRelationId());
            }
            log.info("");
            
            try {
                boolean success = lineService.importLine(ref, routeOptions);
                
                if (success) {
                    successCount.incrementAndGet();
                } else {
                    failureCount.incrementAndGet();
                }
                
                // Rate limiting
                if (lineNumber < totalLines) {
                    log.info("");
                    log.info("Waiting {}ms before next line...", RATE_LIMIT_DELAY_MS);
                    Thread.sleep(RATE_LIMIT_DELAY_MS);
                    log.info("");
                }
                
            } catch (Exception e) {
                failureCount.incrementAndGet();
                log.error("✗ Exception importing line {}: {}", ref, e.getMessage());
            }
        }
        
        // Final summary
        log.info("");
        log.info("═════════════════════════════════════════════════════════");
        log.info("                   IMPORT COMPLETE");
        log.info("═════════════════════════════════════════════════════════");
        log.info("Total Lines:       {}", totalLines);
        log.info("Successful:        {} ✓", successCount.get());
        log.info("Failed:            {} ✗", failureCount.get());
        log.info("Success Rate:      {}%", 
                totalLines > 0 ? (successCount.get() * 100 / totalLines) : 0);
        log.info("═════════════════════════════════════════════════════════");
    }
    
    private List<CsvRouteRecord> readCsvFile() {
        List<CsvRouteRecord> records = new ArrayList<>();
        
        try {
            ClassPathResource resource = new ClassPathResource(CSV_FILE);
            BufferedReader reader = new BufferedReader(
                    new InputStreamReader(resource.getInputStream()));
            
            String line;
            boolean firstLine = true;
            int lineNumber = 0;
            
            while ((line = reader.readLine()) != null) {
                lineNumber++;
                
                if (firstLine) {
                    firstLine = false;
                    log.info("CSV Header: {}", line);
                    continue;
                }
                
                String[] parts = parseCsvLine(line);
                
                if (parts.length >= 3) {
                    CsvRouteRecord record = new CsvRouteRecord(
                            parts[0].trim(),  // ref
                            parts[1].trim(),  // name
                            parts[2].trim()   // osm_relation_id
                    );
                    records.add(record);
                } else {
                    log.warn("Skipping malformed line {}: {}", lineNumber, line);
                }
            }
            
            reader.close();
            log.info("Successfully read {} records from CSV", records.size());
            
        } catch (Exception e) {
            log.error("Error reading CSV file: {}", e.getMessage(), e);
        }
        
        return records;
    }
    
    private String[] parseCsvLine(String line) {
        List<String> fields = new ArrayList<>();
        StringBuilder currentField = new StringBuilder();
        boolean inQuotes = false;
        
        for (char c : line.toCharArray()) {
            if (c == '"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                fields.add(currentField.toString());
                currentField = new StringBuilder();
            } else {
                currentField.append(c);
            }
        }
        
        fields.add(currentField.toString());
        return fields.toArray(new String[0]);
    }
}