package com.trustping.service;

import com.trustping.DTO.DriveScoreDTO;
import com.trustping.entity.UserData;

public interface DriveScoreService{
	
	public void registerDriveScore(UserData userData);
	
	public DriveScoreDTO getDriveScoreByUserId(String id);
	
	public void updateDriveScore(UserData userData);
}
