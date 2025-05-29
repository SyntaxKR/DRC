package com.trustping.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.trustping.DTO.DriveScoreDTO;
import com.trustping.service.DriveScoreService;
import com.trustping.utils.JwtUtil;

@RestController
@RequestMapping("/api/score")
public class DriveScoreController {
	
	@Autowired
	private DriveScoreService driveScoreService;
	
	@Autowired
	private JwtUtil jwtUtil;
	
	// 점수 확인
	@GetMapping("/checkScore")
	public ResponseEntity<DriveScoreDTO> checkScore(@RequestHeader("Authorization") String token){
		String jwtToken = token.substring(7);
	    String userId = jwtUtil.extractUsername(jwtToken);
		DriveScoreDTO result = driveScoreService.getDriveScoreByUserId(userId);
		return ResponseEntity.ok(result);
	}
}
