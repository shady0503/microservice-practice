package com.soa.busservice.config;

import org.springframework.boot.actuate.autoconfigure.metrics.MeterRegistryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.micrometer.core.instrument.MeterRegistry;

/**
 * Configuration for Spring Boot Actuator and Micrometer metrics.
 * Enables health checks and application metrics monitoring.
 */
@Configuration
public class ActuatorConfig {
    
    /**
     * Customize the meter registry with application tags.
     */
    @Bean
    public MeterRegistryCustomizer<MeterRegistry> metricsCommonTags() {
        return registry -> registry.config()
                .commonTags(
                        "application", "bus-service",
                        "environment", "development"
                );
    }
}
