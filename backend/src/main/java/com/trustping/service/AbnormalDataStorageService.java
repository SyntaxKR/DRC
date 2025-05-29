package com.trustping.service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustping.DTO.DriveStateDTO;
import com.trustping.entity.AbnormalData;
import com.trustping.entity.UserData;
import com.trustping.repository.AbnormalDataRepository;

@Service
public class AbnormalDataStorageService {

	@Autowired
	private AbnormalDataRepository abnormalDataRepository;
	
	@Autowired
	private UserDataHelperService userDataHelperService;

	// 비정상 주행 데이터 저장
	public void saveData(String message) {
	    try {
	        ObjectMapper objectMapper = new ObjectMapper();
	        DriveStateDTO driveStateDTO = objectMapper.readValue(message, DriveStateDTO.class);
	        String carId = driveStateDTO.getCarId();
	        Optional<UserData> user = userDataHelperService.getUserDataByCarId(carId);
	        int state = driveStateDTO.getState();
	        LocalDate date = LocalDate.now();

	        if (user.isEmpty()) {
	            // 유저 데이터가 없을 경우 처리 (예: 로그를 남기거나 예외 발생)
	            System.out.println("User not found for carId: " + carId);
	            return;
	        }
	        
	        UserData userData = user.get();

	        // 해당 날짜와 사용자 ID로 데이터 조회
	        Optional<AbnormalData> existingDataOpt = abnormalDataRepository.findByUserData_UserIdAndDate(userData.getUserId(), date);
	        AbnormalData existingData;

	        if (existingDataOpt.isPresent()) {
	            // 기존 데이터가 있을 경우 업데이트
	            existingData = existingDataOpt.get();
	        } else {
	            // 새로운 데이터를 생성
	            existingData = new AbnormalData();
	            existingData.setUserData(userData); // UserData를 직접 설정
	            existingData.setDate(date);
	            existingData.setSAcl(0);
	            existingData.setSBrk(0);
	            existingData.setBothPedal(0);
	        }

	        // 상태에 따라 값 증가
	        updateAbnormalData(existingData, state); 

	        // 데이터 저장
	        abnormalDataRepository.save(existingData); 
	        System.out.println(existingData.getUserData() + " updated: " + existingData);
	    } catch (IOException e) {
	        e.printStackTrace();
	    }
	}


	// 상태에 따른 데이터 업데이트 메서드
	private void updateAbnormalData(AbnormalData data, int state) {
		switch (state) {
		case 1:
			data.setSAcl(data.getSAcl() + 1);
			break;
		case 2:
			data.setSBrk(data.getSBrk() + 1);
			break;
		case 3:
			data.setBothPedal(data.getBothPedal() + 1);
			break;
		default:
			System.out.println("Unknown state: " + state);
			break;
		}
	}
}
