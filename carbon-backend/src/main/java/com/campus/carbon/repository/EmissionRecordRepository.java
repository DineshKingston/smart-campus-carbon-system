package com.campus.carbon.repository;

import com.campus.carbon.entity.EmissionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface EmissionRecordRepository extends JpaRepository<EmissionRecord, Integer> {

    List<EmissionRecord> findAllByOrderByMonthDescCreatedAtDesc();

    @Query("SELECT e.month, SUM(e.co2Kg) FROM EmissionRecord e GROUP BY e.month ORDER BY e.month")
    List<Object[]> findMonthlyCo2Totals();

    @Query("SELECT e.category.name, SUM(e.co2Kg) FROM EmissionRecord e GROUP BY e.category.name")
    List<Object[]> findCo2ByCategory();

    @Query("SELECT SUM(e.co2Kg) FROM EmissionRecord e")
    Double findTotalCo2();
}
