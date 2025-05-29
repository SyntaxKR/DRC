import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/FontAwesome';
import Icon1 from 'react-native-vector-icons/Ionicons'; 
import { getSAcl, getSBrk, getSPedal, downDriveInfo, getTotalTimeDrive } from '../api/driveInfoAPI';
import { formatDate } from '../utils/formatDate';
import { formatDrivingTime } from '../utils/formatDrivingTime';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../components/Mode/ThemeContext'; // 다크 모드 Context import
import { fetchUserInfo } from '../api/userInfoAPI';
import PWCheckModal from '../components/Modal/PWCheckModal';
import ChangUserInfo from '../components/Modal/ChangUserInfo';

const MypageScreen = () => {
  const { isDarkMode } = useTheme(); // 다크 모드 상태 가져오기
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [showPicker, setShowPicker] = useState(false); 
  const [nickname, setNickname] = useState('OOO');
  const [email, setEmail] = useState('as*******@*****.com');
  const [sacl, setSacl] = useState(0);
  const [sbrk, setSbrk] = useState(0);
  const [bothPedal, setBothPedal] = useState(0);
  const [totalTimeDrive, setTotalTimeDrive] = useState(0);
  const [isPWCheckModalVisible, setPWCheckModalVisible] = useState(false); // 비밀번호 인증 모달
  const [isUserInfoModalVisible, setUserInfoModalVisible] = useState(false); // 정보 수정 모달

  useFocusEffect(
    React.useCallback(() => {
      const fetchUserData = async () => {
        try {
          const userInfo = await fetchUserInfo();
          setNickname(userInfo.nickname);
          setEmail(userInfo.id);
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
        }
      };

      fetchUserData(); // 화면 포커스 시 사용자 데이터 가져오기

      // 클린업 함수 (필요할 경우)
      return () => {
        // 정리 작업이 필요하다면 여기에 작성
      };
    }, [])
  );

  const fetchTotalTimeDrive = async () => {     
    try {       
      const driveTimeData = await getTotalTimeDrive();       
      console.log("Backend Response:", driveTimeData); // Log the entire response
      setTotalTimeDrive(driveTimeData.totalDrvieTime || 0); // 주행시간 상태 업데이트     
    } catch (error) {       
      console.error('총 주행시간 조회 실패:', error);     
    }   
  };

  useEffect(() => {
    fetchTotalTimeDrive(); // 주행시간 조회  
    fetchData(); // 초기 로딩 시 주행 기록 조회
  }, []);
  const fetchData = async () => {
    try {
      const dateString = formatDate(selectedDate);
      const saclData = await getSAcl(dateString);
      const sbrkData = await getSBrk(dateString);
      const bothPedalData = await getSPedal(dateString);

      setSacl(saclData.sacl);
      setSbrk(sbrkData.sbrk);
      setBothPedal(bothPedalData.bothPedal);
    } catch (error) {
        console.error('주행 기록 조회 실패:', error);
    }
  };

  const handleDateChange = (event, newDate) => {
    if (newDate && event.type !== 'dismissed') {
      setSelectedDate(new Date(newDate));
      fetchData(); // 날짜 변경 시 주행 기록 자동 조회
    }
  };
  
  const dateNotation = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const openDatePicker = () => {
    setShowPicker(true);
  };

  const handleDownload = async () => {
    try {
      const csvData = await downDriveInfo(formatDate(selectedDate));
      const fileUri = FileSystem.documentDirectory + `DriveLog_${formatDate(selectedDate)}.csv`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error("파일 다운로드 오류: ", error);
    }
  };

  // 비밀번호 확인 모달 닫기
  const handleClosePWCheckModal = () => {
    setPWCheckModalVisible(false);
  };

  const handleCloseUserInfoModal = () => {
    setUserInfoModalVisible(false);
  };

  // "정보 변경" 버튼 클릭 시 비밀번호 인증 모달 열기
  const handleInfoChangePress = () => {
    setPWCheckModalVisible(true);
  };

  useEffect(() => {
    console.log("@@@@isUserInfoModalVisible 상태 변경:", isUserInfoModalVisible);
  }, [isUserInfoModalVisible]); // 상태가 변경될 때마다 실행
  
  // 비밀번호 인증 성공 시
  const handlePasswordVerified = () => {
    console.log("비밀번호 인증 성공: 개인 정보 변경 모달 열기");

    // 비밀번호 인증 모달 닫은 뒤 개인 정보 변경 모달 열기
    setTimeout(() => {
      setPWCheckModalVisible(false); // 먼저 비밀번호 확인 모달 닫기
    }, 300);
    
    setTimeout(() => {
      setUserInfoModalVisible(true); // 딜레이 후 개인 정보 변경 모달 열기
    }, 1000); // 상태 반영 시간이 필요할 경우 약간의 지연 추가
  };

  // ChangUserInfo에서 사용자 정보 수정 이 함수 호출하여 사용자 정보 업데이트
  const handleUserInfoUpdated = async () => {
    try {
      const userInfo = await fetchUserInfo(); // 사용자 정보를 다시 가져오기
      setNickname(userInfo.nickname);       // 닉네임 업데이트
    } catch (error) {
      console.error("사용자 정보 업데이트 실패:", error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
    <Text style={[styles.title, { color: isDarkMode ? '#ffffff' : '#2F4F4F' }]}>{nickname} 님 안녕하세요!</Text>
    <Text style={[styles.email, { color: isDarkMode ? '#d3d3d3' : '#495c5c' }]}>{email}</Text>

    <View style={styles.infoContainer}>
        <TouchableOpacity style={styles.infoButton} onPress={handleInfoChangePress}>
          <Text style={styles.infoButtonText}>정보 변경</Text>
        </TouchableOpacity>
      </View>

      {/* 비밀번호 확인 모달 */}
      <PWCheckModal
        visible={isPWCheckModalVisible}
        onClose={handleClosePWCheckModal}
        onConfirm={handlePasswordVerified} // 인증 성공 시 호출
      />

      {/* 개인 정보 변경 모달 */}
      <ChangUserInfo
        visible={isUserInfoModalVisible}
        onClose={handleCloseUserInfoModal}
        onUserInfoUpdated={handleUserInfoUpdated}
      />

    <View style={styles.headerVar} />

      <View style={styles.dateContainer}>
        <Icon1 name="calendar-outline" size={27} color={isDarkMode ? '#00BFAE' : "#009688"} onPress={openDatePicker} />
        <View style={[styles.dateTextContainer, { backgroundColor: isDarkMode ? '#009688' : '#009688' }]}>
          <Text style={styles.dateText}>{dateNotation(selectedDate)}</Text>
        </View>
      </View>

      {Platform.OS === 'ios' ? (
        <Modal
          transparent={true}
          visible={showPicker}
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <View style={styles.modalBackground}>
            <View style={styles.modalContainer}>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
              />
              <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              handleDateChange(event, date);
              setShowPicker(false);
            }}
          />
        )
      )}

      <View style={styles.recordContainer}>

        <View>
          <View style={[styles.recordTextBox, { backgroundColor: isDarkMode ? '#009688' : '#009688' }]}>
            <Text style={[styles.recordTitle, { color: isDarkMode ? '#ffffff' : '#ffffff' }]}>급가속</Text>
          </View>
          <View style={[styles.recordBox, { backgroundColor: isDarkMode ? '#444444' : '#d5e3e2' }]}>
    <Text style={[styles.recordValue, { color: isDarkMode ? '#ffffff' : '#2F4F4F' }]}>
        {sacl}
        <Text style={{ fontSize: 14 }}>회</Text> {/* "회"의 크기를 줄임 */}
    </Text>
</View>

        </View>

        <View>
          <View style={[styles.recordTextBox, { backgroundColor: isDarkMode ? '#009688' : '#009688' }]}>
            <Text style={[styles.recordTitle, { color: isDarkMode ? '#ffffff' : '#ffffff' }]}>급정거</Text>
          </View>
          <View style={[styles.recordBox, { backgroundColor: isDarkMode ? '#444444' : '#d5e3e2' }]}>
    <Text style={[styles.recordValue, { color: isDarkMode ? '#ffffff' : '#2F4F4F' }]}>
        {sbrk}
        <Text style={{ fontSize: 14 }}>회</Text> {/* "회"의 크기를 줄임 */}
    </Text>
</View>

        </View>

        <View>
          <View style={[styles.recordTextBox, { backgroundColor: isDarkMode ? '#009688' : '#009688' }]}>
            <Text style={[styles.recordTitle, { color: isDarkMode ? '#ffffff' : '#ffffff' }]}>양발운전</Text>
          </View>
          <View style={[styles.recordBox, { backgroundColor: isDarkMode ? '#444444' : '#d5e3e2' }]}>
    <Text style={[styles.recordValue, { color: isDarkMode ? '#ffffff' : '#2F4F4F' }]}>
        {bothPedal}
        <Text style={{ fontSize: 14 }}>회</Text> {/* "회"의 크기를 줄임 */}
    </Text>
</View>



        </View>
      </View>


      <View style={styles.timeRecordContainer}>
        <View style={[styles.TimeRecordTextBox, { backgroundColor: isDarkMode ? '#009688' : '#009688' }]}>
          <Text style={[styles.recordTitle, { color: isDarkMode ? '#ffffff' : '#ffffff' }]}>총 주행시간</Text>
        </View>
        <View style={[styles.TimeRecordBox, { backgroundColor: isDarkMode ? '#444444' : '#d5e3e2' }]}>
          <Text style={[styles.TimeRecordValue, { color: isDarkMode ? '#ffffff' : '#2F4F4F' }]}>{formatDrivingTime(totalTimeDrive)}</Text>
        </View>
      </View>

      
      <TouchableOpacity style={[styles.downloadButton, { borderColor: isDarkMode ? '#009688' : '#009688' }]} onPress={handleDownload}>
      <Icon name="download" size={16} color={isDarkMode ? '#009688' : '#009688'} />
        <Text style={[styles.downloadButtonText, { color: isDarkMode ? '#009688' : '#009688' }]}>주행 기록 다운로드</Text>
      </TouchableOpacity>

    </View>
  );
};

// 스타일 정의
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    marginBottom:10,
  },
  email: {
    fontSize: 16,
    marginBottom: 30,
  },
  headerVar: {
    backgroundColor: '#009688',
    height: 3,
    marginBottom: 35,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 15,
  },
  dateTextContainer: {
    marginLeft: 10,
    padding: 5,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 7,
  },
  dateText: {
    fontSize: 16,
    color: '#FFF',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButton: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#009688',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  recordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  recordBox: {
    alignItems: 'center',
    backgroundColor: '#d5e3e2',
    width: Platform.OS === 'ios' ? 115  : 105,
    height: Platform.OS === 'ios' ? 105  : 100,
    borderBottomRightRadius: 5,  
    borderBottomLeftRadius: 5, 
    justifyContent: 'center',
  },
  recordTextBox: {
    alignItems: 'center',
    width: '100%',
    height: 40,
    borderTopRightRadius: 5,  
    borderTopLeftRadius: 5,  
    justifyContent: 'center',
    marginRight: 1,
    marginBottom: 1,
  },
  recordTitle: {
    fontSize: 16,
  },
  recordValue: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#2F4F4F',
  },
  button: {
    backgroundColor: '#009688',
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#009688',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 5,
  },
  downloadButtonText: {
    color: '#009688',
    fontSize: 16,
    marginLeft: 5,
  },
  timeRecordContainer: {
    justifyContent: 'space-around',
    marginBottom: 20,
    marginTop: 15,
    alignItems: 'center',
  },
  TimeRecordBox: {
    alignItems: 'center',
    width: '100%',
    height: 85,
    borderBottomRightRadius: 5,  
    borderBottomLeftRadius: 5,      
    justifyContent: 'center',
    marginRight:1
  },
  TimeRecordTextBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 40,
    borderTopRightRadius: 5,  
    borderTopLeftRadius: 5,  
    marginRight:1,
    marginBottom: 1,
  },
  TimeRecordValue: {
    fontSize: 27,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 0,
    marginVertical: 10, // 필요에 따라 여백 조절
    alignItems: 'flex-end', // 오른쪽 정렬
  },
  infoButton: {
    backgroundColor: '#009688',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  infoButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});


export default MypageScreen;