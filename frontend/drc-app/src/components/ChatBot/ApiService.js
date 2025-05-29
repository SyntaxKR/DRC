import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // AsyncStorage import


// 데이터 조회 요청
export const fetchData = async (date, keyword) => {
  let url;
  let dataField; // 응답에서 가져올 데이터 필드

  // 키워드에 따라 URL 및 데이터 필드 설정
  switch (keyword) {
    case '급가속':
      url = "비밀/abnormal/sacl"; // 급가속 URL
      dataField = 'sacl'; // 급가속 데이터 필드
      break;
    case '급정거':
      url = "비밀/abnormal/sbrk"; // 급정거 URL (예시)
      dataField = 'sbrk'; // 급정거 데이터 필드
      break;
    case '양발운전':
      url = "비밀/abnormal/bothPedal"; // 양발운전 URL (예시)
      dataField = 'bothPedal'; // 양발운전 데이터 필드
      break;
    default:
      console.error('Invalid keyword provided');
      return null;
  }


  // 날짜 유효성 검사
  if (typeof date !== 'string' || !date) {
    console.error('Invalid date provided');
    return null;
  }

  try {
    // 로컬 스토리지에서 토큰 가져오기
    const token = await AsyncStorage.getItem('token');
    console.log('토큰 가져오기 성공:', token);

    // 서버에 데이터 조회 요청 (토큰 포함)
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`, // JWT 토큰을 Authorization 헤더에 추가
        'Content-Type': 'application/json', // 요청 내용 타입 설정
      },
      params: {
        date: date, // 날짜를 쿼리 파라미터로 전달
      }
    });

    // 응답 데이터 확인
    if (response.data && response.data[dataField]) {
      console.log('데이터 전송 성공:', response.data[dataField]);
      return response.data[dataField]; // 결과값 반환
    } else {
      console.error('응답에서 데이터를 찾을 수 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('데이터 전송 오류:', error.message || error);
    return null; // 에러 발생 시 null 반환
  }
};
