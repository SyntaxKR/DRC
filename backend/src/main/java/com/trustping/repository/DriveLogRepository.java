package com.trustping.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.trustping.entity.DriveLog;
import com.trustping.entity.UserData;

@Repository
public interface DriveLogRepository extends JpaRepository<DriveLog, Long> {
    List<DriveLog> findByCarId(UserData carId); 

    void deleteByCarId(UserData carId);

    void deleteByDriveStateAndCreateDateBefore(String driveState, LocalDateTime targetDate);

    List<DriveLog> findByCarIdAndCreateDateBetween(UserData carId, LocalDateTime start, LocalDateTime end);
}
