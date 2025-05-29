package com.trustping.service;

import java.util.Optional;

import com.trustping.entity.UserData;

public interface UserDataHelperService {
    Optional<UserData> getUserDataByCarId(String carId);
    Optional<UserData> getUserDataById(String id);
}
