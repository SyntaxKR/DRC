import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../Mode/ThemeContext'; // ThemeContext에서 useTheme 가져오기

const BasicModal = ({ visible, onClose, title, children, onConfirm }) => {
  const { isDarkMode } = useTheme(); // 현재 테마 정보 가져오기

  return (
    <Modal transparent={true} visible={visible} animationType="fade">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={[styles.modal, { backgroundColor: isDarkMode ? '#1f1f1f' : 'white' }]}>
          <Text style={[styles.title, { color: isDarkMode ? '#d3d3d3' : '#2F4F4F' }]}>{title}</Text>
          <View style={styles.content}>
            {children}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={onClose} style={[styles.cancelButton, { backgroundColor: isDarkMode ? '#444' : '#ccc' }]}>
              <Text style={[styles.cancelText, { color: isDarkMode ? '#fff' : 'black' }]}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onConfirm} style={[styles.confirmButton, { backgroundColor: isDarkMode ? '#2F4F4F' : '#2F4F4F' }]}>
              <Text style={styles.confirmText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  content: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5, 
  },
  cancelText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  confirmButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  confirmText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default BasicModal;
