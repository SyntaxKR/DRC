package com.trustping.service;

import java.util.Optional;
import com.trustping.utils.ChaosEncryptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.trustping.DTO.DriveLogReceiveDTO;
import com.trustping.entity.DriveLog;
import com.trustping.entity.UserData;
import com.trustping.repository.DriveLogRepository;

@Service
public class DriveLogStorageService {

    @Autowired
    private DriveLogRepository driveLogRepository;

    @Autowired
    private DriveLogService driveLogService;

    @Autowired
    private UserDataHelperService userDataHelperService;

    @Autowired
    private ChaosEncryptor chaosEncryptor;

    public void saveData(DriveLogReceiveDTO driveLogReceiveDTO) {
        Optional<UserData> userDataOpt = userDataHelperService.getUserDataByCarId(driveLogReceiveDTO.getCarId());
        if (userDataOpt.isEmpty()) return;

        UserData userData = userDataOpt.get();
        DriveLog driveLog = mapToDriveLog(driveLogReceiveDTO, userData);
        driveLogRepository.save(driveLog);
    }

    private DriveLog mapToDriveLog(DriveLogReceiveDTO dto, UserData userData) {
        double[] chaos = chaosEncryptor.generateChaoticSequence(4);

        DriveLog driveLog = new DriveLog();
        driveLog.setCarId(userData);
        driveLog.setAclPedal(chaosEncryptor.decrypt(dto.getAclPedal(), chaos[0]));
        driveLog.setBrkPedal(chaosEncryptor.decrypt(dto.getBrkPedal(), chaos[1]));
        driveLog.setSpeed(chaosEncryptor.decrypt(dto.getSpeed(), chaos[2]));
        driveLog.setRpm(chaosEncryptor.decrypt(dto.getRpm(), chaos[3]));
        driveLog.setSpeedChange(dto.getSpeedChange());
        driveLog.setCreateDate(dto.getCreateDate());
        driveLog.setDriveState(dto.getDriveState());
        return driveLog;
    }
}
