package com.trustping.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.trustping.DTO.DriveLogExcelDTO;
import com.trustping.entity.UserData;

public interface DriveLogService {
	public void deleteOldNormalLogs(LocalDateTime targetDate);
	public List<DriveLogExcelDTO> exportDriveLog(UserData carId, LocalDate date);
}
