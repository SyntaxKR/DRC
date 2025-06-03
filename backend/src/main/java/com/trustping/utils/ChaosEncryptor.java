package com.trustping.utils;

import com.trustping.config.EnvConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class ChaosEncryptor {

    private final double seed;
    private static final double CHAOS_R = 3.99;
    private static final int CHAOS_SCALE = 10000;

    @Autowired
    public ChaosEncryptor(EnvConfig envConfig) {
        this.seed = Double.parseDouble(envConfig.getChaosSeed());
    }

    public double[] generateChaoticSequence(int length) {
        double[] sequence = new double[length];
        double x = seed;
        for (int i = 0; i < length; i++) {
            x = CHAOS_R * x * (1 - x);
            sequence[i] = x;
        }
        return sequence;
    }

    public int encrypt(int value, double chaos) {
        int key = (int) (chaos * CHAOS_SCALE);
        return value ^ key;
    }

    public int decrypt(int encryptedValue, double chaos) {
        int key = (int) (chaos * CHAOS_SCALE);
        return encryptedValue ^ key;
    }
}