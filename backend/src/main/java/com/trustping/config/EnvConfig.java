package com.trustping.config;

import org.springframework.context.annotation.Configuration;

import io.github.cdimascio.dotenv.Dotenv;

@Configuration
public class EnvConfig {

    private final Dotenv dotenv;

    public EnvConfig() {
        dotenv = Dotenv.configure().directory(".").load();
    }

    public String getDatabaseUrl() {
        return dotenv.get("DB_URL");
    }

    public String getDatabaseUsername() {
        return dotenv.get("DB_USERNAME");
    }

    public String getDatabasePassword() {
        return dotenv.get("DB_PASSWORD");
    }
    
    public String getMqttBrokerUrl() {
    	return dotenv.get("MQTT_BROKER_URL");
    }
    
    public String getMqttClientId() {
    	return dotenv.get("MQTT_CLIENT_ID");
    }
    
	public String getMqttUserName() {
		return dotenv.get("MQTT_USER_NAME");
	}
	
	public String getMqttUserPassword() {
		return dotenv.get("MQTT_USER_PASSWORD");
	}
	
	public String getMqttDriveLogTopic() {
		return dotenv.get("MQTT_DriveLog_TOPIC");
	}
	
	public String getMqttAbnormalDrivingTopic() {
		return dotenv.get("MQTT_ABNORMAL_DRIVING_TOPIC");
	}
	
	public String getJwtSecretKey() {
		return dotenv.get("JWT_SECRET_KEY");
	}
}

