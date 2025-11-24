// src/main/java/com/trajets/config/ImportConfig.java
package com.trajets.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class ImportConfig {
    
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}