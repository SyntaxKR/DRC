package com.trustping.service;

import java.time.LocalDate;
import java.util.List;

import com.trustping.DTO.BothPedalDTO;
import com.trustping.DTO.SAclDTO;
import com.trustping.DTO.SBrkDTO;
import com.trustping.DTO.WeeklyBothPedalDTO;
import com.trustping.DTO.WeeklySAclDTO;
import com.trustping.DTO.WeeklySBrkDTO;

public interface AbnormalDataService {
	
	public SAclDTO getSAclByUserIdAndDate(String userIdid, LocalDate date);
	
	public SBrkDTO getSBrkByUserIdAndDate(String userId, LocalDate date);
	
	public BothPedalDTO getBothPedalByUserIdAndDate(String userIdid, LocalDate date);
	
	public List<WeeklySAclDTO> getWeeklySAcl(String id, LocalDate startDate, LocalDate endDate);

	public List<WeeklySBrkDTO> getWeeklySBrk(String id, LocalDate startDate, LocalDate endDate);

	public List<WeeklyBothPedalDTO> getWeeklyBothPedal(String id, LocalDate startDate, LocalDate endDate);
}
