package com.trustping.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.trustping.DTO.BothPedalDTO;
import com.trustping.DTO.SAclDTO;
import com.trustping.DTO.SBrkDTO;
import com.trustping.DTO.WeeklyBothPedalDTO;
import com.trustping.DTO.WeeklySAclDTO;
import com.trustping.DTO.WeeklySBrkDTO;
import com.trustping.entity.AbnormalData;
import com.trustping.repository.AbnormalDataRepository;
import com.trustping.repository.UserDataRepository;
import com.trustping.utils.JwtUtil;

@Service
public class AbnormalDataServiceImpl implements AbnormalDataService{	
	
	@Autowired
	private AbnormalDataRepository abnormalDataRepository;
	
	@Autowired 
	private UserDataService userDataService;
	
	@Autowired
	private UserDataRepository userDataRepository;
	
	@Autowired
	private JwtUtil jwtUtil;
	
	// 하루 단위 급가속 조회
	@Override
	public SAclDTO getSAclByUserIdAndDate(String userId, LocalDate date) {
	    Optional<SAclDTO> result = abnormalDataRepository.findSAclByUserData_UserIdAndDate(userId, date);
	    if (result.isEmpty()) {
	        return null;
	    }
        return result.get();
	}

	// 하루 단위 급정거 조회
	@Override
	public SBrkDTO getSBrkByUserIdAndDate(String userId, LocalDate date) {
	    Optional<SBrkDTO> result = abnormalDataRepository.findSBrkByUserData_UserIdAndDate(userId, date);
	    if (result.isEmpty()) {
	        return null;
	    }
        return result.get();
	}
	
	// 하루 단위 양발 운전 조회
	@Override
	public BothPedalDTO getBothPedalByUserIdAndDate(String userId, LocalDate date) {
	    Optional<BothPedalDTO> result = abnormalDataRepository.findBothPedalByUserData_UserIdAndDate(userId, date);
	    if (result.isEmpty()) {
	        return null;
	    }
        return result.get();
	}
	
	// 2주 단위 급가속 조회
	@Override
	public List<WeeklySAclDTO> getWeeklySAcl(String id, LocalDate startDate, LocalDate endDate) {
	        List<AbnormalData> weeklyData = abnormalDataRepository.findByUserData_UserIdAndDateBetween(id, startDate, endDate);

	        // 데이터 리스트를 DTO로 변환
	        List<WeeklySAclDTO> weeklySAcl = weeklyData.stream()
	                .map(sAclLog -> new WeeklySAclDTO(
	                        sAclLog.getDate(),
	                        sAclLog.getSAcl()))
	                .collect(Collectors.toList());

	        // 변환된 DTO 리스트 반환
	        return weeklySAcl;
	}

	
	// 2주 단위 급정거 조회
	@Override
	public List<WeeklySBrkDTO> getWeeklySBrk(String id, LocalDate startDate, LocalDate endDate){
		List<AbnormalData> weeklyData = abnormalDataRepository.findByUserData_UserIdAndDateBetween(id, startDate, endDate);

        // 데이터 리스트를 DTO로 변환
        List<WeeklySBrkDTO> weeklySBrk = weeklyData.stream()
                .map(sBrkLog -> new WeeklySBrkDTO(
                        sBrkLog.getDate(),
                        sBrkLog.getSBrk()))
                .collect(Collectors.toList());

        // 변환된 DTO 리스트 반환
        return weeklySBrk;
	}
	
	// 2주 단위 양발 운전
	@Override
	public List<WeeklyBothPedalDTO> getWeeklyBothPedal(String id, LocalDate startDate, LocalDate endDate){
		List<AbnormalData> weeklyData = abnormalDataRepository.findByUserData_UserIdAndDateBetween(id, startDate, endDate);

        // 데이터 리스트를 DTO로 변환
        List<WeeklyBothPedalDTO> weeklyBothPedal = weeklyData.stream()
                .map(BothPedalLog -> new WeeklyBothPedalDTO(
                        BothPedalLog.getDate(),
                        BothPedalLog.getBothPedal()))
                .collect(Collectors.toList());

        // 변환된 DTO 리스트 반환
        return weeklyBothPedal;
	}
	
}
