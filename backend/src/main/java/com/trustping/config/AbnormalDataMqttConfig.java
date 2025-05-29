package com.trustping.config;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AbnormalDataMqttConfig {
    
    @Autowired
    private EnvConfig envConfig;

    @Bean
    public MqttClient abnormalDataMqttClient() {
        return createMqttClient(envConfig.getMqttBrokerUrl(), envConfig.getMqttClientId() + "_abnormalData");
    }
    
    private MqttClient createMqttClient(String brokerUrl, String clientId) {
        MqttClient mqttClient = null;
        try {
            mqttClient = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            MqttConnectOptions options = new MqttConnectOptions();
            options.setCleanSession(true);
            options.setAutomaticReconnect(true);
            mqttClient.connect(options);
        } catch (MqttException e) {
            System.err.println("MQTT Client connection failed for " + clientId + ": " + e.getMessage());
        }
        return mqttClient;
    }
}