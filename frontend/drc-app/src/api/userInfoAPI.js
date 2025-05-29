import axios from 'axios';
import { API_URL } from "@env";
import AsyncStorage from '@react-native-async-storage/async-storage';

// axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_URL, // 서버 기본 URL
  headers: {
    'Content-Type': 'application/json', // JSON 형식의 데이터를 보내기 위해 Content-Type을 application/json으로 설정
  },
});

// 개인 정보 가져오기 API
export const fetchUserInfo = async () => {
    try {
        const token = await AsyncStorage.getItem('token');

        // 헤더에 토큰 포함하여 요청 보내기
        const response = await apiClient.get("/user/myData", {
            headers: {
                Authorization: `Bearer ${token}`,  // 토큰을 Bearer 방식으로 설정
            },
        });

        console.log("사용자 정보 조회 반환 데이터:", response.data);

        return response.data; // 응답 데이터 반환
    } catch (error) {
        console.error('개인 정보 가져오기 오류(api 코드):', error);
        throw error;
    }
};

// 닉네임 수정 API
export const changeNickname = async (newNickname) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/user/modifyNickname`,
            { nickname: newNickname }, 
            {
                headers: {
                    Authorization: `Bearer ${token}`, // 헤더에 토큰 추가
                    "Content-Type": "application/json",
                }
            }
        );
        console.log("닉네임 수정 처리-서버 반환: ", response.data);
        return response.data; // 서버의 응답 반환
    } catch (error) {
        console.error('닉네임 변경 오류:', error);
        throw error;
    }
};

// 생년월일 수정 API
export const changeBirthDate = async (newBirthDate) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await axios.patch(`${API_URL}/user/modifyBirthDate`,
            { birthDate: newBirthDate }, 
            {
                headers: {
                    Authorization: `Bearer ${token}`, // 헤더에 토큰 추가
                    "Content-Type": "application/json",
                }
            }
        );
        console.log("생년월일 수정 처리-서버 반환: ", response.data);
        return response.data; // 서버의 응답 반환
    } catch (error) {
        console.error('생년월일 변경 오류:', error);
        throw error;
    }
};
