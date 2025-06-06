package com.trustping.service;

import java.nio.charset.StandardCharsets;

import com.trustping.utils.ChaosDecoder;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import com.trustping.DTO.DriveLogReceiveDTO;
import com.trustping.config.EnvConfig;

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

    @Autowired
    private ChaosDecoder chaosDecoder;

    private static final Logger logger = LoggerFactory.getLogger(DriveLogSubscribeService.class);

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
    public void messageArrived(String topic, MqttMessage message) {
    	// 메시지 문자열로 변환
        String payload = new String(message.getPayload(), StandardCharsets.UTF_8);

        // 암호화된 메시지 로그
        logger.info("Encrypted Message received on topic {}: {}", topic, payload);

        try {
            DriveLogReceiveDTO receiveDriveLog = chaosDecoder.decryptPayload(payload);

            // 복호화된 메시지 로그 (필드별로 출력)
            logger.info("Decrypted Message - CarId: {}, Speed: {}, SpeedChange: {}, DriveState: {}, RPM: {}, AclPedal: {}, BrkPedal: {}",
                    receiveDriveLog.getCarId(),
                    receiveDriveLog.getSpeed(),
                    receiveDriveLog.getSpeedChange(),
                    receiveDriveLog.getDriveState(),
                    receiveDriveLog.getRpm(),
                    receiveDriveLog.getAclPedal(),
                    receiveDriveLog.getBrkPedal()
            );

            driveLogStorageService.saveData(receiveDriveLog);
            driveScoreEvaluateService.evaluateScore(receiveDriveLog);
            segmentService.updateOrCreateSegment(receiveDriveLog);
        } catch (Exception e) {
            System.err.println("복호화 또는 저장 중 오류: " + e.getMessage());
        }
    }
    
    // 전송 확인 부분 전송은 안 해서 구현 X
    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
    }
}
