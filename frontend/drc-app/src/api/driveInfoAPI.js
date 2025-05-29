import axios from "axios";
import {API_URL} from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 토큰 포함 헤더 인스턴스
const getTokenHeader = async () => {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}`};
}

// 급가속 조회(일정 기간)
export const getWeeklySAcl = async (twoWeeksAgo, currentDate) => {
    try {
        const token = await AsyncStorage.getItem('token');
        console.log("급가속 분석결과 조회 함수 들어옴");

        // 쿼리 매개변수로 날짜를 포함하여 API 요청
        const response = await apiClient.get("/abnormal/weeklySAcl", {
            params: {
                startDate: twoWeeksAgo,
                endDate: currentDate,
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("급가속 그래프용 반환값", response.data);

        return response.data; // response.data로 수정
    } catch (error) {
        console.error("급가속 그래프용 값 호출 오류: ", error.response.data);
        throw error;
    }
}

//< 토큰 헤더 공통 인스턴스 작동 잘되면 급가속 이 함수로 변경 >
// 급가속 조회 (일정 기간)
// export const getWeeklySAcl = async (startDate, endDate) => {
//     try {
//         const headers = await getTokenHeader();
//         const response = await apiClient.get(`/abnormal/weeklySAcl`, {
//             headers,
//             params: { startDate, endDate }
//         });
//         console.log("급가속 조회 결과:", response.data);
//         return response.data;
//     } catch (error) {
//         console.error("급가속 조회 오류:", error.response?.data || error.message);
//         throw error;
//     }
// };

// 급정거 조회(일정기간)
export const getWeeklySBrk = async (startDate, endDate) => {
    try {
        console.log("급정거 분석결과 조회 함수 들어옴");
        const headers = await getTokenHeader();
        console.log("급정거 분석결과 조회 함수 들어옴");
        const response = await apiClient.get(`/abnormal/weeklySBrk`, {
            headers,
            params: { startDate, endDate }
        });
        console.log("급정거 조회 결과:", response.data);
        return response.data;
    } catch (error) {
        console.error("급정거 조회 오류:", error.response?.data || error.message);
        throw error;
    }
}

// 양발운전 조회(일정기간)
export const getWeeklySPedal = async (startDate, endDate) => {
    try {
        const headers = await getTokenHeader();
        console.log("양발운전 분석결과 조회 함수 들어옴");
        const response = await apiClient.get(`/abnormal/weeklyBothPedal`, {
            headers,
            params: { startDate, endDate }
        });
        console.log("양발 운전 조회 결과:", response.data);
        return response.data;
    } catch (error) {
        console.error("양발 운전 조회 오류:", error.response?.data || error.message);
        throw error;
    }
};

//-----여기서부터 하루 데이터 조회

// 급가속 조회 (하루)
export const getSAcl = async (date) => {
    try {
        console.log("(하루)급가속 조회 함수 들어옴");
        const headers = await getTokenHeader();
        const response = await apiClient.get("/abnormal/sacl", {
            headers,
            params: { date }
        });
        console.log("급가속 조회 결과:", response.data);
        return response.data; // { sacl: int }
    } catch (error) {
        console.error("급가속 조회 오류:", error.response?.data || error.message);
        throw error;
    }
};

// 급정거 조회(하루)
export const getSBrk = async (date) => {
    try {
        console.log("(하루)급정거 조회 함수 들어옴");
        const headers = await getTokenHeader();
        const response = await apiClient.get("/abnormal/sbrk", {
            headers,
            params: { date }
        });
        console.log("급정거 조회 결과:", response.data);
        return response.data;
    } catch (error) {
        // console.error("급정거 조회 오류:", error.response?.data || error.message);
        throw error;
    }
}

// 양발 운전 조회(하루)
export const getSPedal = async (date) => {
    try {
        console.log("(하루)양발운전 조회 함수 들어옴");
        const headers = await getTokenHeader();
        const response = await apiClient.get(`/abnormal/bothPedal`, {
            headers,
            params: { date }
        });
        console.log("양발 운전 조회 결과:", response.data);
        return response.data;
    } catch (error) {
        console.error("양발 운전 조회 오류:", error.response?.data || error.message);
        throw error;
    }
};

// 총 주행시간 조회
export const getTotalTimeDrive = async () => {
    try {
        console.log("총 주행시간 조회 함수 들어옴");
        const headers = await getTokenHeader();
        const response = await apiClient.get(`/driveLog/driveTime`, {
            headers,
        });
        console.log("총 주행시간 조회 결과:", response.data);
        return response.data;
    } catch (error) {
        console.error("총 주행시간 조회 오류:", error.response?.data || error.message);
        throw error;
    }
};

// 주행정보 다운로드
export const downDriveInfo = async (date) => {
  try {
    console.log("주행정보 다운로드 API 함수 실행");
    const headers = await getTokenHeader();
    const response = await apiClient.get("/driveLog/download", {
        headers,
        params: { date }
    });
    console.log("주행정보 다운로드 처리 반환값: ", response.data);
    return response.data;
  } catch (error) {
    console.error("주행정보 다운로드 오류: ", error.response?.data || error.message);
    throw error;
  }
};

// 주행 점수 가져오기 (추후 수정 필요)
export const getScore = async () => {
    try {
        console.log("주행 점수 API 함수 실행");
        const headers = await getTokenHeader();
        const response = await apiClient.get("/score/checkScore", {
            headers,
            params: {}
        });
        console.log("주행 점수 반환값: ", response.data);
        return response.data;
    } catch (error) {
        console.error("주행 점수 가져오기 오류: ", error.response?.data || error.message);
        throw error;
    }
};