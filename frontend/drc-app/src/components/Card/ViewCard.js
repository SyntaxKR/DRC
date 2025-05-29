import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../Mode/ThemeContext';
import HelpScoreModal from "../../components/Modal/HelpScoreModal";

const ViewCard = ({ name, score }) => {
    const { isDarkMode } = useTheme(); 
    const [helpScoreVisible, setHelpScoreVisible] = useState(false); 

    const openHelpScoreModal = () => setHelpScoreVisible(true);

    const getScoreColor = (score) => {
        return `#009688`;
    };

    return (
        <View>
            <TouchableOpacity 
                style={[styles.customCard, { backgroundColor: isDarkMode ? '#444444' : '#ffffff',borderRadius:15,borderColor: isDarkMode ? '#444444' : '#ffffff', }]}
                activeOpacity={0.96}
                onPress={openHelpScoreModal}
            >
                <Text style={[styles.name, { color: isDarkMode ? '#ffffff' : '#333' }]}>
                    <Text style={styles.boldName}></Text>이번주 주행 점수
                </Text>
                <View style={{ marginVertical: 3 }}></View>
                <Text style={[styles.score, { color: getScoreColor(score) }]}>
                    {score}점
                </Text>
            </TouchableOpacity>

            {/* HelpScoreModal 컴포넌트 추가 */}
            <HelpScoreModal 
                visible={helpScoreVisible} 
                onClose={() => setHelpScoreVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    customCard: {
        top: "-40%",
        height: '65%',
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: {
        width: 0,
        height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#fff',
    },
    name: {
        fontSize: 25,
        textAlign: 'center',
    },
    boldName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    score: {
        fontSize: 45,
        fontWeight: 'bold',
        textAlign: 'center',
    },
});

export default ViewCard;
