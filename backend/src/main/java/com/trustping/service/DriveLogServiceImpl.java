package com.trustping.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trustping.DTO.DriveLogExcelDTO;
import com.trustping.entity.DriveLog;
import com.trustping.entity.UserData;
import com.trustping.repository.DriveLogRepository;

@Service
public class DriveLogServiceImpl implements DriveLogService {

	@Autowired
	private DriveLogRepository driveLogRepository;

	@Transactional(rollbackFor = Exception.class)
	public void deleteOldNormalLogs(LocalDateTime targetDate) {
		driveLogRepository.deleteByDriveStateAndCreateDateBefore("Normal Driving", targetDate);
	}

	@Transactional(readOnly = true)
	public List<DriveLogExcelDTO> exportDriveLog(UserData carId, LocalDate date) {
	    // 특정 날짜의 시작 시간과 종료 시간 생성
	    LocalDateTime startOfDay = date.atStartOfDay(); // 하루의 시작 시간 - 00:00:00
	    LocalDateTime endOfDay = date.atTime(LocalTime.MAX); // 하루의 종료 시간 - 23:59:59999

	    // 해당 범위 데이터 조회
	    List<DriveLog> driveLogs = driveLogRepository.findByCarIdAndCreateDateBetween(carId, startOfDay, endOfDay);

	    // 데이터 리스트를 DTO로 변환
	    List<DriveLogExcelDTO> driveLogExcelDTOs = driveLogs.stream()
	            .map(driveLog -> new DriveLogExcelDTO(
	                    driveLog.getCarId().getCarId(),
	                    driveLog.getAclPedal(),
	                    driveLog.getBrkPedal(),
	                    driveLog.getSpeed(),
	                    driveLog.getRpm(),
	                    driveLog.getCreateDate()))
	            .collect(Collectors.toList());

	    // 변환된 DTO 리스트 반환
	    return driveLogExcelDTOs;
	}


}
