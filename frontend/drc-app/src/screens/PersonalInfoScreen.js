import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated} from 'react-native';
import { fetchUserInfo } from '../api/userInfoAPI';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../components/Mode/ThemeContext'; // ThemeContext에서 useTheme 가져오기


const PersonalInfoScreen = () => {
    const { isDarkMode, setIsDarkMode } = useTheme(); // 다크 모드 상태 가져오기
    const [userInfo, setUserInfo] = useState({
        nickname: '임의의 닉네임',
        id: '임의의 ID (Email)',
        birthDate: '임의의 생년월일',
        carId: '임의의 차량 번호',
    });
    const [loading, setLoading] = useState(true);
    const animatedValues = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;

    useEffect(() => {
        const getUserInfo = async () => {
            try {
                const data = await fetchUserInfo();
                setUserInfo(data);
            } catch (error) {
                console.error('사용자 정보 로드 실패:', error);
            } finally {
                setLoading(false);
                startAnimation(); // 애니메이션 시작
            }
        };

        getUserInfo();
    }, []);

    const startAnimation = () => {
        Animated.stagger(100, animatedValues.map((value) => {
            return Animated.timing(value, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            });
        })).start();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#009688" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }]}> 
             <Text style={[styles.title, { color: isDarkMode ? '#009688' : '#121212' }]}>개인 정보</Text>
            {['닉네임', 'ID (Email)', '생년월일', '차량 번호'].map((label, index) => (
                <Animated.View
                    key={index}
                    style={{
                        ...styles.infoContainer,
                        opacity: animatedValues[index],
                        transform: [{
                            translateY: animatedValues[index].interpolate({
                                inputRange: [0, 1],
                                outputRange: [20, 0], // 슬라이드 거리
                            }),
                        }],
                    }}
                >
                    <Icon name={label === '닉네임' ? 'person' : label === 'ID (Email)' ? 'email' : label === '생년월일' ? 'cake' : 'directions-car'} size={24} color="white" />
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.value}>{userInfo[label === '닉네임' ? 'nickname' : label === 'ID (Email)' ? 'id' : label === '생년월일' ? 'birthDate' : 'carId']}</Text>
                </Animated.View>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#ffffff',
        justifyContent: 'flex-start', // 수직 가운데 정렬
        alignItems: 'center', // 수평 가운데 정렬
        paddingTop: 180,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2F4F4F', // 기본색 청록
        marginBottom: 20,
        textAlign: 'center',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15, // 항목 간 여백
        padding: 15,
        borderRadius: 10,
        backgroundColor: '#009688', // 기본색 청록
        width: '100%', // 전체 너비 사용
    },
    label: {
        flex: 1,
        fontSize: 18,
        marginLeft: 10,
        color: '#ffffff', // 텍스트 색상 화이트
    },
    value: {
        fontSize: 16,
        color: '#ffffff', // 텍스트 색상 화이트
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
});


export default PersonalInfoScreen;