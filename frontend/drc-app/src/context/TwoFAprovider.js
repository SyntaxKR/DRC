// 2차 인증 상태 전역 관리 (Context API + 로컬 저장소 활용)
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TwoFAContext = createContext();

export const TwoFAProvider = ({ children }) => {
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    // 컴포넌트 마운트 시 AsyncStorage에서 2차 인증 상태 로드
    useEffect(() => {
        const loadTwoFAStatus = async () => {
            const storedStatus = await AsyncStorage.getItem('is2FAEnabled');
            // 저장 값이 'true'일 경우 2차 인증 활성화
            setIs2FAEnabled(storedStatus === 'true'); // 저장된 값이 'true'일 경우 활성화
        };

        loadTwoFAStatus();
    }, []);

    // 2차 인증 상태가 변경될 때마다 AsyncStorage에 상태 저장
    useEffect(() => {
        const saveTwoFAStatus = async () => {
            await AsyncStorage.setItem('is2FAEnabled', is2FAEnabled.toString());
        };

        saveTwoFAStatus();
    }, [is2FAEnabled]);

    // Context Provider로 자식 컴포넌트에 상태 & 상태 변경 함수 제공
    return (
        <TwoFAContext.Provider value={{ is2FAEnabled, setIs2FAEnabled }}>
            {children}
        </TwoFAContext.Provider>
    );
};

export const useTwoFA = () => useContext(TwoFAContext);
