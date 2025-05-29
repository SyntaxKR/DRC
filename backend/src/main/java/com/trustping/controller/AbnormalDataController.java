package com.trustping.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.trustping.DTO.BothPedalDTO;
import com.trustping.DTO.SAclDTO;
import com.trustping.DTO.SBrkDTO;
import com.trustping.DTO.WeeklyBothPedalDTO;
import com.trustping.DTO.WeeklySAclDTO;
import com.trustping.DTO.WeeklySBrkDTO;
import com.trustping.service.AbnormalDataService;
import com.trustping.utils.JwtUtil;

@RestController
@RequestMapping("/api/abnormal")
public class AbnormalDataController {
	
	@Autowired
	private AbnormalDataService abnormalDataService;
	
	@Autowired
	private JwtUtil jwtUtil;
	
	// 급가속 하루 단위 조회
	@GetMapping("/sacl")
	public ResponseEntity<SAclDTO> getSacl(@RequestHeader("Authorization") String token, @RequestParam("date") LocalDate date) {
	    String jwtToken = token.substring(7);
	    String userId = jwtUtil.extractUsername(jwtToken);
	    SAclDTO result = abnormalDataService.getSAclByUserIdAndDate(userId, date);
	    System.out.println(result);
	    return ResponseEntity.ok(result);
	}

	
	// 급정거 하루 단위 조회
	@GetMapping("/sbrk")
	public ResponseEntity<SBrkDTO> getSbrk(@RequestHeader("Authorization") String token, @RequestParam("date") LocalDate date) {
	    String jwtToken = token.substring(7);
	    String userId = jwtUtil.extractUsername(jwtToken);
	    SBrkDTO result = abnormalDataService.getSBrkByUserIdAndDate(userId, date);
	    if (result == null) {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); 
	    }
	    return ResponseEntity.ok(result);
	}
	
	// 양발 운전 하루 단위 조회
	@GetMapping("/bothPedal")
	public ResponseEntity<BothPedalDTO> getBothPedal(@RequestHeader("Authorization") String token, @RequestParam("date") LocalDate date) {
	    String jwtToken = token.substring(7);
	    String userId = jwtUtil.extractUsername(jwtToken);
	    BothPedalDTO result = abnormalDataService.getBothPedalByUserIdAndDate(userId, date);
	    if (result == null) {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null); 
	    }
	    return ResponseEntity.ok(result);
	}
	
	// 날짜 두 개 정해서 그 사이 급가속 조회
	@GetMapping("weeklySAcl")
	public ResponseEntity<List<WeeklySAclDTO>> getWeeklySAcl(@RequestHeader("Authorization") String token, @RequestParam("startDate") LocalDate startDate, @RequestParam("endDate") LocalDate endDate) {
	    String jwtToken = token.substring(7); // "Bearer " 부분 제거
	    String id = jwtUtil.extractUsername(jwtToken); // 사용자 ID 추출
	    
		List<WeeklySAclDTO> result = abnormalDataService.getWeeklySAcl(id, startDate, endDate);
		if (result == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
		}
		return ResponseEntity.ok(result);
	}
	
	// 날짜 두 개 정해서 그 사이 급정거 조회
	@GetMapping("weeklySBrk")
	public ResponseEntity<List<WeeklySBrkDTO>> getWeeklySBrk(@RequestHeader("Authorization") String token, @RequestParam("startDate") LocalDate startDate, @RequestParam("endDate") LocalDate endDate) {
		String jwtToken = token.substring(7); // "Bearer " 부분 제거
		String id = jwtUtil.extractUsername(jwtToken); // 사용자 ID 추출
		List<WeeklySBrkDTO> result = abnormalDataService.getWeeklySBrk(id, startDate, endDate);
		if (result == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
		}
		return ResponseEntity.ok(result);
	}
	
	// 날짜 두 개 정해서 그 사이 양발 운전 조회
	@GetMapping("weeklyBothPedal")
	public ResponseEntity<List<WeeklyBothPedalDTO>> getWeeklyBothPeal(@RequestHeader("Authorization") String token, @RequestParam("startDate") LocalDate startDate, @RequestParam("endDate") LocalDate endDate) {
		String jwtToken = token.substring(7); // "Bearer " 부분 제거
		String id = jwtUtil.extractUsername(jwtToken); // 사용자 ID 추출
		List<WeeklyBothPedalDTO> result = abnormalDataService.getWeeklyBothPedal(id, startDate, endDate);
		if (result == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
		}
		return ResponseEntity.ok(result);
	}
}
