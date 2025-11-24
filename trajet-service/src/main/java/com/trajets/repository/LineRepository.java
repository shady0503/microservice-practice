// src/main/java/com/trajets/repository/LineRepository.java
package com.trajets.repository;

import com.trajets.model.Line;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LineRepository extends JpaRepository<Line, Long> {
    Optional<Line> findByRef(String ref);
    boolean existsByRef(String ref);
}