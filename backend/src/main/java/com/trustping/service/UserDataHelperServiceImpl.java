package com.trustping.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.trustping.entity.UserData;
import com.trustping.repository.UserDataRepository;

@Service
public class UserDataHelperServiceImpl implements UserDataHelperService {
    @Autowired
    private UserDataRepository userDataRepository;

    @Override
    public Optional<UserData> getUserDataByCarId(String carId) {
        return userDataRepository.findByCarId(carId);
    }

    @Override
    public Optional<UserData> getUserDataById(String id) {
        return userDataRepository.findById(id);
    }
}
