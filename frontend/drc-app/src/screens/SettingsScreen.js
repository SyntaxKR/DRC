import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, Button, Alert } from 'react-native';
import { useTheme } from '../components/Mode/ThemeContext.js'; // 다크 모드 Context import
import { MaterialIcons } from '@expo/vector-icons';
import LogoutModal from '../components/Modal/LogoutModal.js';
import AccountDeletionModal from '../components/Modal/AccountDeletionModal.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation(); // 네비게이션 가져오기
  const { isDarkMode, setIsDarkMode } = useTheme(); // 다크 모드 상태 가져오기
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const closeModal = () => {
    setLogoutModalVisible(false);
    setDeleteModalVisible(false);
  };

  const toggleSwitch = () => {
    setIsDarkMode(previousState => !previousState); // 다크 모드 상태를 토글
  };

  const handleLogout = async () => {
    try {
      // AsyncStorage에서 토큰 삭제
      await AsyncStorage.removeItem('token'); 
      console.log('로그아웃 처리 완료');
      Alert.alert("로그아웃", "정상적으로 로그아웃되었습니다."); // 로그아웃 완료 메시지
      navigation.navigate('LoginScreen'); // 로그인 화면으로 리디렉션
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      Alert.alert("오류", "로그아웃 중 문제가 발생했습니다.");
    } finally {
      setLogoutModalVisible(false); // 로그아웃 모달 닫기
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }]}>
      <View style={[styles.section, { marginTop: 35 }]}>
        <MaterialIcons name="settings" size={24} color={isDarkMode ? '#ffffff' : '#009688'} /> 
        <Text style={[styles.label, styles.labelSpacing, { color: isDarkMode ? '#ffffff' : '#2F4F4F' }]}>앱 설정</Text>
      </View>

      <View style={styles.darkModeContainer}>
        <Text style={{ fontSize: 18, color: isDarkMode ? '#ffffff' : '#ffffff' }}>다크모드</Text>
        <Switch 
          value={isDarkMode}
          onValueChange={toggleSwitch}
          trackColor={{ false: '#767577', true: '#000000' }} 
        />
      </View>

      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <View style={styles.buttonContainer}>
          <Button 
            title="로그아웃" 
            color="gray" 
            onPress={() => setLogoutModalVisible(true)} 
          />
          <Button 
            title="회원탈퇴" 
            color="gray" 
            onPress={() => setDeleteModalVisible(true)} 
          />
        </View>
      </View>

      <LogoutModal 
        visible={logoutModalVisible} 
        onClose={() => setLogoutModalVisible(false)} 
        onConfirm={handleLogout}
      />
      <AccountDeletionModal 
        visible={deleteModalVisible} 
        onClose={closeModal} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  labelSpacing: {
    marginLeft: 10,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10, // 섹션 간 간격 통일
  },
  label: {
    fontSize: 24,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  darkModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 20,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#009688', // 기본색 청록
  },
  buttonContainer: {
    justifyContent: 'center',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default SettingsScreen;
