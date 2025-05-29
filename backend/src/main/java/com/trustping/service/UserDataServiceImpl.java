package com.trustping.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import com.trustping.entity.UserData;
import com.trustping.repository.UserDataRepository;
import com.trustping.utils.JwtUtil;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import com.warrenstrange.googleauth.GoogleAuthenticatorQRGenerator;

@Service
public class UserDataServiceImpl implements UserDataService {

	@Autowired
	private UserDataRepository userDataRepository;
	
	@Autowired
	private DriveScoreService driveScoreService;
	
	@Autowired
	private JwtUtil jwtUtil;

	private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

	// 아이디 조회
	public boolean duplicateCheckUser(String id) {
		return userDataRepository.existsById(id);
	}

	// 비밀번호 조회
	public Optional<String> getPasswordById(String id) {
		return userDataRepository.findById(id).map(UserData::getPw);
	}

	// otpKey 조회
	public Optional<String> getOtpKeyById(String id) {
		return userDataRepository.findById(id).map(UserData::getOtpKey);
	}

	// id로 차 번호 조회
	@Override
	public String getCarIdById(String id) {
		Optional<UserData> userData = userDataRepository.findById(id);

		// UserData가 존재하는지 확인
		if (userData.isPresent()) {
			String carId = userData.get().getCarId();
			return carId;
		} else {
			return null;
		}
	}

	// 차 번호로 id 조회
	@Override
	public String getIdByCarId(String carId) {
		Optional<UserData> userData = userDataRepository.findByCarId(carId);

		// UserData가 존재하는지 확인
		if (userData.isPresent()) {
			String id = userData.get().getUserId();
			return id;
		} else {
			return null;
		}
	}

	// 비밀번호 확인
	/*
	 * public boolean verifyPassword(String rawPassword, String encodedPassword) {
	 * return passwordEncoder.matches(rawPassword, encodedPassword); }
	 */

	// 회원가입
	@Override
	@Transactional(rollbackFor = Exception.class)
	public boolean registerUser(SignUpRequestDTO request) {
		if (duplicateCheckUser(request.getId())) {
			return false; // 중복된 ID
		}

		String hashedPassword = passwordEncoder.encode(request.getPw());
		UserData userData = new UserData(
				request.getId(), 
				hashedPassword, 
				request.getNickname(), 
				request.getBirthDate(),
				request.getCarId(), 
				null, // OTP 키 초기값
				"ROLE_USER");

		userDataRepository.save(userData);
		driveScoreService.registerDriveScore(userData);
		return true; // 회원가입 성공
	}

	// 로그인
	@Override
	public LoginResponseDTO loginUser(LoginRequestDTO loginRequestDTO) {
		BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
		String id = loginRequestDTO.getId();
		String pw = loginRequestDTO.getPw();

		Optional<UserData> userDataOptional = userDataRepository.findById(id);

		// 값이 없거나 비밀번호가 일치하지 않을 때 처리
		if (userDataOptional.isEmpty() || !passwordEncoder.matches(pw, userDataOptional.get().getPw())) {
			return new LoginResponseDTO(null, 0, "ID나 비밀번호가 잘못되었습니다");
		}

		UserData userData = userDataOptional.get();

		// OTP 키가 존재할 때 처리
		if (userData.getOtpKey() != null) {
			return new LoginResponseDTO(null, 1, "OTP 인증 필요");
		}

		// JWT 토큰 생성
		String jwtToken = jwtUtil.generateToken(userData.getUserId());
		return new LoginResponseDTO(jwtToken, 2, "로그인 성공");
	}

	// 유저 필터 추가
	@Override
	public UserDetails loadUserByUsername(String id) throws UsernameNotFoundException {
		Optional<UserData> userDataOptional = userDataRepository.findById(id);

		UserData userData = userDataOptional
				.orElseThrow(() -> new UsernameNotFoundException("사용자를 찾을 수 없습니다 : " + id));

		// 권한 리스트 생성 및 추가
		List<GrantedAuthority> authorities = new ArrayList<>();
		authorities.add(new SimpleGrantedAuthority(userData.getRole()));

		// UserDetails 객체 반환
		return new org.springframework.security.core.userdetails.User(userData.getUserId(), userData.getPw(), authorities);
	}

	// Google OTP 생성
	@Override
	@Transactional(rollbackFor = Exception.class)
	public OtpResponseDTO generateGoogleMFA(String jwtToken) {
		String id = jwtUtil.extractUsername(jwtToken);

		Optional<UserData> userDataOptional = userDataRepository.findById(id);

		UserData userData = userDataOptional.orElseThrow(() -> new RuntimeException("ID가 존재하지 않습니다 : " + id));

		OtpResponseDTO otpDTO = new OtpResponseDTO();

		try {
			GoogleAuthenticator googleAuthenticator = new GoogleAuthenticator();
			GoogleAuthenticatorKey googleAuthenticatorKey = googleAuthenticator.createCredentials();

			String otpKey = googleAuthenticatorKey.getKey();
			String QRUrl = GoogleAuthenticatorQRGenerator.getOtpAuthURL("DRC", userData.getUserId(),
					googleAuthenticatorKey);

			userData.setOtpKey(otpKey);
			userDataRepository.save(userData);

			otpDTO.setSuccess(true);
			otpDTO.setOtpKey(otpKey);
			otpDTO.setQRUrl(QRUrl);

		} catch (Exception e) {
			otpDTO.setSuccess(false);
			otpDTO.setOtpKey(null);
			otpDTO.setQRUrl(null);
		}

		return otpDTO;
	}

	// Google OTP 인증
	@Override
	public MfaResponseDTO verifyGoogleMFA(MfaRequestDTO mfaRequestDTO) {
		GoogleAuthenticator googleAuthenticator = new GoogleAuthenticator();
		String id = mfaRequestDTO.getId();

		// Optional을 사용하여 OTP 키를 가져옴
		Optional<String> otpKeyOptional = getOtpKeyById(id);

		// OTP 키가 존재하지 않을 경우 처리
		if (otpKeyOptional.isEmpty()) {
			return new MfaResponseDTO(null, false, "존재하지 않는 사용자 ID");
		}

		// OTP 키가 존재하면 인증 진행
		String otpKey = otpKeyOptional.get();
		boolean verify = googleAuthenticator.authorize(otpKey, mfaRequestDTO.getKey());

		if (verify) {

			// JWT 토큰 생성
			String jwtToken = jwtUtil.generateToken(id);
			return new MfaResponseDTO(jwtToken, true, "인증 성공");
		} else {
			return new MfaResponseDTO(null, false, "인증 실패");
		}
	}

	// 닉네임 변경
	@Override
	public UpdateResponseDTO modifyNickname(String jwtToken, UpdateNicknameDTO updateNicknameDTO) {
		String id = jwtUtil.extractUsername(jwtToken);
		String newNickname = updateNicknameDTO.getNickname();
		Optional<UserData> userDataOptional = userDataRepository.findById(id);

		// 사용자가 존재하지 않을 경우 처리
		if (userDataOptional.isEmpty()) {
			return new UpdateResponseDTO(false, "ID가 존재하지 않습니다 : " + id, null);
		}

		UserData userData = userDataOptional.get();
		userData.setNickname(newNickname);
		userDataRepository.save(userData);
		return new UpdateResponseDTO(true, "닉네임이 변경 되었습니다", newNickname);
	}
	
	// 생년월일 변경
	@Override
	public UpdateResponseDTO modifyBirthDate(String jwtToken, UpdateBirthDateDTO updateBirthDateDTO) {
		String id = jwtUtil.extractUsername(jwtToken);
		LocalDate newBirthDate = updateBirthDateDTO.getBirthDate();
		Optional<UserData> userDataOptional = userDataRepository.findById(id);

		// 사용자가 존재하지 않을 경우 처리
		if (userDataOptional.isEmpty()) {
			return new UpdateResponseDTO(false, "ID가 존재하지 않습니다 : " + id, null);
		}

		UserData userData = userDataOptional.get();
		userData.setBirthDate(newBirthDate);
		userDataRepository.save(userData);
	    String changeBirthDate = newBirthDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
		return new UpdateResponseDTO(true, "닉네임이 변경 되었습니다", changeBirthDate);
	}

	// 비밀번호 인증
	@Override
	public ResponseDTO verifyPassword(String jwtToken, PasswordDTO passwordDTO) {
		String userId = jwtUtil.extractUsername(jwtToken);
		String password = passwordDTO.getPw();
		Optional<UserData> userDataOptional = userDataRepository.findById(userId);

		// 사용자가 존재하지 않을 경우 처리
		if (userDataOptional.isEmpty()) {
			return new ResponseDTO(false, "ID가 존재하지 않습니다 : " + userId);
		}

		UserData userData = userDataOptional.get();

		// 비밀번호가 일치하지 않을 경우
		if (!passwordEncoder.matches(password, userData.getPw())) {
			return new ResponseDTO(false, "비밀번호가 일치하지 않습니다");
		}

		return new ResponseDTO(true, "비밀번호가 일치합니다");
	}

	// 비밀번호 변경
	@Override
	public ResponseDTO modifyPassword(String jwtToken, PasswordDTO passwordDTO) {
		String userId = jwtUtil.extractUsername(jwtToken);
		String newPassword = passwordDTO.getPw();
		Optional<UserData> userDataOptional = userDataRepository.findById(userId);

		// 사용자가 존재하지 않을 경우 처리
		if (userDataOptional.isEmpty()) {
			return new ResponseDTO(false, "ID가 존재하지 않습니다 : " + userId);
		}

		UserData userData = userDataOptional.get();

		String newHashedPassword = passwordEncoder.encode(newPassword);

		userData.setPw(newHashedPassword);
		userDataRepository.save(userData);
		return new ResponseDTO(true, "비밀번호가 변경 되었습니다");
	}

	// 마이페이지 데이터 확인
	@Override
	public MyDataResponseDTO getMyDataByToken(String jwtToken) {
		String userId = jwtUtil.extractUsername(jwtToken);
		Optional<UserData> userDataOptional = userDataRepository.findById(userId);
		UserData userData = userDataOptional.orElseThrow(() -> new RuntimeException("ID가 존재하지 않습니다 : " + userId));
		MyDataResponseDTO data = new MyDataResponseDTO(userData.getUserId(), userData.getNickname(),
				userData.getBirthDate(), userData.getCarId());

		return data;
	}

	// 회원 탈퇴
	@Override
	@Transactional(rollbackFor = Exception.class)
	public ResponseDTO deleteUser(String jwtToken, PasswordDTO passwordDTO) {
		String userId = jwtUtil.extractUsername(jwtToken);
		String password = passwordDTO.getPw();
		Optional<UserData> userDataOptional = userDataRepository.findById(userId);

		// 사용자가 존재하지 않을 경우 처리
		if (userDataOptional.isEmpty()) {
			return new ResponseDTO(false, "ID가 존재하지 않습니다 : " + userId);
		}

		UserData userData = userDataOptional.get();

		// 비밀번호가 일치하지 않을 경우
		if (!passwordEncoder.matches(password, userData.getPw())) {
			return new ResponseDTO(false, "비밀번호가 일치하지 않습니다");
		}

		// 사용자 삭제
		userDataRepository.delete(userData);
		return new ResponseDTO(true, "회원 탈퇴 되었습니다");
	}
	
	// 2차 인증 비활성화
	public ResponseDTO disableMfa(String jwtToken) {
		String userId = jwtUtil.extractUsername(jwtToken);
		Optional<UserData> userDataOptional = userDataRepository.findById(userId);

		// 사용자가 존재하지 않을 경우 처리
		if (userDataOptional.isEmpty()) {
			return new ResponseDTO(false, "ID가 존재하지 않습니다 : " + userId);
		}
		
		UserData userData = userDataOptional.get();
		userData.setOtpKey(null);
		userDataRepository.save(userData);
		
		return new ResponseDTO(true, "2차 인증 비활성화 되었습니다");
	}
	

}