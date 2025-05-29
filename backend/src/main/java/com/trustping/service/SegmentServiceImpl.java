package com.trustping.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.trustping.DTO.DriveLogReceiveDTO;
import com.trustping.DTO.DriveTimeDTO;
import com.trustping.entity.Segment;
import com.trustping.entity.UserData;
import com.trustping.repository.SegmentRepository;
import com.trustping.utils.JwtUtil;

@Service
public class SegmentServiceImpl implements SegmentService {

	@Autowired
	private SegmentRepository segmentRepository;

	@Autowired
    private UserDataHelperService userDataHelperService; // 헬퍼 사용

	@Autowired
	private DriveScoreService driveScoreService;

	@Autowired
	private JwtUtil jwtUtil;
	
	// 세그먼트 생성 및 업데이트
	@Override
	public void updateOrCreateSegment(DriveLogReceiveDTO dto) {
		// 가장 최근의 세그먼트 불러오기
		Optional<Segment> currentSegmentOpt = segmentRepository
				.findTopByCarId_CarIdOrderByStartTimeDesc(dto.getCarId());
		// 차량 번호로 사용자 정보 불러오기
		Optional<UserData> userDataOpt = userDataHelperService.getUserDataByCarId(dto.getCarId());

		if (userDataOpt.isEmpty()) {
			return;
		}
		
		UserData userData = userDataOpt.get();

		// 세그먼트가 없거나 현재 세그먼트 1개당 시간(36000초 == 10시간)일 경우 새로운 세그먼트 생성
		if (currentSegmentOpt.isEmpty() || currentSegmentOpt.get().getTotalDuration() >= 36000) {
			Segment newSegment = new Segment();
			newSegment.setCarId(userData);
			newSegment.setStartTime(dto.getCreateDate());
			newSegment.setTotalDuration(0); 
			// 감점을 위해 첫 점수는 100점으로 시작
			newSegment.setAverageScore(100);
			// 이전 세그먼트가 존재할 경우, endTime을 설정하고 저장하고 세그먼트 종료
			currentSegmentOpt.ifPresent(currentSegment -> {
				currentSegment.setEndTime(dto.getCreateDate());
				// 이전 세그먼트 저장
				segmentRepository.save(currentSegment);
			});
			// 새로운 세그먼트 저장
			segmentRepository.save(newSegment); 
			return;
		}

		// currentSegment가 null이 아니고, totalDuration이 18000 미만일 경우 세그먼트 정보 불러오기
		Segment currentSegment = currentSegmentOpt.get();
		// 세그먼트의 주행시간 +1초 추가
		currentSegment.setTotalDuration(currentSegment.getTotalDuration() + 1);
		// currentSegment 저장
		segmentRepository.save(currentSegment); 
	}

	// 세그먼트 점수 감점
	@Override
	public void updateSegmentScore(String carId) {
		Optional<Segment> currentSegmentOpt = segmentRepository.findTopByCarId_CarIdOrderByStartTimeDesc(carId);

		if (currentSegmentOpt.isEmpty()) {
			return;
		}

		Segment currentSegment = currentSegmentOpt.get();
		int existingScore = currentSegment.getAverageScore();
		UserData userData = currentSegment.getCarId();
		
		// 비정상 주행 시 -3점 감점
		int updatedAverageScore = existingScore -3;
		currentSegment.setAverageScore(updatedAverageScore);
		segmentRepository.save(currentSegment);
		driveScoreService.updateDriveScore(userData);
	}
	
	@Override
	public DriveTimeDTO getDriveTime(String carId) {
		List<Segment> allSegments = segmentRepository.findByCarId_CarId(carId);
		
		int totalDriveTime = 0;
		
		for (Segment segment : allSegments) {
            totalDriveTime += segment.getTotalDuration();
        }
		
		return new DriveTimeDTO(totalDriveTime);
	}
}
