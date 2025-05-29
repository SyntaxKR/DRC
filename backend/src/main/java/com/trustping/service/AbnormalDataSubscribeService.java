package com.trustping.service;

import java.nio.charset.StandardCharsets;

import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import com.trustping.config.EnvConfig;

import jakarta.annotation.PostConstruct;

@Service
public class AbnormalDataSubscribeService implements MqttCallback {

    @Autowired
    @Qualifier("abnormalDataMqttClient")
    private MqttClient abnormalDataMqttClient;
    
    @Autowired
    private EnvConfig envConfig;
    
    @Autowired
    private AbnormalDataStorageService abnormalDataStorageService;
     
    @PostConstruct
    public void subscribeToTopic() {
        String mqttTopic = envConfig.getMqttAbnormalDrivingTopic();
        if (abnormalDataMqttClient == null) {
            System.out.println("MQTT 연결 불가, 클라이언트가 null");
            return;
        }

        try {
        	abnormalDataMqttClient.setCallback(this);
            if (abnormalDataMqttClient.isConnected()) {
            	abnormalDataMqttClient.subscribe(mqttTopic);
                System.out.println("Subscribed to topic: " + mqttTopic);
            } else {
                System.out.println("MQTT 연결 불가");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @Override
    public void connectionLost(Throwable cause) {
        System.out.println("Abnormal Driving Topic Connection lost! " + cause.getMessage());
        reconnect();
    }

    // 재연결 로직
    private void reconnect() {
        int retryCount = 0;
        int backoffTime = 2000;

        // 무제한 재시도
        while (true) { 
            try {
                System.out.println("Attempting to reconnect");
                abnormalDataMqttClient.connect();
                
                if (abnormalDataMqttClient.isConnected()) {
                    String mqttTopic = envConfig.getMqttAbnormalDrivingTopic();
                    abnormalDataMqttClient.subscribe(mqttTopic);
                    System.out.println("Reconnected and subscribed to topic: " + mqttTopic);
                    // 재연결 성공 시 메서드 종료
                    return;
                } else {
                    System.out.println("Connected to MQTT client, but isConnected() check failed.");
                }
            } catch (MqttException e) {
                System.err.println("Reconnection attempt failed: " + e.getMessage());
            }

            retryCount++;
            try {
                Thread.sleep(backoffTime);
                // 최대 1분 대기
                backoffTime = Math.min(backoffTime * 2, 60000);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt(); // 인터럽트 상태 복구
            }

            if (retryCount >= 5) {
                System.err.println("Failed attempts : " + retryCount);
            }
        }
    }
    
    @Override
    public void messageArrived(String topic, MqttMessage message) throws Exception {
    	String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
        System.out.println("Message received on topic " + topic + ": " + payload);
        
        abnormalDataStorageService.saveData(payload);
    }
    
    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // 전송은 안해서 구현 필요 없음
    }
}
