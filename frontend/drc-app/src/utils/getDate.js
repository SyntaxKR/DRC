// 날짜 계산 함수 (오늘, 2주전 날짜 리턴)
import { formatDate } from "./formatDate";

export const getDate = () => {
    const currentDate = new Date();
    const twoWeeksAgo = new Date(currentDate);
    twoWeeksAgo.setDate(currentDate.getDate() - 14);
  
    return {
      currentDate: formatDate(currentDate),
      twoWeeksAgo: formatDate(twoWeeksAgo),
    };
  };