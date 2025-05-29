import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Image } from "react-native"; 
import { useNavigation, useFocusEffect } from "@react-navigation/native"; 
import { SignUpUser, checkID } from "../api/authAPI"; 
import DateTimePicker from '@react-native-community/datetimepicker'; 
import Icon from 'react-native-vector-icons/FontAwesome';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';

const SignUpScreen = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthDate, setBirthDate] = useState(new Date()); // 초기값 Date 객체로 설정
  const [isDuplicateID, setIsDuplicateID] = useState(false); // ID 중복 여부
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // 비밀번호 보이기 상태
  const [isIDChecked, setIsIDChecked] = useState(false); // ID 중복 확인 버튼 클릭 여부
  const [showPicker, setShowPicker] = useState(false); // 날짜 선택기 표시 여부

  // 에러 메시지 상태 관리
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');// 전체 폼 오류 메시지 (필수 항목 누락 등)

  // 화면이 포커스를 받을 때 입력 필드 초기화
  useFocusEffect(
    React.useCallback(() => {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setCarNumber('');
      setNickname('');
      setBirthDate(new Date());
      setIsDuplicateID(false);
      setIsIDChecked(false);
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');
      setFormError('');

      return () => {
        // Cleanup function (optional)
      };
    }, [])
  );

  // ID 유효성 검사 정규식
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  // 비밀번호 유효성 검사 정규식 (최소 8자, 하나 이상의 숫자, 대소문자 및 특수 문자 포함)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  const handleCheckDuplicate = async () => {
    try {
      const isDuplicate = await checkID(email);
      setIsIDChecked(true); // 중복 확인 버튼이 클릭되었음을 표시
      setIsDuplicateID(isDuplicate); // 중복 여부 상태 업데이트
      setEmailError(isDuplicateID);

      if (isDuplicate) {
        setEmailError("중복된 ID입니다.");
      } else {
        setEmailError("중복되지 않은 ID입니다."); // (수정) 나중에 초록색으로 출력
      }
    } catch (error) {
      setEmailError('ID 중복 확인 오류');
      console.error(error);
    }
  };

  // 비밀번호 일치 여부 즉시 확인
  const handleConfirmPassword = (text) => {
    setConfirmPassword(text);
    if (text !== password) {
      setConfirmPasswordError("비밀번호가 일치하지 않습니다.");
    } else {
      setConfirmPasswordError('');
    }
  };

  // 회원가입 버튼 핸들러
  const handleSignUp = async () => {
    console.log("차량번호", carNumber);

    if (!email || !password || !confirmPassword || !carNumber || !nickname || !birthDate) {
      setFormError("모든 항목을 입력해 주세요.");
      return;
    }

    // 유효성 검사
    let hasError = false; // 에러 상태 플러그
    if (!emailRegex.test(email)) {
      setEmailError("유효한 이메일 주소를 입력하세요.");
      hasError = true; // 에러 발생
    } else {
      setEmailError('');
    }
    if (!passwordRegex.test(password)) {
      setPasswordError("비밀번호는 8자 이상, 하나 이상의 숫자, 대소문자, 특수 문자를 포함해야 합니다.");
      hasError = true;
    } else {
      setPasswordError('');
    }

    // 비밀번호 재확인
    if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      hasError = true;
    } else {
      setConfirmPasswordError('');
    }

    // ID 중복 확인 여부 체크
    if (!isIDChecked) {
      setEmailError("ID 중복 확인을 해주세요.");  // 중복 확인을 클릭하지 않은 경우 메시지 표시
      return;
    }

    // ID 중복된 경우 회원가입 불가
    if (isDuplicateID) {
      setEmailError("중복된 ID입니다. 다른 ID를 입력하세요.");  // 중복된 ID일 경우 메시지 표시
      return;
    }

    // 에러가 있으면 회원가입 처리 중단
    if (hasError) {
      return;
    }
    console.log(email);
    
    // birthDate를 YYYY-MM-DD 형식으로 변환
    const formattedBirthDate = birthDate.toISOString().split('T')[0];
    console.log(formattedBirthDate);

    try {
      // 서버로 회원가입 데이터 전송 후 응답 대기
      const response = await SignUpUser(email, password, nickname, formattedBirthDate, carNumber);
      console.log(response.success);

      if (response.success) {
        console.log('회원가입 성공');
        setEmailError('');
        setPasswordError('');
        setFormError('');
        setConfirmPasswordError('');
        // 로그인 화면 이동
        navigation.navigate("LoginScreen", { screen: 'LoginScreen' });
      } else {
        console.log(response.message);
        if(response.success === false) {
          // 서버에서 받은 실패 메시지를 formError에 저장
          setFormError(response.message);
        } else setFormError('회원가입에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (error) {
      // 오류 발생시 에러 메시지 출력
      setFormError('회원가입 처리 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  // 날짜 선택기 핸들러
  const onChange = (event, selectedDate) => {
    const birthDate = selectedDate || birthDate;  // 선택된 날짜 또는 기존 날짜
    setShowPicker(false);
    setBirthDate(birthDate);  // 생년월일 정보 업데이트
  };

  const openDatePicker = () => {
    setShowPicker(true);
  };

  const formattedBirthDate = birthDate.toISOString().split('T')[0]; // 날짜를 YYYY-MM-DD 형식으로 변환
  

  return (
    <View style={Styles.container}>     
      <View style={Styles.logoView}>
        <Image source={require('../../assets/drcsplash.png')} style={Styles.logo} />
      </View> 
      
      <View style = {Styles.RegisterView}>
        <KeyboardAwareScrollView 
          extraHeight={300} // 키보드가 올라올 때 추가로 화면을 위로 밀어주는 높이
          enableOnAndroid={true}  // 안드로이드에서 키보드가 올라올 때 화면이 자동으로 스크롤
          enableAutomaticScroll={Platform.OS === 'ios'} // iOS에서는 자동으로 스크롤이 활성화
          contentContainerStyle={{ height: -30 }}  // ScrollView 내의 콘텐츠 높이를 -30으로 설정하여 약간의 여백을 주는 효과
          resetScrollToCoords={{ x: 0, y: 0 }}  // 키보드가 닫힐 때 스크롤 위치를 (0, 0)으로 초기화
          scrollEnabled={true}  // 스크롤을 활성화
        >

          {/* 필드들이 RegisterView 밖으로 벗어나지 않도록 하고, 벗어날 경우 스크롤 */}
          <ScrollView contentContainerStyle={Styles.scrollContent}>
            <View style={Styles.formContainer}>
              <Text style={Styles.text}>아이디 (이메일)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                <TextInput 
                  style={[Styles.TextInput, {flex: 1}]} 
                  onChangeText={setEmail}
                  placeholder="아이디 (이메일)"
                  placeholderTextColor="#D9D9D9"
                  value={email}
                />
                <TouchableOpacity
                  style={Styles.CheckDuplicateBtn}
                  onPress={handleCheckDuplicate}>
                  <Text style={Styles.BtnText}>중복확인</Text>
                </TouchableOpacity>
              </View>

              {/* ID 중복 에러 메시지 */}
              {emailError ? <Text style={Styles.error}>{emailError}</Text> : null}
              

              <Text style={Styles.text}>비밀번호</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  style={[Styles.TextInput, {flex: 1}]} 
                  onChangeText={setPassword}
                  placeholder="비밀번호"
                  placeholderTextColor="#D9D9D9"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={{ marginLeft: 10 }}>
                  <Icon name={isPasswordVisible ? "eye" : "eye-slash"} size={20} color="#000" />
                </TouchableOpacity>
              </View>
              

              {/* 비밀번호 오류 메시지 */}
              {passwordError ? <Text style={Styles.error}>{passwordError}</Text> : null}
            
              {/* 비밀번호 확인 입력칸 */}
              <Text style={Styles.text}>비밀번호 확인</Text>
              <TextInput 
                style={Styles.TextInput} 
                onChangeText={handleConfirmPassword}
                placeholder="비밀번호 확인"
                placeholderTextColor="#D9D9D9"
                secureTextEntry={true}
                value={confirmPassword}
              />

              {/* 비밀번호 일치 여부 에러 메시지 */}
              {confirmPasswordError ? <Text style={Styles.error}>{confirmPasswordError}</Text> : null}

              <Text style={Styles.text}>차량번호</Text>
              <TextInput
                style={Styles.TextInput}
                onChangeText={setCarNumber}
                placeholder="차량번호"
                placeholderTextColor="#D9D9D9"
                value={carNumber}
              />

              <Text style={Styles.text}>닉네임</Text>
              <TextInput 
                style={Styles.TextInput} 
                onChangeText={setNickname}
                placeholder="닉네임"
                placeholderTextColor="#D9D9D9"
                value={nickname}
              />

              <Text style={Styles.text}>생년월일</Text>
              {Platform.OS === 'android' && (
                <TouchableOpacity onPress={openDatePicker}>
                  <View style={Styles.birthDateContainer}>
                    <Text style={Styles.dateText}>{formattedBirthDate}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {Platform.OS === 'ios' ? (
                <View style={Styles.iosBirthDateContainer}>
                  <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display="default"
                    onChange={onChange}
                  />
                </View>
              ):(
                showPicker && (
                  <DateTimePicker
                      value={birthDate}
                      mode="date"
                      display="default"
                      onChange={onChange}
                    />
                  )
              )}

              {/* 폼 오류 메시지(필수 항목 누락 등) */}
              {formError ? <Text style={Styles.error}>{formError}</Text> : null}

              {/* 회원가입 버튼 클릭 동작 */}
              <TouchableOpacity 
                style={Styles.SignUpBtn}
                onPress={handleSignUp}>
                <Text style={Styles.BtnText}>회원가입 완료</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={{marginTop: 20}}
                onPress={() => navigation.navigate("LoginScreen", { screen: 'LoginScreen' })}>
                <Text style={Styles.LoginText}>로그인 화면으로</Text>
              </TouchableOpacity>
              </View>
            </ScrollView>
        </KeyboardAwareScrollView>
      </View>
    </View>
  );
}


export default SignUpScreen;

const Styles = StyleSheet.create({
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
    width: 130,                 // 로고 너비
    height: 130,                // 로고 높이
    marginTop: "17%",           // 수직 위치 조정
    resizeMode: 'contain',      // 로고 크기를 너비와 높이에 맞게 조정
  },
  text:{
    color: '#2F4F4F'
  },
  RegisterView:{
    height: "63%",
    padding:20,
    margin: 35,
    marginTop:20,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#009688',
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
    marginTop:30,
    textAlign: "center",
  },
  TextInput: {
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
    height: 35,
    borderRadius: 6,
    borderColor: '#009688',
    borderWidth: 1
  },
  SignUpBtn: {
    margin: 10,
    backgroundColor: "#009688",
    padding: 10,
    width: "100%",
    alignSelf: "center",
    borderRadius: 10
  },
  BtnText:{
    fontWeight: 'bold',
    textAlign: 'center',
    color:'white',
  },
  LoginText: {
    fontSize: 14,
    textAlign: 'center',
    color:'#009688',
    marginBottom: 15
  },
  CheckDuplicateBtn: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: '#009688',
    borderRadius: 5,
  },
  error: {
    color: 'red',
    marginTop: -5,
    marginBottom: 10,
  },
  birthDateContainer: {
    padding: 5,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 7,
    backgroundColor: '#d5e3e2',
    marginRight: '55%'
  },
  dateText: {
    fontSize: 16,
    color: '#2F4F4F',
  },
  iosBirthDateContainer: {
    flexDirection: 'row', 
    alignItems: 'center',   
    marginBottom: 10,       
    marginTop: 10,
    marginLeft: -10
  },
})

