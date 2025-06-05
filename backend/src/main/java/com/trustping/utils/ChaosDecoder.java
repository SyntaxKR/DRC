package com.trustping.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.trustping.DTO.DriveLogReceiveDTO;
import com.trustping.config.EnvConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class ChaosDecoder {

    @Autowired
    private EnvConfig envConfig;

    public DriveLogReceiveDTO decryptPayload(String base64Payload) {
        try {
            int seed = Integer.decode(envConfig.getChaosSeed());

            // Base64 디코딩
            byte[] packet = Base64.getDecoder().decode(base64Payload);

            // 텐트맵 복호화
            byte[] decrypted = TentMapUtil.decryptSensorData(packet, seed);

            // JSON 역직렬화
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            return mapper.readValue(new String(decrypted, StandardCharsets.UTF_8), DriveLogReceiveDTO.class);

        } catch (Exception e) {
            throw new RuntimeException("복호화 실패: " + e.getMessage(), e);
        }
    }
}
