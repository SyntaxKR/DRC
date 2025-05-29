package com.trustping.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trustping.entity.UserData;

@Repository
public interface UserDataRepository extends JpaRepository<UserData, String> {
    
	boolean existsByUserId(String userId);  
    
    Optional<UserData> findByUserIdAndPw(String userId, String pw);
    
    Optional<UserData> findByCarId(String carId);
}
