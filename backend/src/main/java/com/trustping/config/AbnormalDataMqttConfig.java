package com.trustping.config;

import org.eclipse.paho.client.mqttv3.MqttClient;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import javax.net.ssl.*;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;

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

            // [추가] TLS 소켓 설정
            try {
                SSLSocketFactory sslSocketFactory = createSslSocketFactory(envConfig.getCaCrtPath());
                options.setSocketFactory(sslSocketFactory);
            } catch (Exception e) {
                System.err.println("TLS 설정 실패: " + e.getMessage());
                return null;
            }

            mqttClient.connect(options);
        } catch (MqttException e) {
            System.err.println("MQTT Client connection failed for " + clientId + ": " + e.getMessage());
        }
        return mqttClient;
    }

    // [추가] CA 인증서를 기반으로 SSLSocketFactory 생성
    private SSLSocketFactory createSslSocketFactory(String caCrtPath) throws Exception {
        CertificateFactory cf = CertificateFactory.getInstance("X.509");
        FileInputStream fis = new FileInputStream(caCrtPath);
        X509Certificate caCert = (X509Certificate) cf.generateCertificate(fis);

        KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType());
        trustStore.load(null);
        trustStore.setCertificateEntry("caCert", caCert);

        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        tmf.init(trustStore);

        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, tmf.getTrustManagers(), null);

        return sslContext.getSocketFactory();
    }
}