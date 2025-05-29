// 비밀번호 인증 모달
import React, { useState } from 'react';
import { TextInput, Text, StyleSheet, TouchableOpacity, View, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { verifyPassword } from '../../api/accountAPI';

const PWCheckModal = ({ visible, onClose, onConfirm }) => {
  const [currentPassword, setCurrentPassword] = useState(''); // 현재 비밀번호
  const [isVerified, setIsVerified] = useState(false); // 비밀번호 인증 상태
  const [verificationMessage, setVerificationMessage] = useState(''); 

  // 비밀번호 인증 함수
  const checkPassword = async () => {
    console.log("비밀번호 인증 버튼 클릭");

    try {
      // 비밀번호 인증 API 호출
      const success = await verifyPassword(currentPassword);
      
      if (success) {
        setIsVerified(true); // 인증 상태 성공으로 설정
        setVerificationMessage("인증되었습니다.");
        onConfirm(); // 인증 성공 시 부모 컴포넌트에 알림
      } else {
        setIsVerified(false);
        setVerificationMessage("비밀번호가 일치하지 않습니다.");
      }
    } catch (error) {
      setIsVerified(false);
      
      if (error.response && error.response.status === 401) {
        setVerificationMessage("비밀번호가 일치하지 않습니다."); // 401 오류에 대한 메시지
      } else {
        setVerificationMessage("비밀번호 인증 중 오류가 발생했습니다."); // 일반 오류 메시지
      }
      
      console.error('비밀번호 인증 오류:', error);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setIsVerified(false);
    setVerificationMessage('');
    onClose(); // 부모 컴포넌트의 모달 닫기 함수 호출
  };

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>비밀번호 인증</Text>
          <TextInput
            style={styles.input}
            placeholder="현재 비밀번호"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TouchableOpacity onPress={checkPassword} style={styles.checkButton}>
            <Text style={styles.checkButtonText}>인증</Text>
          </TouchableOpacity>
          {verificationMessage ? (
            <Text style={[styles.verificationText, isVerified ? styles.success : styles.error]}>
              {verificationMessage}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 반투명 배경
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#009688',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 16,
    width: '100%',
  },
  checkButton: {
    backgroundColor: '#009688',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    width: '100%',
  },
  checkButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verificationText: {
    marginBottom: 10,
    fontWeight: 'bold',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
});

export default PWCheckModal;
