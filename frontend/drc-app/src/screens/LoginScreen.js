import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Alert, Image } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { loginUser, checkTokenValidity, checkOTP } from '../api/authAPI';
import { useTwoFA } from '../context/TwoFAprovider.js'; // 2차 인증 필요 상태 Context import
import AsyncStorage from '@react-native-async-storage/async-storage';
import Modal from 'react-native-modal';

const LoginScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const { setIs2FAEnabled } = useTwoFA(); // 2차 인증 상태 설정 함수 가져오기
  const [otp, setOtp] = useState(Array(6).fill('')); // 6자리 OTP 입력 상태
  const [is2FARequired, setIs2FARequired] = useState(false); // 2차 인증 필요 여부
  const otpRefs = useRef(Array(6).fill(null)); // 6자리 OTP 입력 필드에 대한 ref 배열
  const [isModalVisible, setModalVisible] = useState(false);

  // 화면이 포커스를 받을 때 입력 필드 초기화
  useFocusEffect(
    React.useCallback(() => {
      setEmail('');
      setPassword('');
      setErrorMessage('');
    }, [])
  );

  // 앱 재접속 시 JWT 유효성 검사 후 자동 로그인 처리
  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        // 토큰이 없을 경우
        if (!token) {
          console.log("토큰이 없습니다. 로그인 화면으로 이동합니다.");
          navigation.navigate("LoginScreen");
          return;
        }

        // 토큰이 있을 경우 유효성 검사
        const response = await checkTokenValidity(token);
        if (response.valid) { // valid 값을 체크
          console.log("토큰이 유효합니다. 메인 화면으로 이동합니다.");
          navigation.navigate("MainScreen");
        } else {
          console.log("토큰이 유효하지 않습니다. 로그인 화면으로 이동합니다.");
          navigation.navigate("LoginScreen");
        }
      } catch (error) {
        console.error("자동 로그인 중 오류:", error);
        Alert.alert("오류", "자동 로그인 중 문제가 발생했습니다.");
        navigation.navigate("LoginScreen");
      }
    };

    checkAutoLogin();
  }, []);


  // 로그인 처리 핸들러
  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage("아이디(이메일)와 비밀번호를 입력해 주세요.");
      return;
    }

    try {
      const response = await loginUser(email, password);

      if (response.loginStatus === 1) {
        // 2차 인증이 필요한 경우
        setIs2FARequired(true);
        setModalVisible(true);
        Alert.alert("2차 인증 필요", "OTP 코드를 입력하세요.");
      } else if (response.token) {
          // 2차 인증 비활성 경우 그냥 로그인 처리
          console.log('로그인 성공');
          setEmail('');
          setPassword('');
          setErrorMessage('');
          // JWT 토큰이 반환된 경우
          await AsyncStorage.setItem('token', response.token);
          await AsyncStorage.setItem('is2FAEnabled', 'false'); // 2차 인증 비활성 상태 저장
          navigation.navigate("MainScreen", { screen: 'MainScreen' }); // 메인화면 이동
        } else if (response.loginStatus === 0) {
          // 로그인 실패 시 반환된 메시지를 오류 메시지로 설정
          setErrorMessage('로그인 실패: ' + response.message);
        }
    } catch (error) {
      // 서버 오류 처리
      if (error.response) {
        const errorResponse = error.response.data;
        // 로그인 실패 시 서버 반환 메시지 오류 메시지로 설정
        if (errorResponse && errorResponse.loginStatus !== undefined) {
          setErrorMessage(`로그인 실패: ${errorResponse.message}`);
        } else {
          setErrorMessage('로그인 처리 중 예기치 못한 오류가 발생했습니다.');
        }
      } else {
        // 네트워크 오류 또는 기타 예외 처리
        setErrorMessage('로그인 처리 중 오류가 발생했습니다.');
      }
      console.error('로그인 오류:', error);
    }
  };

  const handleOTPChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.replace(/[^0-9]/g, ''); // 숫자만 허용
    setOtp(newOtp);

    // 다음 입력 필드로 포커스 이동
    if (text && index < 5) {
      otpRefs.current[index + 1].focus(); // ref를 사용하여 포커스 이동
    }
  };

  // OTP 검증 핸들러
  const handleOTPVerification = async () => {
    const otpCode = otp.join(''); // 6자리 OTP 코드 결합
    try {
        const isVerified = await checkOTP(email, otpCode);
        if (isVerified) {
            setModalVisible(false);
            Alert.alert("OTP 확인 성공", "메인 화면으로 이동합니다.");
            // OTP 검증 후 받은 토큰을 AsyncStorage에 저장
            const response = await checkOTP(email, otpCode);
            console.log("(LoginScreen.js 2차인증 반환 데이터: ", response);
            if (response) {
                navigation.navigate("MainScreen", {screen: 'MainScreen'}); // 메인 화면으로 이동
            } else {
                Alert.alert("오류", "토큰을 받을 수 없습니다.");
            }
        } else {
            Alert.alert("OTP 확인 실패", "OTP 코드를 다시 확인하세요.");
        }
    } catch (error) {
        console.error("OTP 인증 실패:", error);
        Alert.alert("오류 발생", "OTP 인증 중 문제가 발생했습니다.");
    }
};

const handleOTPFocus = (index) => {
  const newOtp = [...otp];
  newOtp[index] = ''; // Focused input reset
  setOtp(newOtp);
};


return (
  <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoView}>
          <Image source={require('../../assets/drcsplash.png')} style={styles.logo} />
        </View>
        <View style={styles.LoginView}>
            <TextInput
              style={styles.TextInput}
              onChangeText={setEmail}
              value={email}
              placeholder="아이디"
              placeholderTextColor="#D9D9D9"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={styles.TextInput}
              onChangeText={setPassword}
              value={password}
              placeholder="비밀번호"
              placeholderTextColor="#D9D9D9"
              secureTextEntry={true}
            />

            {errorMessage ? (
              <Text style={styles.ErrorMessage}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity style={styles.LoginBtn} onPress={handleLogin}>
              <Text style={styles.BtnText}>로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 20 }}
              onPress={() => navigation.navigate("SignUpScreen", { screen: 'SignUpScreen' })}
            >
              <Text style={styles.SignUpText}>회원가입 하러가기</Text>
            </TouchableOpacity>
            </View>
          </ScrollView>
          

          <Modal isVisible={isModalVisible}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>2차 인증</Text>
          <Text style={styles.otpText}>OTP 입력 (6자리)</Text>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => (otpRefs.current[index] = el)}
                style={styles.otpInput}
                onChangeText={(text) => handleOTPChange(text, index)}
                value={digit}
                maxLength={1}
                keyboardType="numeric"
                onFocus={() => handleOTPFocus(index)} // Reset on focus
              />
            ))}
          </View>
          <TouchableOpacity style={styles.modalBtn} onPress={handleOTPVerification}>
            <Text style={styles.btnText}>OTP 확인</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.closeModalText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoView:{
    justifyContent: 'center',  // 세로 중앙 정렬
    alignItems: 'center',      // 가로 중앙 정렬
    opacity: 0.8,
  },
  logo: {
    width: 150,                 // 로고 너비
    height: 150,                // 로고 높이
    marginTop: "35%",    
    marginBottom:-55,       // 수직 위치 조정
    resizeMode: 'contain',      // 로고 크기를 너비와 높이에 맞게 조정
  },
  text:{
    color: '#2F4F4F',
    marginTop:17,
    marginBottom:-10,
    marginLeft:-14,
  },
  LoginView: {
    flex: 1,
    padding: 20,
    margin: 35,
    marginBottom: "40%",
    justifyContent: 'center',
    borderRadius: 6,
  },
  scrollContent: {
    flexGrow: 1, // 스크롤뷰 내용이 밀릴 수 있도록 설정
    justifyContent: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  LogoText: {
    fontSize: 30,
    marginTop: "30%",
    textAlign: "center",
  },
  TextInput: {
    marginTop: 8,
    paddingHorizontal: 10,
    height: 45,
    borderRadius: 6,
    borderColor: '#009688',
    borderWidth: 1,
    width: '110%',  // 너비를 90%로 설정 (부모 컨테이너의 90%)
    alignSelf: 'center', // 중앙 정렬
  },
  LoginBtn: {
    margin: 10,
    marginTop:20,
    backgroundColor: "#009688",
    padding: 10,
    width: "110%",
    alignSelf: "center",
    borderRadius: 10
  },
  BtnText: {
    fontWeight: 'bold',
    fontSize:16,
    textAlign: 'center',
    color: 'white',
    paddingTop:7,
    height:30
  },
  SignUpText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#009688',
    marginTop:-10,
  },
  ErrorMessage: {
    color: 'red', 
    marginBottom: 10,
    textAlign: 'center', 
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#009688', // 청록색 적용
  },
  otpText: {
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#009688', // 청록색 적용
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 40,
    height: 40,
    borderColor: '#009688', // 청록색 적용
    borderWidth: 1,
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 18,
    marginRight: 10, // 필드 간격 조정
  },
  btnText: {
    color: '#fff',
    },
  modalBtn: {
    backgroundColor: '#009688', // 청록색 적용
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10, // 버튼과 닫기 버튼 간격 조정
  },
  closeModalButton: {
    backgroundColor: '#D9D9D9', // 닫기 버튼 배경색
    padding: 10,
    borderRadius: 5,
    width: '100%',
  },
  closeModalText: {
    textAlign: 'center',
    color: '#000', // 닫기 버튼 텍스트 색상
  },
});

