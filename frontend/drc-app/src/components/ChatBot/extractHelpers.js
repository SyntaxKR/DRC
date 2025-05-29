export const extractDateAndKeyword = (input) => {
  // 다양한 날짜 형식을 처리하는 정규식
  const dateRegex = /(\d{4})[년\s]*\.?\s*(\d{1,2})[월\s]*\.?\s*(\d{1,2})[일]?/;

  const dateMatch = input.match(dateRegex);
  console.log("Matched groups:", dateMatch);
  console.log(input);
  let date = null;

  // 정규식 매칭에 따른 날짜 처리
  if (dateMatch) {
    if (dateMatch[1] && dateMatch[2] && dateMatch[3]) {
      let year = dateMatch[1]; // YYYY
      let month = dateMatch[2].padStart(2, '0'); // MM
      let day = dateMatch[3].padStart(2, '0'); // DD
      date = `${year}-${month}-${day}`;
    }
  }

  // 키워드 추출
  const keywords = ["급가속", "급정거", "급발진", "양발운전"];
  const keyword = keywords.find((kw) => input.includes(kw)) || null;

  console.log("Formatted date:", date);

  return { date, keyword };
};


