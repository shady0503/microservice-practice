package com.soa.busservice;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
		"spring.kafka.bootstrap-servers=localhost:9092",
		"spring.kafka.consumer.group-id=test",
		"spring.kafka.consumer.auto-offset-reset=earliest"
})
@Disabled("Context load test disabled - requires Kafka running during testing")
class BusServiceApplicationTests {

	@Test
	void contextLoads() {
		// Test that the application context loads successfully
	}

}
