package com.trustping.service;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.trustping.DTO.DriveLogReceiveDTO;
import com.trustping.entity.DriveLog;
import com.trustping.entity.Segment;
import com.trustping.entity.UserData;
import com.trustping.repository.DriveLogRepository;
import com.trustping.repository.SegmentRepository;

@Service
public class DriveLogStorageService {

	@Autowired
	private DriveLogRepository driveLogRepository;

	@Autowired
	private DriveLogService driveLogService;

	@Autowired
	private UserDataHelperService userDataHelperService;

	/*
	// 정상 주행 데이터 삭제
	@Scheduled(fixedRate = 10000)
	public void deleteOldNormalLogs() {
		LocalDateTime targetTime = LocalDateTime.now().minusMinutes(5);
		driveLogService.deleteOldNormalLogs(targetTime);
	}
	*/

	// 주행 로그 저장
	public void saveData(DriveLogReceiveDTO driveLogReceiveDTO) {
        Optional<UserData> userDataOpt = userDataHelperService.getUserDataByCarId(driveLogReceiveDTO.getCarId());

        if (userDataOpt.isEmpty()) {
            return;
        }

        UserData userData = userDataOpt.get();
        DriveLog driveLog = mapToDriveLog(driveLogReceiveDTO, userData);

        driveLogRepository.save(driveLog);
    }
	
    // DriveLog 객체 생성 유틸 메서드
    private DriveLog mapToDriveLog(DriveLogReceiveDTO dto, UserData userData) {
        DriveLog driveLog = new DriveLog();
        driveLog.setCarId(userData);
        driveLog.setAclPedal(dto.getAclPedal());
        driveLog.setBrkPedal(dto.getBrkPedal());
        driveLog.setSpeed(dto.getSpeed());
        driveLog.setRpm(dto.getRpm());
        driveLog.setSpeedChange(dto.getSpeedChange());
        driveLog.setCreateDate(dto.getCreateDate());
        driveLog.setDriveState(dto.getDriveState());
        return driveLog;
    }
}
