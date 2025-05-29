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
public class DriveLog {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;
	private int aclPedal;
	private int brkPedal;
	private int speed;
	private int rpm;
	private double speedChange;
	@Column(name = "createDate", columnDefinition = "TIMESTAMP")
	private LocalDateTime createDate;
	private String driveState;
	@ManyToOne
	@JoinColumn(name = "car_id", referencedColumnName = "carId")
	private UserData carId;
}
