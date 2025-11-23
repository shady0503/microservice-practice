FROM maven:3.8.8-eclipse-temurin-17 AS builder
WORKDIR /app

# copy maven files first for caching
COPY pom.xml mvnw ./
COPY .mvn .mvn
# download dependencies (cache)
RUN mvn -B -DskipTests dependency:go-offline

# copy sources and build
COPY src ./src
RUN mvn -B -DskipTests package

# ---------- Runtime ----------
FROM eclipse-temurin:17-jre-jammy
ARG JAR_FILE=/app/target/*.jar
COPY --from=builder /app/target/*.jar /app/app.jar

EXPOSE 8080
ENV JAVA_OPTS=""

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /app/app.jar"]
