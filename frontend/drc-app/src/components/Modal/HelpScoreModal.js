import React, { useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { useTheme } from '../Mode/ThemeContext';

const HelpScoreModal = ({ visible, onClose }) => {
    const { isDarkMode } = useTheme();
    const screenWidth = Dimensions.get('window').width; // 화면 너비를 가져옴
    const scrollViewRef = useRef(null); // ScrollView 참조 생성
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = [
        require('../../../assets/helpScore/HelpScore1.png'), // 이미지 경로
        require('../../../assets/helpScore/HelpScore2.png'),
    ];

    const descriptions = [
        '안전운전 점수는 최근 주행시간을\n 10시간 단위로 하나의 구간으로 책정한 뒤\n 최대 6개 구간의 점수를 기반으로 \n평균을 내어 계산됩니다.\n\n',
        '또한, 주행시간이 60시간이 넘을 경우\n 가장 과거 시점 구간이 제외되고\n 새로운 구간이 점수에 반영됩니다.\n\n\n',
    ];

    const nextImage = () => {
        if (currentImageIndex < images.length - 1) {
            setCurrentImageIndex((prevIndex) => prevIndex + 1);
            scrollViewRef.current?.scrollTo({
                x: (currentImageIndex + 1) * (screenWidth - 60),
                animated: true,
            });
        }
    };

    const prevImage = () => {
        if (currentImageIndex > 0) {
            setCurrentImageIndex((prevIndex) => prevIndex - 1);
            scrollViewRef.current?.scrollTo({
                x: (currentImageIndex - 1) * (screenWidth - 60),
                animated: true,
            });
        }
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2f4f4f' : '#fff' }]}>
                    {/* ScrollView 참조 연결 */}
                    <ScrollView
                        horizontal
                        pagingEnabled // 한 번에 한 페이지씩 넘김
                        showsHorizontalScrollIndicator={false} // 스크롤바 숨김
                        ref={scrollViewRef} // 참조 연결
                    >
                        {images.map((image, index) => (
                            <View key={index} style={[styles.pageContainer, { width: screenWidth - 78 }]}>

                                {/* 이미지 */}
                                <Image source={image} style={styles.image} />

                                {/* 설명 텍스트 */}
                                <Text style={[styles.descriptionText, { color: isDarkMode ? '#fff' : '#000' }]}>
                                    {descriptions[index]}
                                </Text>
                            </View>
                        ))}
                    </ScrollView>

                    {/* 화면 이동 버튼 */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={prevImage} style={styles.arrowButton}>
                            <Text style={styles.arrowText}>◀</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeText}>확인</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={nextImage} style={styles.arrowButton}>
                            <Text style={styles.arrowText}>▶</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '95%',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
    },
    pageContainer: {
        alignItems: 'center',
        marginHorizontal: 10, // 이미지 사이 간격 추가
    },
    image: {
        width: 300,
        height: 190,
        resizeMode: 'contain',
        marginBottom: 20,
        marginTop: 30,
    },
    descriptionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    arrowButton: {
        padding: 10,
    },
    arrowText: {
        fontSize: Platform.OS === 'ios' ? 46  : 24,
        fontWeight: 'bold',
        color: '#009688',
    },
    closeButton: {
        padding: 9,
        borderRadius: 5,
        marginTop: 5,
        width: '65%',
        height: 40,
        backgroundColor: '#009688',
        marginHorizontal: 5,
    },
    closeText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    pageNumberText: {
        position: 'absolute',
        top: 10,
        right: 20,
        fontSize: 16,
        fontWeight: 'bold',
        zIndex: 10,
    },
});

export default HelpScoreModal;
