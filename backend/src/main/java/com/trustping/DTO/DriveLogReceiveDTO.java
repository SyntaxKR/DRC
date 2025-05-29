package com.trustping.DTO;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriveLogReceiveDTO {
    private int aclPedal;
	private int brkPedal;
	private int speed;
	private int rpm;
	private double speedChange;
	private LocalDateTime createDate;
	private String driveState;
	private String carId;
}
