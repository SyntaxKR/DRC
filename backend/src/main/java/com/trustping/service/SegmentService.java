package com.trustping.service;

import com.trustping.DTO.DriveLogReceiveDTO;
import com.trustping.DTO.DriveTimeDTO;

public interface SegmentService {
	public void updateOrCreateSegment(DriveLogReceiveDTO dto);
	public void updateSegmentScore(String carId);
	public DriveTimeDTO getDriveTime(String userId);
}
