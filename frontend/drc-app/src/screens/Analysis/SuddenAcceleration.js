import React from 'react';
import { getWeeklySAcl, getSAcl } from '../../api/driveInfoAPI';
import AnalysisScreen from './AnalysisScreen';

const SuddenAcceleration = () => {
  const fetchData = async (twoWeeksAgo, currentDate) => {
    // 급가속 데이터 가져오기
    return await getWeeklySAcl(twoWeeksAgo, currentDate);
  };

  const todayData = async () => {
    const today = new Date().toISOString().slice(0, 10); // 오늘 날짜
    return await getSAcl(today); // 오늘 날짜로 급가속 데이터 조회
    // const today = '2024-11-06'; // 테스트
    // return today; // 테스트
  };

  return (
    <AnalysisScreen 
      todayData={todayData}
      fetchData={fetchData}
      title="급가속 분석"
      chartDataKey="sacl"
      loadingText="급가속 분석 중..."

      themeColor="#009688" // 테마색
    />
  );
};

export default SuddenAcceleration;