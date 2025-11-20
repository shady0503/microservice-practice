# Multi-stage build for Bus Service
FROM eclipse-temurin:17-jdk as builder

WORKDIR /app

# Copy pom.xml first for dependency caching
COPY pom.xml ./

# Install Maven
RUN apt-get update && \
    apt-get install -y maven && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Download dependencies (this layer will be cached if pom.xml doesn't change)
RUN mvn dependency:resolve dependency:resolve-plugins -B

# Copy source code
COPY src ./src

# Build application (dependencies already cached)
RUN mvn clean package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Copy JAR from builder
COPY --from=builder /app/target/*.jar bus-service.jar

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run application
ENTRYPOINT ["java", "-jar", "bus-service.jar"]
