package com.trustping.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Segment {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long segmentId;
	private LocalDateTime startTime;
	private LocalDateTime endTime;
	private int totalDuration;  // 누적 주행 시간 (초 단위)
	private int averageScore;   // 구간의 평균 점수
	@ManyToOne(cascade = CascadeType.REMOVE)
	@JoinColumn(name = "car_id", referencedColumnName = "carId")
	private UserData carId;
}
