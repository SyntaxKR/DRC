// 초 단위 시간을 시(h)와 분(m) 형식으로 변환하는 함수
export const formatDrivingTime = (seconds) => {
    const hours = Math.floor(seconds / 3600); // 전체 시간을 계산 (초를 3600으로 나눔)
    const minutes = Math.floor((seconds % 3600) / 60); // 나머지 초를 분 단위로 변환
    return `${hours}시간 ${minutes}분`; // " 시 분" 형식의 문자열로 반환
  };