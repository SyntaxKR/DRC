import React, { useState, useRef } from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, Text, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useTheme } from '../Mode/ThemeContext'; // ThemeContext에서 useTheme 가져오기

const HelpModal = ({ visible, images, onClose }) => {
    const { isDarkMode } = useTheme(); // 현재 테마 정보 가져오기
    const [currentIndex, setCurrentIndex] = useState(0); // 현재 이미지 인덱스 상태
    const flatListRef = useRef(null); // FlatList의 ref 생성

    const nextImage = () => {
        const nextIndex = (currentIndex + 1) % images.length; // 다음 인덱스 계산
        setCurrentIndex(nextIndex);
        flatListRef.current.scrollToIndex({ index: nextIndex, animated: true }); // 다음 이미지로 스크롤
    };

    const prevImage = () => {
        const prevIndex = (currentIndex - 1 + images.length) % images.length; // 이전 인덱스 계산
        setCurrentIndex(prevIndex);
        flatListRef.current.scrollToIndex({ index: prevIndex, animated: true }); // 이전 이미지로 스크롤
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose} // 모달 닫기
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalContainer}
            >
                <View style={[styles.modal, { backgroundColor: isDarkMode ? '#1f1f1f' : 'white' }]}>
                    <View style={styles.imageContainer}>
                        {/* Page Number */}
                        <Text style={[styles.pageNumberText, { color: isDarkMode ? '#fff' : '#000' }]}>
                            {currentIndex + 1} / {images.length}
                        </Text>
                        
                        {/* FlatList for horizontal scrolling */}
                        <FlatList
                            ref={flatListRef}
                            data={images}
                            horizontal
                            renderItem={({ item }) => (
                                <View style={styles.imageWrapper}>
                                    <Image 
                                        source={item} // 현재 이미지 표시
                                        style={styles.helpImage}
                                    />
                                </View>
                            )}
                            keyExtractor={(item, index) => index.toString()}
                            showsHorizontalScrollIndicator={false}
                            pagingEnabled
                            contentContainerStyle={styles.flatListContent} // 패딩 추가
                            onScroll={(event) => {
                                const contentOffsetX = event.nativeEvent.contentOffset.x;
                                const index = Math.floor(contentOffsetX / styles.helpImage.width);
                                setCurrentIndex(index); // 스크롤 시 현재 인덱스 업데이트
                            }}
                            onMomentumScrollEnd={(event) => {
                                const contentOffsetX = event.nativeEvent.contentOffset.x;
                                const index = Math.floor(contentOffsetX / styles.helpImage.width);
                                setCurrentIndex(index); // 스크롤이 끝났을 때 인덱스 업데이트
                                flatListRef.current.scrollToIndex({ index, animated: true }); // 중앙으로 스크롤
                            }}
                        />
                    </View>
                    {/* Arrow Buttons and Close Button */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={prevImage} style={styles.arrowButton}>
                            <Text style={styles.arrowText}>◀</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.closeButton, { backgroundColor: isDarkMode ? '#444' : '#009688' }]} onPress={onClose}>
                            <Text style={[styles.closeText, { color: isDarkMode ? '#fff' : '#000' }]}>닫기</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={nextImage} style={styles.arrowButton}>
                            <Text style={styles.arrowText}>▶</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '99%',
    },
    modal: {
        width: '95%', // 모달 너비를 거의 꽉 차게 설정
        maxHeight: '90%', // 모달 최대 높이
        padding: 10,
        borderRadius: 10,
    },
    imageContainer: {
        alignItems: 'center', // 페이지 번호를 중앙에 위치시키기 위해 수정
        marginBottom: 10,
    },
    arrowButton: {
        marginHorizontal: 10,
    },
    arrowText: {
        fontSize: 34,
        color: '#009688',
    },
    helpImage: {
        width: 320, // 이미지 너비를 고정
        height: 510, // 이미지 높이를 크게 설정
        resizeMode: 'cover', // 이미지 비율 유지하면서 꽉 채우기
        borderRadius: 10,
        marginHorizontal: 10, // 이미지 간격 조정
    },
    closeButton: {
        padding: 9,
        marginTop: 15,
        borderRadius: 5,
        width: "65%",
        height: 40,
        marginHorizontal: 5,
    },
    closeText: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    imageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    flatListContent: {
        alignItems: 'center', // 중앙 정렬
        paddingHorizontal: 20, // FlatList의 전체 패딩 추가
    },
    pageNumberText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default HelpModal;
