// 전주 대비 급가속 변화량 계산 함수
export const weeklyDiff = (data) => {
    const weeks = [[], []]; // 두 주로 나눈 데이터를 저장할 배열
  
    // 데이터 7일씩 나누어 분리
    data.forEach((item, index) => {
      const weekIndex = Math.floor(index / 7); // 주 인덱스 계산 (0: 이번 주, 1: 저번 주)
      if (weekIndex < 2) {
        weeks[weekIndex].push(item); // 해당 주에 데이터 추가
      }
    });
    
    console.log("주별 데이터:", weeks); // 주별 데이터 확인
  
    // 각 주 평균 계산
    const averages = weeks.map((week, weekIndex) => {
      if (week.length === 0) return 0; // 데이터가 없으면 0 반환
      const total = week.reduce((sum, item) => sum + item, 0); // sacl 값의 총합 계산
      const average = total / week.length; // 평균 계산
      const roundedAverage = Math.round(average * 10) / 10; // 소수점 첫째 자리까지 반올림
      console.log(`주 ${weekIndex + 1} 평균:`, roundedAverage); // 각 주의 평균 확인
      return roundedAverage; // 평균 반환
    });
  
    // 변화량 계산
    const change = averages[1] - averages[0]; // 이번 주 평균 - 저번 주 평균
    let finalChange = 0;
    // (소숫점 반영 시) let finalChange = Math.round(change * 10) / 10; // 변화량을 소수점 첫째 자리까지 반올림
  
    // 변화량 계산 조건 (소숫점 반영 시 제거)
    if (change > 0) {
      finalChange = Math.floor(change); // 증가한 경우 정수로 반영
    } else if (change < 0) {
      finalChange = Math.ceil(change); // 감소한 경우 정수로 반영 (음수)
    } else {
      finalChange = 0; // 같을 때는 0
    }
  
    console.log("변화량:", finalChange); // 변화량 확인
  
    return {
      currentWeekAvg: averages[1], // 이번 주 평균
      lastWeekAvg: averages[0], // 저번 주 평균
      
      // (소수점 반영 시 위에 코드 대신)
      // currentWeekAvg: Math.round(averages[1] * 10) / 10, // 소수점 첫째 자리까지 반영
      // lastWeekAvg: Math.round(averages[0] * 10) / 10,
      
      change: finalChange, // 변화량
    };
  };