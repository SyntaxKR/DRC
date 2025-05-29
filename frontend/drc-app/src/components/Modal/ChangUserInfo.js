import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Button,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { formatDate } from "../../utils/formatDate";
import { changeNickname, changeBirthDate, fetchUserInfo } from "../../api/userInfoAPI";
import { changePassword } from "../../api/accountAPI";
import DropDownPicker from 'react-native-dropdown-picker';
import { enableTwoFactorAuth, disableTwoFactorAuth } from '../../api/authAPI';
import { useTwoFA } from '../../context/TwoFAprovider'; // 2FA Context
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../Mode/ThemeContext';
import * as Clipboard from 'expo-clipboard'; // 클립보드 작업 라이브러리
import TwoFactorAuthModal from "./TwoFactorAuthModal";

const ChangUserInfo = ({ visible, onClose, onUserInfoUpdated }) => {
  const [userInfo, setUserInfo] = useState({
    id: "",
    nickname: "",
    birthDate: "",
    carId: "",
  });
  const [newNickname, setNewNickname] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newBirthDate, setNewBirthDate] = useState(new Date("1990-01-01"));
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [isSaveEnabled, setIsSaveEnabled] = useState(false);
  const { isDarkMode, setIsDarkMode } = useTheme();
  
  // 2차 인증 관련 상태
  const { is2FAEnabled, setIs2FAEnabled } = useTwoFA();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: '비활성', value: false },
    { label: '활성', value: true },
  ]);
  const [qrUrl, setQrUrl] = useState(null);
  const [otpKey, setOtpKey] = useState(null);
  const [isModalVisible, setModalVisible] = useState(false);

  // 드롭다운이 열려 있는지 확인
  const isDropDownOpen = open;

  const modalHeight = isDropDownOpen ? 580 : 480; // 드롭다운이 열릴 때 모달 크게 조정

  // 2차 인증 드롭다운 기본값 로컬 저장소에서 가져오기
  useEffect(() => {
    const loadTwoFASetting = async () => {
        const storedStatus = await AsyncStorage.getItem('is2FAEnabled');
        const status = storedStatus === 'true';
        setIs2FAEnabled(status);
        setOpen(false);
    };

    loadTwoFASetting();
  }, []);

  // 2차 인증 활성화/비활성 상태 변경 핸들러
  const handle2FAChange = async (value) => {
    if (value) {
        console.log("2차인증 활성");
        const { qrUrl, otpKey } = await enableTwoFactorAuth();
        setQrUrl(qrUrl);
        setOtpKey(otpKey);
        setModalVisible(true);
        Alert.alert("OTP 인증 정보가 생성되었습니다.", "QR 코드를 스캔하거나 설정 key를 사용하여 OTP 코드를 생성하세요.");
    } else {
        console.log("2차인증 비활성");
        try {
            const response = await disableTwoFactorAuth();
            setQrUrl(null);
            setOtpKey(null);

            if (response.success) {
                Alert.alert("성공", response.message);
                onClose(); // 2차 인증 비활성화 후 모달 닫기
            }
        } catch (error) {
            console.error("2차 인증 비활성화 오류:", error);
            Alert.alert("오류", "2차 인증 비활성화 중 문제가 발생했습니다.");
        }
    }
    setIs2FAEnabled(value);
    console.log("2차인증 전역상태 업데이트: ", value);
  };

  // 드롭다운에서 선택된 값에 따라 상태 업데이트
  useEffect(() => {
    if (is2FAEnabled) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [is2FAEnabled]);

  // 2차인증 모달 닫기 함수
  const closeModal = () => {
    setModalVisible(false);
  };

  const handleCopyOtpKey = () => {
    if (otpKey) {
      Clipboard.setString(otpKey); // otpKey 클립보드에 복사
      Alert.alert("복사 완료", "OTP 키가 클립보드에 복사되었습니다.");
    } else {
      Alert.alert("오류", "OTP 키가 없습니다.");
    }
  }; 

  useEffect(() => {
    if (visible) {
      const loadUserInfo = async () => {
        try {
          const data = await fetchUserInfo(); // 사용자 정보 가져오기
          setUserInfo({
            id: data.id,
            nickname: data.nickname,
            birthDate: data.birthDate,
            carId: data.carId,
          });
          setNewNickname(data.nickname);
          setNewBirthDate(new Date(data.birthDate));
        } catch (error) {
          Alert.alert("오류", "사용자 정보를 불러오는 중 문제가 발생했습니다.");
        }
      };
      loadUserInfo();
    }
  }, [visible]);

  useEffect(() => {
    setPasswordMatch(newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    const hasChanges =
      newNickname !== userInfo.nickname ||
      formatDate(newBirthDate) !== userInfo.birthDate ||
      (newPassword && passwordMatch); // 비밀번호 확인이 일치할 때만 포함
    setIsSaveEnabled(hasChanges);
  }, [newNickname, newBirthDate, newPassword, passwordMatch]); // passwordMatch를 의존성 배열에 추가

  const handleSave = async () => {
    try {
      if (!isSaveEnabled) return;

      if (newNickname !== userInfo.nickname) {
        const response = await changeNickname(newNickname);
        if (response.success) {
          Alert.alert("성공", "닉네임이 변경되었습니다.");
        } else {
          throw new Error("닉네임 변경 실패");
        }
      }

      if (newPassword) {
        const response = await changePassword(newPassword);
        if (response.success) {
          Alert.alert("성공", "비밀번호가 변경되었습니다.");
        } else {
          throw new Error("비밀번호 변경 실패");
        }
      }

      if (formatDate(newBirthDate) !== userInfo.birthDate) {
        const response = await changeBirthDate(formatDate(newBirthDate));
        if (response.success) {
          Alert.alert("성공", "생년월일이 변경되었습니다.");
        } else {
          throw new Error("생년월일 변경 실패");
        }
      }

      // 부모 컴포넌트에 정보 업데이트 알림
      if (onUserInfoUpdated) {
        onUserInfoUpdated();
      }

      onClose();
    } catch (error) {
      Alert.alert("오류", "정보를 저장하는 중 문제가 발생했습니다.");
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <View style={[styles.modal, { height: modalHeight }]}>
          <FlatList
            contentContainerStyle={[styles.scrollView, { flexGrow: 1 }]}
            data={[]}
            ListHeaderComponent={
              <>
                <Text style={styles.title}>개인정보 변경</Text>
  
                {/* 사용자 ID */}
                <View style={styles.inputRow}>
                  <Text style={styles.label}>ID</Text>
                  <Text>{userInfo.id}</Text>
                </View>
  
                {/* 닉네임 변경 */}
                <View style={styles.inputRow}>
                  <Text style={styles.label}>닉네임</Text>
                  <TextInput
                    style={styles.input}
                    value={newNickname}
                    onChangeText={setNewNickname}
                  />
                </View>
  
                {/* 비밀번호 변경 */}
                <View style={styles.inputRow}>
                  <Text style={styles.label}>새 비밀번호</Text>
                  <TextInput
                    style={styles.input}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                    placeholder="새 비밀번호 입력"
                  />
                </View>
  
                <View style={styles.inputRow}>
                  <Text style={styles.label}>새 비밀번호 확인</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="비밀번호 확인"
                  />
                </View>
  
                {!passwordMatch && (
                  <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
                )}
  
                {/* 생년월일 변경 */}
                <View style={styles.inputRow}>
                  <Text style={{ fontWeight: "bold", marginRight: -12, color: "#2F4F4F", width: 100 }}>
                    생년월일
                  </Text>
                  <DateTimePicker
                    value={newBirthDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      if (date) {
                        setNewBirthDate(date);
                      }
                    }}
                  />
                </View>
  
                {/* 차량번호 표시 */}
                <View style={styles.inputRow}>
                  <Text style={styles.label}>차량번호</Text>
                  <Text>{userInfo.carId}</Text>
                </View>
  
                {/* 2차 인증 설정 */}
                <View style={styles.inputRow}>
                  <Text style={styles.label}>2차 인증</Text>
                  <View style={{ flex: 1 }}>
                    <DropDownPicker
                      open={open}
                      value={is2FAEnabled}
                      items={items} 
                      setOpen={setOpen} 
                      setValue={setIs2FAEnabled} 
                      setItems={setItems} 
                      onChangeValue={(value) => {
                        handle2FAChange(value);
                        setOpen(false); // 선택 후 드롭다운 닫기
                      }} 
                      style={[styles.dropdown, { marginTop: 5, backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff', zIndex: 10 }]} // 드롭다운이 다른 요소 위에 표시되도록 zIndex 설정
                      dropDownContainerStyle={[styles.dropdownContainer, { zIndex: 10 }]} // 드롭다운 컨테이너에도 zIndex 적용
                      labelStyle={{ color: isDarkMode ? '#ffffff' : '#009688', fontSize: 18 }} 
                      textStyle={{ color: isDarkMode ? '#ffffff' : '#009688', fontSize: 18 }} 
                    />
                  </View>
                </View>
              </>
            }
          />

          <View style={[styles.buttonContainer, { zIndex: 20 }]}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.buttonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, !isSaveEnabled && styles.disabledButton]}
              disabled={!isSaveEnabled}
            >
              <Text style={styles.buttonText}>저장</Text>
            </TouchableOpacity>
          </View>

          {/* 2차 인증 정보 모달 */}
          <TwoFactorAuthModal
            isVisible={isModalVisible}
            onClose={closeModal}
            otpKey={otpKey}
            handleCopyOtpKey={handleCopyOtpKey}
            qrUrl={qrUrl}
            isDarkMode={isDarkMode}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );  
};
  

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modal: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
  },
  scrollView: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#009688",
  },
  label: {
    fontWeight: "bold",
    marginRight: 10,
    color: "#2F4F4F",
    width: 100,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#009688",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#f9f9f9",
  },
  datePicker: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#009688",
    borderRadius: 5,
    padding: 10,
  },
  errorText: {
    color: "red",
    marginBottom: 10,
    marginLeft: 110,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#2F4F4F",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  saveButton: {
    backgroundColor: "#009688",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: "lightgray",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
  },
  dropdown: {
    marginVertical: 10,
    borderColor: '#009688',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  dropdownContainer: {
    borderColor: '#009688',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#009688',
  },
  otpKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  otpKey: {
    fontSize: 16,
    marginVertical: 10,
    color: '#555',
    padding: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
});

export default ChangUserInfo;
