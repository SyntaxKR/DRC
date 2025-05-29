import React, { useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Platform } from 'react-native';
import { useTheme } from '../Mode/ThemeContext';

const HelpDeductionModal = ({ visible, onClose }) => {
    const { isDarkMode } = useTheme();
    const screenWidth = Dimensions.get('window').width; // 화면 너비를 가져옴
    const scrollViewRef = useRef(null); // ScrollView 참조 생성
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const images = [
        require('../../../assets/helpScore/HelpDeduction1.png'), // 이미지 경로
        require('../../../assets/helpScore/HelpDeduction2.png'),
    ];

    const descriptions = [
        '매초마다 급가속, 급정거 여부를 평가하여\n 3초동안 3번 연속으로 기준에 충족될 때\n 3점 감점됩니다\n\n',
        '또한, 양발운전을 하였을 경우 3점 감점됩니다.',
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
        width: 290,
        height: 220,
        resizeMode: 'contain',
        marginBottom: 20,
        marginTop: 40,
    },
    descriptionText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginRight:6,
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
        marginTop: 2,
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

export default HelpDeductionModal;
