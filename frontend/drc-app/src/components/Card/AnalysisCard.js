import React, { useEffect, useState } from 'react'; 
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from "../Mode/ThemeContext";

const AnalysisCard = ({ num, borderColor, title, todayData, DataKey }) => {
    const { isDarkMode } = useTheme();
    const [count, setCount] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(1));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await todayData(); // 오늘 날짜로 데이터 조회
                setCount(data[DataKey] || 0); // 데이터 설정 (sacl 값 사용)
            } catch (error) {
                console.error("데이터 조회 오류:", error);
                setCount(0);
            }
        };

        fetchData();
    }, [todayData]);

    // 오늘 주행 분석 결과 애니메이션
    useEffect(() => {
        const fadeIn = () => {
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true, 
                }),
                // 두 번째 애니메이션: opacity를 1로 변경 (보임 상태)
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1300,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                // 애니메이션 끝난 후 500ms 지연 -> fadeIn 함수 재 실행
                setTimeout(fadeIn, 500);
            });
        };
    
        fadeIn();
    }, [fadeAnim]);
    

    let iconName;
    let displayNum = num;

    if (num > 0) {
        iconName = "arrow-up-bold";
    } else if (num < 0) {
        iconName = "arrow-down-bold";
        displayNum = Math.abs(num); // 음수 절댓값으로 변환
    } else {
        iconName = "approximately-equal"; // 0일 경우 아이콘
    }

    return (
        <View style={[styles.customCard, { backgroundColor: isDarkMode ? '#333333' : '#ffffff' }]}>
            <View style={[styles.innerCard, { borderColor: isDarkMode ? '#333333' : '#ffffff' }]}>
                <Text style={[styles.subText, { color: isDarkMode ? '#ffffff' : '#2F4F4F', fontWeight: 'bold',fontSize:22 }]}>
                    <Icon name="car-arrow-left" size={30} color={isDarkMode ? '#ffffff' : '#2F4F4F'} /> 저번주 대비
                </Text>

                {/* 상단 우측 텍스트 추가 */}
                <Animated.View style={{ opacity: fadeAnim, position: 'absolute', top: 10, right: 10 }}>
                    <Text style={[styles.countText, { 
                        color: isDarkMode ? '#fff' : '#2F4F4F',
                        fontSize: 15,
                    }]}>
                        오늘 {title.replace(" 분석", "")} 횟수: {count}회
                    </Text>
                </Animated.View>

                
                <View style={styles.row}>
                    <Text style={[styles.num, { color: isDarkMode ? '#ffffff' : '#2F4F4F' }]}>{displayNum}회</Text>
                    <Icon 
                        name={iconName} 
                        size={40} 
                        color={num > 0 ? (isDarkMode ? '#4CAF50' : 'red') : num < 0 ? (isDarkMode ? '#FF5252' : 'lightgreen') : (isDarkMode ? '#ffffff' : '#2F4F4F')}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    customCard: {
        height: '35%',
        width: '95%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        margin: 10,
        marginBottom: 5,
        elevation: 5,
    },
    innerCard: {
        flex: 1,
        width: '100%',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#009688',
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 10,
    },
    subText: {
        fontSize: 18,
        color: '#2F4F4F', 
        textAlign: 'center',
        marginBottom: 10, 
    },
    num: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#2F4F4F', 
        textAlign: 'center',
        marginRight: 10, 
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});


export default AnalysisCard;
