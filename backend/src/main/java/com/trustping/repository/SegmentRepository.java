package com.trustping.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import com.trustping.entity.Segment;

public interface SegmentRepository extends JpaRepository<Segment, Long> {
	Optional<Segment> findTopByCarId_CarIdOrderByStartTimeDesc(String carId);
	
	List<Segment> findTop6ByCarId_CarIdOrderByStartTimeDesc(String carId);
	
	List<Segment> findByCarId_CarId(String carId);
	
}
