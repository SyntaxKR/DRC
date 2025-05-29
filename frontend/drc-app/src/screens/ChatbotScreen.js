import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Linking, Image, Platform } from 'react-native';
import { fetchData } from '../components/ChatBot/ApiService';
import { extractDateAndKeyword } from '../components/ChatBot/extractHelpers';
import { chatbotResponses } from '../components/ChatBot/chatbotResponses';
import axios from 'axios';
import { useTheme } from '../components/Mode/ThemeContext';
import HelpModal from '../components/Modal/HelpModal';


const ChatbotScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([{ text: "무엇을 도와드릴까요? \n데이터 조회를 원하는 경우 \"YYYY년 MM월 DD일 급가속 조회해줘\"와 같이 말씀해주세요", isBot: true }]);
    const [inputText, setInputText] = useState('');
    const [showQueryButtons, setShowQueryButtons] = useState(false);
    const [showBackOnly, setShowBackOnly] = useState(false);
    const [activeButton, setActiveButton] = useState(null);
    const { isDarkMode } = useTheme();
    const [showHelpImages, setShowHelpImages] = useState([]);
    const [modalVisible, setModalVisible] = useState(false); // 모달 상태 추가

  
    // GPT API 호출 함수
    const callGPTApi = async (userInput) => {
      try {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'ft:gpt-3.5-turbo-1106:personal::AZtVpenu',
          messages: [{ role: 'user', content: userInput }],
        }, {
          headers: {
            'Authorization': `Bearer API키 비밀`, // API 키를 여기에 입력하세요.
            'Content-Type': 'application/json',
          }
        });
        const botResponse = response.data.choices[0].message.content;
        return botResponse;
  
      } catch (error) {
        console.error("GPT API 호출 중 오류 발생:", error);
        return "죄송합니다, 답변을 불러오는 중에 오류가 발생했습니다.";
      }
    };
  
    const handleSend = async () => {
      if (inputText.trim() === '') return;
  
      const newMessage = { text: inputText, isBot: false };
      setMessages([...messages, newMessage]);
  
      // 날짜와 키워드 추출
      const { date, keyword } = extractDateAndKeyword(inputText);
  
      if (date && keyword) {
          // fetchData 호출
          // 현재 시간과 비교하여 미래 시간인지 확인
const currentDate = new Date();
const inputDate = new Date(date); // date 변수를 Date 객체로 변환

if (inputDate > currentDate) {
    const errorMessage = '입력하신 날짜가 유효하지 않습니다.';
    setMessages(prevMessages => [...prevMessages, { text: errorMessage, isBot: true }]);
    return; // 이후 처리를 중단
}

          console.log(date, keyword)
          try {
            console.log(date, keyword);
            let botResponse = '';

            if (keyword === "급가속" || keyword === "급정거" || keyword === "양발운전") {
                const result = await fetchData(date, keyword); // 서버로부터 받은 결과 값
                botResponse = `조회결과 ${result}회 입니다.`;
            } else {
                botResponse = `서버에 ${date}와 ${keyword}를 전송했습니다.`;
            }

            setMessages(prevMessages => [...prevMessages, { text: botResponse, isBot: true }]);
        } catch (error) {
            console.error('Error sending request:', error);
            const errorMessage = '서버와의 통신에 실패했습니다.';
            setMessages(prevMessages => [...prevMessages, { text: errorMessage, isBot: true }]);
        }

      } else {
          // 각 키워드에 대한 처리
          const keywords = {
          "앱 도움말": [
              "앱도움말",
              "앱 도움말",
              "앱 사용법",
              "앱사용법",
              "도움말",
              "사용법",
              "도와줘"
          ],
          "고객지원": [
              "고객지원",
              "고객 지원",
              "문의",
              "문의하기",
              "문의 하기",
              "질문",
              "질문하기",
              "질의하기",
              "질문 하기",
              "질의 하기",
              "질의"
          ],
          "급발진": [
              "급발진 데이터 조회",
              "급발진 데이터 확인",
              "급발진",
              "급발진 데이터 조회해줘",
              "급발진 데이터 찾아줘",
              "급발진 데이터 확인해줘",
              "급발진 조회"
          ],
          };
  
          // 각 키워드에 대한 처리
          for (const [key, phrases] of Object.entries(keywords)) {
          // 입력 텍스트가 특정 키워드와 정확히 일치하는지 확인
          if (phrases.some(phrase => inputText.trim() === phrase)) {
            handleButtonPress(key); // 버튼 클릭 처리
            setInputText(''); // 입력 후 텍스트 초기화
            return; // 이후 GPT API 호출을 생략하고 버튼 클릭 요청 처리
        }
        
      }
  
      const botResponse = await callGPTApi(inputText);
      setMessages(prevMessages => [...prevMessages, { text: botResponse, isBot: true }]);
      setInputText(''); // 입력 후 텍스트 초기화
          }
      };

    // 버튼 클릭 처리
    const handleButtonPress = (buttonText) => {
      setActiveButton(buttonText); // 클릭한 버튼을 activeButton에 설정
      const botResponse = chatbotResponses[buttonText];
      if (botResponse) {
          setMessages(prevMessages => [...prevMessages, { text: botResponse, isBot: true }]);
      }
  
      if (buttonText === "앱 도움말") {
        setShowHelpImages([
            require('../../assets/help/메인화면.png'), 
            require('../../assets/help/마이페이지.png'), 
            require('../../assets/help/마이페이지 달력설정 화면.png'),
            require('../../assets/help/설정화면.png'),
            require('../../assets/help/설정 2차인증 설정 화면.png'),
            require('../../assets/help/설정 다크모드 적용 화면.png'),
            require('../../assets/help/급가속.png'),
            require('../../assets/help/급정거.png'),
            require('../../assets/help/양발운전.png'),
            require('../../assets/help/챗봇 화면.png'),
        ]);
        setModalVisible(true); // 모달 열기
      } else if (buttonText === "급발진") {
        setShowBackOnly(true);
      } else if (buttonText === "고객지원") {
        handleEmailSupport();
      }
    };

  
    // 고객지원 이메일 처리
    const handleEmailSupport = () => {
      const email = "btr0809@naver.com";
      const subject = encodeURIComponent("고객 지원 요청");
      const body = encodeURIComponent("안녕하세요,\n\n고객 지원 요청 내용:\n\n");
  
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;
      Linking.openURL(mailtoUrl).catch(err => console.error("Unable to open email client", err));
  
      setMessages(prevMessages => [...prevMessages, { text: "이메일 클라이언트를 열었습니다. 요청 내용을 작성하세요.", isBot: true }]);
    };
  
    // 급발진 대처방법 처리
    const handleCountermeasurePress = () => {
      const countermeasureResponse =
        "급발진 대처방법:\n\n" +
        "1. **브레이크 페달을 강하게 밟기**\n" +
        "즉시 브레이크 페달을 최대한 강하게 밟아 차량 속도를 줄이도록 합니다.\n\n" +
        "2. **기어를 중립(N)으로 전환**\n" +
        "브레이크를 밟으면서 변속 레버를 중립(N) 기어로 바꿉니다. 이렇게 하면 엔진의 동력 전달이 차단됩니다.\n\n" +
        "3. **엔진을 끄기 (시동 Off)**\n" +
        "기어를 중립으로 변경한 후, 차량이 완전히 멈추지 않았다면 시동을 끄는 것도 고려할 수 있습니다.\n\n" +
        "4. **비상등을 켜고 차선 변경**\n" +
        "차량을 안전한 곳으로 옮기기 위해 비상등을 켜고, 주변 교통 상황을 확인하여 안전한 위치로 이동합니다.";
  
      setMessages(prevMessages => [...prevMessages, { text: countermeasureResponse, isBot: true }]);
    };
  
    // 조회 및 뒤로가기 버튼 처리
  
    const handleBackPress = () => {
      setShowBackOnly(false);
      setShowQueryButtons(false);
      setMessages(prevMessages => [...prevMessages, { text: "이전 상태로 돌아갔습니다.", isBot: true }]);
    };

    
    return (
      <KeyboardAvoidingView
          style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }]} // 배경색 설정
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
          <ScrollView contentContainerStyle={styles.chatContainer}>
              {messages.map((message, index) => (
                  <View key={index} style={[styles.messageContainer, message.isBot ? styles.botMessage : styles.userMessage]}>
                      {message.isBot && (
                          <View style={styles.botMessageContainer}>
                              <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#121212' : '#fff' }]}>
                                 <Image source={require('../../assets/iconizer-free-icon-chatbot-5292342-_1_.png')} style={styles.icon} />
                              </View>
                              <View style={styles.messageContentContainer}>
                                  <Text style={[styles.messageText, { color: isDarkMode ? '#121212' : '#000000' }]}>
                                      {message.text || ''} {/* 빈 문자열 처리 */}
                                  </Text>
                              </View>
                          </View>
                      )}
                      {!message.isBot && (
                          <Text style={styles.userMessageText}>
                              {message.text || ''} {/* 빈 문자열 처리 */}
                          </Text>
                      )}
                  </View>
              ))}
              

              {showQueryButtons ? (
                  <View style={styles.queryButtonsContainer}>
                      <TouchableOpacity style={styles.queryButton} onPress={handleQueryPress}>
                          <Text style={styles.queryButtonText}>조회</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.queryButton} onPress={handleBackPress}>
                          <Text style={styles.queryButtonText}>뒤로가기</Text>
                      </TouchableOpacity>
                  </View>
              ) : showBackOnly ? (
                  <View style={styles.queryButtonsContainer}>
                      <TouchableOpacity style={styles.queryButton} onPress={handleCountermeasurePress}>
                          <Text style={styles.queryButtonText}>대처방법</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.queryButton} onPress={handleBackPress}>
                          <Text style={styles.queryButtonText}>뒤로가기</Text>
                      </TouchableOpacity>
                  </View>
              ) : (
                <View style={styles.buttonsContainer}>
                  <View style={styles.row}>
                      {/* 급발진 버튼 */}
                      <TouchableOpacity style={styles.largeButton} onPress={() => handleButtonPress("급발진")}>
                          <Text style={styles.buttonText}>급발진</Text>
                      </TouchableOpacity>
                      
                      {/* 앱 도움말 버튼 */}
                      <TouchableOpacity style={styles.largeButton} onPress={() => handleButtonPress("앱 도움말")}>
                          <Text style={styles.buttonText}>앱 도움말</Text>
                      </TouchableOpacity>
                      
                      {/* 고객지원 버튼 */}
                      <TouchableOpacity style={styles.largeButton} onPress={() => handleButtonPress("고객지원")}>
                          <Text style={styles.buttonText}>고객지원</Text>
                      </TouchableOpacity>
                  </View>
                </View>
              )}
          </ScrollView>

          <HelpModal 
    visible={modalVisible} 
    images={showHelpImages} 
    onClose={() => setModalVisible(false)} 
/>

  
          <View style={[styles.inputContainer, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]}>
          <TextInput
    style={[
        styles.input, 
        { 
            borderColor: isDarkMode ? '#ccc' : '#ccc', 
            color: isDarkMode ? '#ffffff' : '#000000' // 텍스트 색상 설정
        }
    ]}
    placeholder="메시지를 입력하세요..."
    placeholderTextColor={isDarkMode ? '#b0b0b0' : '#999'} // 플레이스홀더 색상 조정
    value={inputText}
    onChangeText={setInputText}
    onSubmitEditing={handleSend}
    returnKeyType="send"
/>

    <TouchableOpacity 
        style={[styles.sendButton, { backgroundColor: isDarkMode ? '#1e1e1e' : '#fff' }]} // 배경색 설정
        onPress={handleSend}
    >
        <Image source={require('../../assets/sending-icon.png')} style={styles.sendIcon} />
    </TouchableOpacity>
</View>

      </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
  container: {
      flex: 1,
  },
  chatContainer: {
    paddingVertical: 20,
    paddingHorizontal: 10,
    flexGrow: 1, // ScrollView가 늘어나도록 설정
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: '75%', // 최대 너비 설정
    alignSelf: 'flex-start', // 기본적으로 왼쪽 정렬
  },
  botMessageContainer: {
    flexDirection: 'row', // 아이콘과 메시지를 가로로 배치
    alignItems: 'flex-start', // 아이콘과 메시지 세로 정렬
    marginBottom: 10, // 아이콘과 메시지 사이의 공백
  },
  iconContainer: {
    marginRight: 10, // 아이콘과 메시지 간의 간격
    borderRadius: 5, // 둥글게 설정 (선택 사항)
    padding: 5, // 패딩 추가 (선택 사항)
    marginLeft:10,
  },
  icon: {
    width: 35, // 아이콘 너비 조정
    height: 35, // 아이콘 높이 조정
    resizeMode: 'contain', // 비율 유지
  },
  sendIcon: {
    width: 30, // 아이콘 너비
    height: 30, // 아이콘 높이
    resizeMode: 'contain', // 비율 유지
  },
  messageContentContainer: {
    backgroundColor: '#d3d3d3', // 챗봇 메시지 배경색
    borderRadius: 10,
    padding: 10,
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
    flexWrap: 'wrap', // 텍스트 줄 바꿈 허용
  },
  userMessage: {
    backgroundColor: '#009688', // 사용자 메시지 배경색
    alignSelf: 'flex-end', // 사용자 메시지 오른쪽 정렬
    maxWidth: '75%', // 최대 너비 조정
    borderRadius: 10, // 둥글게 설정
    padding: 10, // 패딩 추가
    marginRight: 15,
  },
  userMessageText: {
    fontSize: 16,
    color: '#ffffff', // 사용자 메시지 글자를 하얀색으로 설정
    flexWrap: 'wrap', // 텍스트 줄 바꿈 허용
    textAlign: 'center',
  },
  buttonsContainer: {
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 10, // 기본 패딩
    backgroundColor: '#009688',
    borderRadius: 5,
  },
  largeButton: {
    width: 100, // 원하는 너비로 설정
    height: 35, // 원하는 높이로 설정
    backgroundColor: '#009688',
    borderRadius: 5,
    justifyContent: 'center', // 수직 중앙 정렬
    alignItems: 'center', // 수평 중앙 정렬
    marginHorizontal: 5, // 버튼 간의 간격을 조절
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center', // 수평 중앙 정렬
    lineHeight: 17.5, // 버튼의 높이에 맞춰서 수직 중앙 정렬
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      height: 40, // 입력란 높이 조정
      borderRadius: 20, // 둥글게 설정
    },
    sendButton: {
      borderRadius: 5,
      paddingVertical: 1, // 위아래 패딩 조정
      paddingHorizontal: 7, // 좌우 패딩 조정
      justifyContent: 'center', // 가운데 정렬
      alignItems: 'center', // 가운데 정렬
    },
    queryButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
    },
    queryButton: {
      padding: 10,
      backgroundColor: '#009688',
      borderRadius: 5,
    },
    queryButtonText: {
      color: '#fff',
      fontSize: 16,
    },
  });

export default ChatbotScreen;