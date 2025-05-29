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

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.trustping.DTO.DriveLogReceiveDTO;
import com.trustping.config.EnvConfig;
import com.trustping.entity.DriveLog;
import com.trustping.repository.SegmentRepository;

import jakarta.annotation.PostConstruct;

@Service
public class DriveLogSubscribeService implements MqttCallback {

    @Autowired
    @Qualifier("driveLogMqttClient")
    private MqttClient driveLogMqttClient; 
    
    @Autowired
    private EnvConfig envConfig; 
    
    @Autowired
    private DriveLogStorageService driveLogStorageService;
    
    @Autowired
    private DriveScoreEvaluateService driveScoreEvaluateService;
    
    @Autowired
	private SegmentServiceImpl segmentService;
	
    
    // MQTT 브로커 연결
    @PostConstruct
    public void subscribeToTopic() {
    	// .env 환경 설정 파일에서 토픽 가져오기
        String mqttTopic = envConfig.getMqttDriveLogTopic();
        if (driveLogMqttClient == null) {
            System.out.println("MQTT 연결 불가, 클라이언트가 null");
            return;
        }
        
        // MQTT 클라이언트 연결 및 구독
        try {
        	driveLogMqttClient.setCallback(this);
        	// MQTT 클라이언트 연결 확인
            if (driveLogMqttClient.isConnected()) {
            	// MQTT 토픽 구독
            	driveLogMqttClient.subscribe(mqttTopic);
                System.out.println("Subscribed to topic: " + mqttTopic);
            } else {
                System.out.println("MQTT 연결 불가");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    // 연결 유실 시 처리
    @Override
    public void connectionLost(Throwable cause) {
        System.out.println("DriveLog Topic Connection lost! " + cause.getMessage());
        reconnect();
    }

    // MQTT 재연결 로직
    private void reconnect() {
        int retryCount = 0;
        int backoffTime = 2000;

        // 무제한 재시도
        while (true) { 
            try {
                System.out.println("Attempting to reconnect");
                driveLogMqttClient.connect();
                
                if (driveLogMqttClient.isConnected()) {
                    String mqttTopic = envConfig.getMqttDriveLogTopic();
                    driveLogMqttClient.subscribe(mqttTopic);
                    System.out.println("Reconnected and subscribed to topic: " + mqttTopic);
                    // 재연결 성공 시 메서드 종료
                    return;
                } else {
                    System.out.println("Attempted to connect to the MQTT broker, but the connection failed");
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

    // MQTT 메시지 도착 시 처리
    @Override
    public void messageArrived(String topic, MqttMessage message) throws Exception {
    	// 메시지 문자열로 변환
    	String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
        System.out.println("Message received on topic " + topic + ": " + payload);
        
        // 문자열 객체화
		ObjectMapper objectMapper = new ObjectMapper();
		objectMapper.registerModule(new JavaTimeModule());
		DriveLogReceiveDTO ReceiveDriveLog = objectMapper.readValue(payload, DriveLogReceiveDTO.class);
		
		// 주행 정보 저장
		driveLogStorageService.saveData(ReceiveDriveLog);
		// 운전 점수 업데이트
		driveScoreEvaluateService.evaluateScore(ReceiveDriveLog);
        // Segment 업데이트
        segmentService.updateOrCreateSegment(ReceiveDriveLog);
    }
    
    // 전송 확인 부분 전송은 안 해서 구현 X
    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
    }
}
