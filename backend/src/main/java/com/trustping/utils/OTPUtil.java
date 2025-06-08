package com.trustping.utils;

import java.nio.ByteBuffer;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;



public class OTPUtil {
    public static int generateTOTP(String secretBase32, long forTime, int digits, int period) throws Exception {
        byte[] key = Base64.getDecoder().decode(secretBase32);
        long counter = forTime / period;
        ByteBuffer buffer = ByteBuffer.allocate(8);
        buffer.putLong(counter);
        byte[] msg = buffer.array();

        Mac mac = Mac.getInstance("HmacSHA1");
        SecretKeySpec keySpec = new SecretKeySpec(key, "HmacSHA1");
        mac.init(keySpec);
        byte[] hmacHash = mac.doFinal(msg);

        int offset = hmacHash[hmacHash.length - 1] & 0x0F;
        int binary = ((hmacHash[offset] & 0x7F) << 24) |
                ((hmacHash[offset + 1] & 0xFF) << 16) |
                ((hmacHash[offset + 2] & 0xFF) << 8) |
                (hmacHash[offset + 3] & 0xFF);
        return binary % (int) Math.pow(10, digits);
    }
}