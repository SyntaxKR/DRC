package com.trustping.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.trustping.DTO.BothPedalDTO;
import com.trustping.DTO.SAclDTO;
import com.trustping.DTO.SBrkDTO;
import com.trustping.entity.AbnormalData;
import com.trustping.entity.UserData;

@Repository
public interface AbnormalDataRepository extends JpaRepository<AbnormalData, Long> {
	
	@Query("SELECT new com.trustping.DTO.SAclDTO(a.sAcl) FROM AbnormalData a WHERE a.userData.userId = :userId AND a.date = :date")
	Optional<SAclDTO> findSAclByUserData_UserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);
	
	@Query("SELECT new com.trustping.DTO.SBrkDTO(a.sBrk) FROM AbnormalData a WHERE a.userData.userId = :userId AND a.date = :date")
	Optional<SBrkDTO> findSBrkByUserData_UserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);

	@Query("SELECT new com.trustping.DTO.BothPedalDTO(a.bothPedal) FROM AbnormalData a WHERE a.userData.userId = :userId AND a.date = :date")
	Optional<BothPedalDTO> findBothPedalByUserData_UserIdAndDate(@Param("userId") String userId, @Param("date") LocalDate date);

    Optional<AbnormalData> findByUserData_UserIdAndDate(String userId, LocalDate date);
    
    List<AbnormalData> findByUserData_UserIdAndDateBetween(String userId, LocalDate startDate, LocalDate endDate);
}
