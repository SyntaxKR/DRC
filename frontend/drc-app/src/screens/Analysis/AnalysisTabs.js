import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SuddenAcceleration from "./SuddenAcceleration";
import SuddenBraking from "./SuddenBraking";
import SamePedal from "./SamePedal";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/Ionicons';
import { useTheme } from "../../components/Mode/ThemeContext";

const Tab = createBottomTabNavigator();

export default function AnalysisTabs() {
    const { isDarkMode } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: isDarkMode ? '#121212' : '#ffffff', // 탭 바 배경색
                },
                tabBarActiveTintColor: '#009688', // 활성화된 아이콘 및 텍스트 색상
                tabBarInactiveTintColor: isDarkMode ? '#b0b0b0' : '#000000', // 비활성화된 아이콘 색상
            }}
        >
            <Tab.Screen
                name="급가속 분석"
                component={SuddenAcceleration}
                options={{
                    tabBarIcon: ({ color }) => <Icon name="forwardburger" size={20} color={color} />, // 아이콘 색상 설정
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="급정거 분석"
                component={SuddenBraking}
                options={{
                    tabBarIcon: ({ color }) => <Icon2 name="warning" size={20} color={color} />, // 아이콘 색상 설정
                    headerShown: false,
                }} 
            />
            <Tab.Screen
                name="양발운전 분석"
                component={SamePedal}
                options={{
                    tabBarIcon: ({ color }) => <Icon2 name="footsteps" size={20} color={color} />, // 아이콘 색상 설정
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
}
