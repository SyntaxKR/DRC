import React from 'react';
import { View, Text, Button, TouchableOpacity, Linking } from 'react-native';
import Modal from 'react-native-modal';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const TwoFactorAuthModal = ({ isVisible, onClose, otpKey, handleCopyOtpKey, qrUrl, isDarkMode }) => {
  return (
    <Modal isVisible={isVisible}>
      <View style={{ 
        backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff', 
        padding: 20, 
        borderRadius: 10,
        alignItems: 'center',  
        justifyContent: 'center'
      }}>
        <TouchableOpacity style={{ position: 'absolute', top: 10, right: 10 }} onPress={onClose}>
          <MaterialIcons name="close" size={24} color={isDarkMode ? '#ffffff' : '#009688'} />
        </TouchableOpacity>
        
        <Text style={{ 
          color: isDarkMode ? '#ffffff' : '#009688', 
          fontSize: 22, 
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 15,
        }}>
          2차 인증 정보
        </Text>

        <View style={{ marginVertical: 10, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ 
              color: isDarkMode ? '#ffffff' : '#555', 
              textAlign: 'center',
              marginRight: 10 // 텍스트와 복사 아이콘 사이 간격
            }}>
              OTP 설정 키: {otpKey}
            </Text>
            <TouchableOpacity onPress={handleCopyOtpKey}>
              <MaterialIcons name="content-copy" size={24} color={isDarkMode ? '#ffffff' : '#009688'} />
            </TouchableOpacity>
          </View>
        </View>

        <Button 
          title="QR 확인" 
          color={isDarkMode ? '#ffffff' : '#009688'} 
          onPress={() => Linking.openURL(qrUrl)} 
          style={{ marginTop: 15 }}
        />
      </View>
    </Modal>
  );
};

export default TwoFactorAuthModal;
