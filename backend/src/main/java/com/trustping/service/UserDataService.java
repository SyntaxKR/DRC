package com.trustping.service;

import org.springframework.security.core.userdetails.UserDetails;

import com.trustping.DTO.LoginRequestDTO;
import com.trustping.DTO.LoginResponseDTO;
import com.trustping.DTO.MfaRequestDTO;
import com.trustping.DTO.MfaResponseDTO;
import com.trustping.DTO.MyDataResponseDTO;
import com.trustping.DTO.OtpResponseDTO;
import com.trustping.DTO.PasswordDTO;
import com.trustping.DTO.ResponseDTO;
import com.trustping.DTO.SignUpRequestDTO;
import com.trustping.DTO.UpdateBirthDateDTO;
import com.trustping.DTO.UpdateNicknameDTO;
import com.trustping.DTO.UpdateResponseDTO;

public interface UserDataService {
	public boolean duplicateCheckUser(String id);
	public boolean registerUser(SignUpRequestDTO signUpRequestDTO);
	public LoginResponseDTO loginUser(LoginRequestDTO loginRequestDTO);
	public OtpResponseDTO generateGoogleMFA(String jwtToken);
	public MfaResponseDTO verifyGoogleMFA(MfaRequestDTO mfaRequestDTO);
	public UserDetails loadUserByUsername(String username);
	public MyDataResponseDTO getMyDataByToken(String jwtToken);
	public ResponseDTO deleteUser(String jwtToken, PasswordDTO passwordDTO);	
	public UpdateResponseDTO modifyNickname(String jwtToken, UpdateNicknameDTO modifyNicknameDTO);
	public UpdateResponseDTO modifyBirthDate(String jwtToken, UpdateBirthDateDTO updateBirthDateDTO);
	public ResponseDTO verifyPassword(String jwtToken, PasswordDTO passwordDTO);
	public ResponseDTO modifyPassword(String jwtToken, PasswordDTO passwordDTO);
	public String getCarIdById(String id);
	public String getIdByCarId(String carId);
	public ResponseDTO disableMfa(String jwtToken);
	
}