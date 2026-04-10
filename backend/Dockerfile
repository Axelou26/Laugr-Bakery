# Build API Spring Boot (Java 17) — utilisé par Render quand le runtime = Docker
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
COPY src src
RUN chmod +x mvnw && ./mvnw -B package -DskipTests

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
RUN useradd -r -u 1001 appuser && mkdir -p /app/data /app/uploads && chown -R appuser:appuser /app
COPY --from=build /app/target/backend-1.0.0.jar app.jar
USER appuser
EXPOSE 8081
# Profil prod = PostgreSQL (Neon) via application-prod.yml ; Render fournit SPRING_DATASOURCE_* .
ENV SPRING_PROFILES_ACTIVE=prod
# Render définit PORT ; application.yml utilise ${PORT:8081}
ENTRYPOINT ["java", "-jar", "app.jar"]
