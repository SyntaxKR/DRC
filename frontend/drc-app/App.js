import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from './src/screens/MainScreen';
import MypageScreen from './src/screens/MypageScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SuddenAcceleration from './src/screens/Analysis/SuddenAcceleration';
import SuddenBraking from './src/screens/Analysis/SuddenBraking';
import SamePedal from './src/screens/Analysis/SamePedal';
import PersonalInfoScreen from './src/screens/PersonalInfoScreen';
import AnalysisTabs from './src/screens/Analysis/AnalysisTabs'; 
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import { TwoFAProvider } from './src/context/TwoFAprovider'; // 2차 인증 상태 관리
import SplashScreenComponent from './src/screens/SplashScreen';
import { ThemeProvider, useTheme } from './src/components/Mode/ThemeContext'; // 다크 모드 Context 추가

const Stack = createStackNavigator(); // 스택 내비게이션 생성

const App = () => {
  return (
    <ThemeProvider>
      <TwoFAProvider>
        <MainNavigator />
      </TwoFAProvider>
    </ThemeProvider>
  );
};

const MainNavigator = () => {
  const { isDarkMode } = useTheme(); // 다크 모드 상태 가져오기

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SplashScreen" // 초기 화면을 스플래시 스크린으로 설정
        screenOptions={{
          headerShown: true, // 모든 화면에서 헤더 보이기
          headerStyle: {
            backgroundColor: isDarkMode ? '#333333' : '#ffffff', // 헤더 배경색 다크 모드에 맞춤
          },
          headerTintColor: isDarkMode ? '#ffffff' : '#009688', // 헤더 텍스트 색상
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          cardStyle: {
            backgroundColor: isDarkMode ? '#121212' : '#ffffff', // 카드 배경색 다크 모드에 맞춤
          },
        }}
      >
        <Stack.Screen
          name="SplashScreen"
          component={SplashScreenComponent} // 스플래시 스크린 추가
          options={{ headerShown: false}}
        />
        <Stack.Screen
          name="LoginScreen"
          component={LoginScreen} // 로그인 화면 추가
          options={{ headerShown: false}}
        />
        <Stack.Screen
          name="MainScreen"
          component={MainScreen}
          options={{ headerShown: false, headerTitle: '메인 화면', headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="MypageScreen"
          component={MypageScreen}
          options={{ headerTitle: '마이 페이지', headerTitleAlign: 'center' }} 
        />
        <Stack.Screen 
          name="SettingsScreen" 
          component={SettingsScreen} 
          options={{ headerTitle: '설정', headerTitleAlign: 'center' }} 
        />
        <Stack.Screen 
          name="SuddenAcceleration" 
          component={SuddenAcceleration} 
          options={{ headerTitle: '급가속 분석', headerTitleAlign: 'center' }} 
        />
        <Stack.Screen 
          name="SuddenBraking" 
          component={SuddenBraking} 
          options={{ headerTitle: '급제동 분석', headerTitleAlign: 'center' }} 
        />
        <Stack.Screen 
          name="SamePedal" 
          component={SamePedal} 
          options={{ headerTitle: '동일 페달 분석', headerTitleAlign: 'center' }} 
        />
        <Stack.Screen 
          name="PersonalInfoScreen" 
          component={PersonalInfoScreen} 
          options={{ headerTitle: '개인정보', headerTitleAlign: 'center' }} 
        />
        <Stack.Screen
          name="AnalysisTabs"
          component={AnalysisTabs}
          options={{ headerTitle: '', headerTitleAlign: 'center' }}
        />
        <Stack.Screen
          name="ChatbotScreen"
          component={ChatbotScreen} 
          options={{ headerTitle: '', headerTitleAlign: 'center' }}
        />
        <Stack.Screen 
          name="SignUpScreen" component={SignUpScreen} 
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
