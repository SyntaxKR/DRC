package com.trustping.utils;

import java.io.ByteArrayOutputStream;
import java.util.Arrays;

public class TentMapUtil {

    public static int[] nextChaotic(int x) {
        x = x & 0xFFFF;
        int y;
        if (x == 0) {
            y = (((x << 4) & 0xFFFF) - ((x >>> 12) & 0xFFFF)) & 0xFFFF;
        } else {
            int xInv = 0xFFFF - x;
            y = (((xInv << 4) & 0xFFFF) - ((xInv >>> 12) & 0xFFFF)) & 0xFFFF;
        }
        return new int[]{y, y};
    }

    public static byte[] decryptSensorData(byte[] packet, int seed) {
        int beg = ((packet[0] & 0xFF) << 8) | (packet[1] & 0xFF);
        int end = ((packet[packet.length - 2] & 0xFF) << 8) | (packet[packet.length - 1] & 0xFF);
        byte[] encrypted = Arrays.copyOfRange(packet, 2, packet.length - 2);

        int x = seed & 0xFFFF;
        int[] next = nextChaotic(x);
        int y = next[0];

        if (y != beg) throw new IllegalArgumentException("Beg value mismatch");

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        int idx = 0;
        while (idx < encrypted.length) {
            int y_hi = (y >> 8) & 0xFF;
            int y_lo = y & 0xFF;

            out.write(encrypted[idx++] ^ y_hi);
            if (idx < encrypted.length) {
                out.write(encrypted[idx++] ^ y_lo);
            }

            next = nextChaotic(y);
            y = next[0];
        }

        if (y != end) throw new IllegalArgumentException("End value mismatch");

        return out.toByteArray();
    }
}
