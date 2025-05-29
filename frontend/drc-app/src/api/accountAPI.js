// 계정 관련 API (로그아웃, 회원탈퇴, 비밀번호 확인·변경)
import axios from 'axios';
import { API_URL } from "@env";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Axios 클라이언트 설정 (기본 URL 및 헤더 설정)
const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
      "Content-Type": "application/json",
    }
  });
  

/**
 * 비밀번호 인증 API 요청
 * 
 * @param {string} pw - 사용자가 입력한 비밀번호
 * @returns {Object} 서버 응답 데이터(객체)
 * @returns {boolean} returns.success - 인증 성공 여부
 * @returns {String} returns.message - 메시지
 * 
 * 비밀번호 확인 API를 호출하여, 서버에서 입력된 비밀번호가 맞는지 확인한다.
 * 인증된 사용자인지 확인하기 위해 Authorization 헤더에 토큰을 포함시킨다.
 */
export const verifyPassword = async (password) => {
  console.log("비밀번호 인증 API 요청");
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.post(`${API_URL}/user/verifyPassword`, 
      { pw: password },
      {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
      }
  );
    console.log("비밀번호 확인 서버 반환 데이터: ", response);
    return response.data.success;
  } catch (error) {
    console.error('비밀번호 확인 오류:', error);
    throw error;
  }
};


/**
 * 비밀번호 변경 API 요청
 * 
 * @param {string} pw - 새 비밀번호
 * @returns {Object} 서버 응답 데이터(객체)
 * @returns {boolean} returns.success - 변경 성공 여부
 * @returns {String} returns.message - 메시지
 *
 * 사용자가 새 비밀번호를 입력하고, 서버에 변경 요청한다.
 * 요청 시 Authorization 헤더에 토큰을 포함하여 인증된 사용자만 비밀번호를 변경할 수 있다.
 */
export const changePassword = async (newPassword) => {
  console.log("비밀번호 변경 API 요청");
  try {
    const token = await AsyncStorage.getItem('token');

    const response = await axios.patch(`${API_URL}/user/modifyPassword`, 
      {
        pw: newPassword
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      }
    );

    console.log("비밀번호 변경 요청 반환값: ", response.data);
    return response.data; // 성공 여부와 메시지를 반환
  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    throw error; // 오류 발생 시 예외 처리
  }
};


/**
 * 회원 탈퇴 API 요청
 * 
 * @param {string} pw - 회원 탈퇴를 위한 비밀번호
 * @returns {Object} 서버 응답 데이터(객체)
 * @returns {boolean} returns.success - 탈퇴 성공 여부
 * @returns {String} returns.message - 메시지
 * 
 * 사용자가 비밀번호를 입력하고, 이를 통해 회원 탈퇴 요청을 서버에 보낸다.
 * 인증을 위해 Authorization 헤더에 토큰을 포함시켜야 한다.
 */
export const deleteUserAccount = async (password) => {
  try {
    const token = await AsyncStorage.getItem('token');

    // 서버에 회원 탈퇴 요청
    const response = await apiClient.delete("/user/deleteUser", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: { pw: password } // 비밀번호를 body에 포함
    });

    console.log("회원 탈퇴 요청 반환 데이터: ", response.data);
    return response.data;
  } catch (error) {
    console.error("회원 탈퇴 요청 오류(api코드):", error);
    throw error;
  }
};