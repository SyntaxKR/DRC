import React, { useState } from "react"; 
import { View, StyleSheet, TouchableOpacity, Text, Image, Platform } from 'react-native';
import ViewCard from "../components/Card/ViewCard"; 
import TouchCard from "../components/Card/TouchCard"; 
import HelpScoreModal from "../components/Modal/HelpScoreModal"; 
import HelpDeductionModal from "../components/Modal/HelpDeductionModal";
import DRCLogoText from "../../assets/DRCLogo-text.png";
import { useNavigation, useFocusEffect } from '@react-navigation/native'; 
import Icon3 from 'react-native-vector-icons/Ionicons'; 
import Icon4 from 'react-native-vector-icons/FontAwesome5';
import Icon5 from 'react-native-vector-icons/MaterialCommunityIcons'
import { getSAcl, getSBrk, getSPedal, getScore } from "../api/driveInfoAPI";
import { fetchUserInfo } from "../api/userInfoAPI";
import { useTheme } from "../components/Mode/ThemeContext";

const MainScreen = () => { 
    const [score, setScore] = useState(100); 
    const [analysisCount, setAnalysisCount] = useState({
        suddenAcceleration: 0,
        suddenBraking: 0,
        bothPedal: 0,
    });
    const [nickname, setNickname] = useState("OOO");
    const navigation = useNavigation(); 
    const { isDarkMode } = useTheme();
    const [helpScoreVisible, setHelpScoreVisible] = useState(false);
    const [helpDeductionVisible, setHelpDeductionVisible] = useState(false);

    const closeHelpScoreModal = () => setHelpScoreVisible(false);
    const openHelpDeductionModal = () => setHelpDeductionVisible(true);
    const closeHelpDeductionModal = () => setHelpDeductionVisible(false);

    // useFocusEffect를 사용하여 화면 포커스 받을 때마다 정보 가져오기
    useFocusEffect(
        React.useCallback(() => {
            const fetchData = async () => {
                const today = new Date().toISOString().split('T')[0]; // 오늘 날짜 'YYYY-MM-DD' 형식으로 가져오기
                // const today = '2024-11-06'; // 테스트
                console.log("(메인화면)오늘 날짜: ", today);
                try {
                    const [accel, brake, pedal] = await Promise.all([
                        getSAcl(today),
                        getSBrk(today),
                        getSPedal(today),
                    ]);
                    setAnalysisCount({
                        suddenAcceleration: accel.sacl || 0,
                        suddenBraking: brake.sbrk || 0,
                        bothPedal: pedal.bothPedal || 0,
                    });
                } catch (error) {
                    console.error("분석 데이터 조회 오류:", error);
                }
                
                try {
                    const userInfo = await fetchUserInfo();
                    setNickname(userInfo.nickname);
                    console.log("메인 화면 닉네임", userInfo.nickname);
                } catch (error) {
                    console.error("사용자 정보 가져오기 오류:", error);
                }

                // 주행 점수 가져오기(추후 수정 필요)
                try {
                    const driveScore = await getScore();
                    setScore(driveScore.score);
                    console.log("주행 점수: ", driveScore.score);
                } catch (error) {
                    console.error("주행 점수 가져오기 오류(메인화면): ", error);
                }
            };

            fetchData();
        }, [])
    );

    const goToSuddenAcceleration = () => { 
        navigation.navigate('AnalysisTabs', { screen: '급가속 분석' }); 
    }; 

    const goToSuddenBraking = () => { 
        navigation.navigate('AnalysisTabs', { screen: '급정거 분석' }); 
    }; 

    const goToSamePedal = () => { 
        navigation.navigate('AnalysisTabs', { screen: '양발운전 분석' }); 
    }; 
    

    return( 
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#009688' }]}> 
            {/* 헤더 부분 */} 
            <View style={[styles.headerContainer, { backgroundColor: isDarkMode ? '#009688' : '#009688' }]}>
                <View style={styles.header}>
                    <Icon4 name="user-circle" size={29} color="#ffffff" onPress={() => navigation.navigate('MypageScreen')} />
                    <View style={styles.logoContainer}>
                        <Image source={DRCLogoText} style={styles.logo} />
                    </View>
                    <Icon3 name="settings-outline" size={29} color="#ffffff" onPress={() => navigation.navigate('SettingsScreen')} />
                </View>
            </View>

            {/* Help Modal */}
            <HelpScoreModal visible={helpScoreVisible} onClose={closeHelpScoreModal} />
            <HelpDeductionModal visible={helpDeductionVisible} onClose={closeHelpDeductionModal} />

            <View style={{ flex: 1, backgroundColor: isDarkMode ? '#121212' : '#ffffff', padding: 20 }}> 
                
                <ViewCard name={nickname} score={score} /> 
                <View style={styles.helpView}>
                    <Text style={{ 
                        fontWeight: 'bold', 
                        fontSize: 20, 
                        marginRight: 10,
                        color: isDarkMode ? '#ffffff' : '#000' // 다크 모드일 때 글자색을 하얀색으로 설정
                    }}>운전 습관</Text>
                    <Icon5 name="help-circle-outline" size={20} color="#868f8e" style={styles.helpIcon} onPress={openHelpDeductionModal} />
                </View>
                <View style={styles.cardContainer}> 
                    {/* analysis_count= 변수설정하기 */} 
                    <TouchCard 
                        iconSource={require('../../assets/acceleration-icon.png')} 
                        analysis_item="급가속 분석 결과" 
                        analysis_count={`${analysisCount.suddenAcceleration}회`} 
                        onPress={goToSuddenAcceleration} 
                    /> 
                    <TouchCard 
                        iconSource={require('../../assets/brake-icon.png')} 
                        analysis_item="급정거 분석 결과" 
                        analysis_count={`${analysisCount.suddenBraking}회`} 
                        onPress={goToSuddenBraking} 
                    /> 
                    <TouchCard 
                        iconSource={require('../../assets/pedal-icon.png')} 
                        analysis_item="양발운전 분석 결과" 
                        analysis_count={`${analysisCount.bothPedal}회`} 
                        onPress={goToSamePedal} 
                    /> 
                </View> 

                {/* 챗봇 버튼 */} 
                <TouchableOpacity 
                    style={[styles.chatbotButton, { backgroundColor: isDarkMode ? '#2f4f4f' : '#009688' }]} 
                    onPress={() => navigation.navigate("ChatbotScreen", { screen: 'ChatbotScreen' })}> 
                    <Icon3 name="chatbubbles" size={30} color={isDarkMode ? '#d3d3d3' : '#fff'} /> 
                </TouchableOpacity> 
            </View> 
        </View> 
    ); 
}; 

const styles = StyleSheet.create({ 
    container: { 
        flex: 1, 
        justifyContent: 'flex-start', 
    }, 
    headerContainer: { 
        padding: 20, 
        marginTop: 25, 
        height: "35%"
    }, 
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: 10, 
        marginTop: 10,
    }, 
    cardContainer: { 
        justifyContent: 'center', 
        marginBottom: 45, 
    }, 
    chatbotButton: { 
        position: 'absolute', 
        bottom: 20, 
        right: 30, 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        justifyContent: 'center', 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.3, 
        shadowRadius: 4, 
        elevation: 5, 
        marginRight:-10,
    }, 
    logo: {
        width: 130, // 로고의 너비
        height: 130, // 로고의 높이
        resizeMode: 'contain', // 로고 크기
        opacity: 0.8,
    },
    logoContainer: {
        alignItems: 'center',
        position: 'relative',
    },
    helpView: {
        marginTop: -200, 
        flexDirection: 'row',
        alignItems: 'center',
    }
}); 
export default MainScreen; 
