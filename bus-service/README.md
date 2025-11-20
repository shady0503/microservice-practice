# Bus Service - Spring Boot 3.5.7 Microservice

**Bus Service** is a Spring Boot microservice responsible for managing the bus fleet operations and real-time GPS geolocation in a Service-Oriented Architecture (SOA) public transport system. This service follows the **"database per service"** pattern and integrates with other microservices via **Apache Kafka** event-driven architecture.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
- [Kafka Topics](#kafka-topics)
- [Domain Model](#domain-model)
- [Development](#development)
- [Deployment](#deployment)

## 🚀 Quick Start

### Prerequisites

- **Java 17+**
- **Maven 3.8.9+**
- **PostgreSQL 13+** (or another RDBMS)
- **Apache Kafka 3.0+**
- **Docker** (optional, for containerization)

### Setup & Run

1. **Clone and navigate to the project:**
   ```bash
   cd bus-service
   ```

2. **Configure database and Kafka:**
   Edit `src/main/resources/application.yaml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:postgresql://localhost:5432/bus_db
       username: postgres
       password: postgres
     kafka:
       bootstrap-servers: localhost:9092
   ```

3. **Create the database:**
   ```sql
   CREATE DATABASE bus_db;
   ```

4. **Build the project:**
   ```bash
   ./mvnw clean package -DskipTests
   ```

5. **Run the service:**
   ```bash
   ./mvnw spring-boot:run
   ```

   The service will start on **http://localhost:8080**

6. **Verify health:**
   ```bash
   curl http://localhost:8080/actuator/health
   ```

## 🏗️ Architecture

### Technology Stack

- **Framework**: Spring Boot 3.5.7 (WebFlux + REST)
- **Database**: PostgreSQL with Spring Data JPA
- **Messaging**: Apache Kafka (consumer + producer)
- **Validation**: Jakarta Bean Validation
- **Observability**: Spring Boot Actuator + Micrometer
- **Development**: Lombok, DevTools, Configuration Processor

### Service Responsibilities

1. **Fleet Management**: Create, update, and manage bus entities
2. **Geolocation**: Consume raw GPS coordinates, validate, and store
3. **Event Publishing**: Emit domain events to Kafka topics
4. **REST APIs**: Expose bus data and location queries

### Integration Points

- **API Gateway**: Routes `/api/bus/**` requests to this service
- **GPS Device/Simulator**: Produces `gps.raw.locations` topic
- **Notification Service**: Consumes `bus.status.events` and `bus.delay.events`
- **Route Service**: Consumes `bus.delay.events` and `bus.location.updates`

## 📁 Project Structure

```
src/
├── main/
│   ├── java/com/soa/busservice/
│   │   ├── BusServiceApplication.java          # Spring Boot entry point
│   │   ├── config/
│   │   │   ├── KafkaConfig.java               # Kafka consumer/producer config
│   │   │   └── ActuatorConfig.java            # Actuator and metrics config
│   │   ├── controller/
│   │   │   └── BusController.java             # REST endpoints
│   │   ├── service/
│   │   │   └── BusService.java                # Business logic
│   │   ├── repository/
│   │   │   ├── BusRepository.java
│   │   │   └── BusLocationHistoryRepository.java
│   │   ├── model/
│   │   │   ├── Bus.java                       # JPA entity
│   │   │   ├── BusLocationHistory.java        # JPA entity
│   │   │   └── BusStatus.java                 # Enum
│   │   ├── dto/
│   │   │   ├── BusDto.java
│   │   │   ├── BusLocationDto.java
│   │   │   ├── CreateBusDto.java
│   │   │   └── kafka/
│   │   │       ├── GpsRawLocationEvent.java
│   │   │       ├── BusLocationUpdateEvent.java
│   │   │       ├── BusStatusEvent.java
│   │   │       └── BusDelayEvent.java
│   │   ├── kafka/
│   │   │   └── GpsLocationConsumer.java       # Kafka consumer
│   │   └── exception/
│   │       ├── ErrorResponse.java
│   │       └── GlobalExceptionHandler.java
│   └── resources/
│       └── application.yaml                   # Configuration
└── test/
    ├── java/com/soa/busservice/
    │   ├── BusServiceApplicationTests.java
    │   ├── repository/BusRepositoryTest.java
    │   └── service/BusServiceTest.java
    └── resources/
        └── application-test.yaml
```

## ⚙️ Configuration

### application.yaml

Key properties:

```yaml
spring:
  application:
    name: bus-service
  datasource:
    url: jdbc:postgresql://localhost:5432/bus_db
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update  # 'validate' in production
  kafka:
    bootstrap-servers: localhost:9092
    consumer:
      group-id: bus-service-group
      auto-offset-reset: earliest
    producer:
      acks: all

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,info
  endpoint:
    health:
      show-details: always
```

### Environment Variables

Override properties with environment variables:

```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://prod-db:5432/bus_db
export SPRING_DATASOURCE_USERNAME=busservice
export SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka-broker:9092
java -jar bus-service-0.0.1-SNAPSHOT.jar
```

## 🔌 API Endpoints

### Bus Management

#### Create a Bus
```http
POST /buses
Content-Type: application/json

{
  "matricule": "BUS001",
  "capacity": 50,
  "status": "EN_SERVICE"
}

# Response: 201 Created
{
  "busId": "550e8400-e29b-41d4-a716-446655440000",
  "matricule": "BUS001",
  "capacity": 50,
  "status": "EN_SERVICE",
  "currentRouteId": null,
  "lastLatitude": null,
  "lastLongitude": null,
  "lastPositionTime": null,
  "createdAt": "2025-11-15T19:00:00",
  "updatedAt": "2025-11-15T19:00:00"
}
```

#### Get All Buses
```http
GET /buses
GET /buses?status=EN_SERVICE
GET /buses?routeId=ROUTE001
GET /buses?active=true

# Response: 200 OK
[{
  "busId": "...",
  "matricule": "BUS001",
  "capacity": 50,
  ...
}]
```

#### Get Bus by ID
```http
GET /buses/{busId}

# Response: 200 OK
{
  "busId": "550e8400-e29b-41d4-a716-446655440000",
  ...
}
```

#### Update Bus
```http
PUT /buses/{busId}
Content-Type: application/json

{
  "matricule": "BUS001",
  "capacity": 60,
  "status": "EN_MAINTENANCE"
}

# Response: 200 OK
```

#### Assign Bus to Route
```http
POST /buses/{busId}/assign-route/{routeId}

# Response: 200 OK
```

#### Delete Bus
```http
DELETE /buses/{busId}

# Response: 204 No Content
```

### Geolocation Endpoints

#### Get Last Known Location
```http
GET /buses/{busId}/location

# Response: 200 OK
{
  "busId": "550e8400-e29b-41d4-a716-446655440000",
  "matricule": "BUS001",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "speed": 45.5,
  "timestamp": "2025-11-15T19:05:30"
}
```

#### Get All Active Bus Locations
```http
GET /buses/locations

# Response: 200 OK
[{
  "busId": "...",
  "matricule": "BUS001",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "speed": 45.5,
  "timestamp": "2025-11-15T19:05:30"
}, ...]
```

#### Get Location History
```http
GET /buses/{busId}/locations/history?from=2025-11-15T00:00:00&to=2025-11-15T23:59:59

# Response: 200 OK
[{
  "locationId": "...",
  "busId": "...",
  "timestamp": "2025-11-15T19:05:30",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "speed": 45.5,
  "createdAt": "2025-11-15T19:05:31"
}, ...]
```

## 📡 Kafka Topics

### Inbound Topics

#### `gps.raw.locations` (Consumer)

Raw GPS coordinates from GPS devices/simulators.

**Message Format:**
```json
{
  "busId": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "speed": 45.5,
  "timestamp": "2025-11-15T19:05:30"
}
```

**Validation Rules:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Speed: >= 0
- Timestamp: not older than 60 minutes

**Error Handling:** Invalid messages are logged and acknowledged (not retried).

### Outbound Topics

#### `bus.location.updates` (Producer)

Enriched location data sent when a bus position updates.

**Message Format:**
```json
{
  "busId": "550e8400-e29b-41d4-a716-446655440000",
  "routeId": "ROUTE001",
  "latitude": 33.5731,
  "longitude": -7.5898,
  "timestamp": "2025-11-15T19:05:30",
  "delayInMinutes": 5
}
```

#### `bus.status.events` (Producer)

Emitted when a bus status changes.

**Message Format:**
```json
{
  "busId": "550e8400-e29b-41d4-a716-446655440000",
  "oldStatus": "EN_SERVICE",
  "newStatus": "EN_MAINTENANCE",
  "timestamp": "2025-11-15T19:05:30"
}
```

#### `bus.delay.events` (Producer)

Emitted when a bus is detected to be running late (future enhancement).

**Message Format:**
```json
{
  "busId": "550e8400-e29b-41d4-a716-446655440000",
  "routeId": "ROUTE001",
  "scheduledTime": "2025-11-15T19:00:00",
  "estimatedTime": "2025-11-15T19:05:00",
  "delayInMinutes": 5
}
```

## 🗂️ Domain Model

### Bus Entity

Represents a vehicle in the fleet with operational status and current assignment.

**Fields:**
- `busId` (UUID) - Primary key
- `matricule` (String, unique) - Registration number
- `capacity` (Integer) - Seating capacity
- `status` (BusStatus) - EN_SERVICE, HORS_SERVICE, EN_MAINTENANCE
- `currentRouteId` (String) - Assigned route (nullable)
- `lastLatitude` (Double) - Last known position
- `lastLongitude` (Double) - Last known position
- `lastPositionTime` (LocalDateTime) - Timestamp of last update
- `createdAt` (LocalDateTime) - Creation timestamp
- `updatedAt` (LocalDateTime) - Last update timestamp

**Status Transitions:**
```
EN_SERVICE <---> HORS_SERVICE
    ↕
EN_MAINTENANCE
```

### BusLocationHistory Entity

Persists GPS position records for historical tracking and analysis.

**Fields:**
- `locationId` (UUID) - Primary key
- `busId` (UUID) - Foreign key to Bus
- `timestamp` (LocalDateTime) - GPS timestamp
- `latitude` (Double) - GPS coordinate
- `longitude` (Double) - GPS coordinate
- `speed` (Double) - Speed in km/h
- `createdAt` (LocalDateTime) - Record creation time

## 🛠️ Development

### Running Tests

```bash
# Unit tests only
./mvnw test -Dtest=BusServiceTest

# Integration tests
./mvnw test -Dtest=BusRepositoryTest

# All tests
./mvnw test
```

### Building

```bash
# Build without tests
./mvnw clean package -DskipTests

# Build with tests
./mvnw clean package
```

### Monitoring

**Health Check:**
```bash
curl http://localhost:8080/actuator/health
```

**Metrics:**
```bash
curl http://localhost:8080/actuator/metrics
```

**Application Info:**
```bash
curl http://localhost:8080/actuator/info
```

## 📦 Deployment

### Docker

Build and run in a container:

```bash
# Build Docker image
docker build -t bus-service:latest .

# Run container
docker run -d \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/bus_db \
  -e SPRING_KAFKA_BOOTSTRAP_SERVERS=kafka:9092 \
  -p 8080:8080 \
  bus-service:latest
```

### Kubernetes

Deploy using Helm or kubectl:

```bash
kubectl apply -f k8s/bus-service-deployment.yaml
kubectl apply -f k8s/bus-service-service.yaml
```

### Production Checklist

- [ ] Set `spring.jpa.hibernate.ddl-auto` to `validate`
- [ ] Configure PostgreSQL for production (backups, replication)
- [ ] Set up Kafka broker cluster with replication
- [ ] Enable Spring Security for authentication
- [ ] Configure HTTPS/TLS
- [ ] Set up monitoring and alerting (Prometheus, Grafana)
- [ ] Configure centralized logging (ELK stack, CloudWatch)
- [ ] Enable API rate limiting and authentication
- [ ] Set up distributed tracing (Jaeger, Zipkin)

## 🤝 Contributing

Follow the patterns and conventions documented in the code:

1. Use Lombok for entity/DTO boilerplate
2. Separate entity and DTO classes
3. Use service layer for business logic
4. Publish Kafka events on state changes
5. Add logging at appropriate levels
6. Write tests for new features

## 📝 License

This project is part of the ENSIAS 3A SOA course (2025-2026).

---

**Last Updated**: November 15, 2025  
**Version**: 0.0.1-SNAPSHOT  
**Spring Boot**: 3.5.7  
**Java**: 17
