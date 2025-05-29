package com.trustping.utils;

import java.security.Key;
import java.util.Date;

import org.springframework.stereotype.Component;

import com.trustping.config.EnvConfig;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtUtil {

    private final String SECRET_KEY;
    private static final long EXPIRATION_TIME = 1000 * 60 * 60 * 10; // 10 hours
    private final Key key;

    public JwtUtil(EnvConfig envConfig) {
        this.SECRET_KEY = envConfig.getJwtSecretKey();
        this.key = Keys.hmacShaKeyFor(SECRET_KEY.getBytes());
    }

    // JWT 토큰 생성
    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // JWT 토큰 만료 여부 확인
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    // ID 추출
    public String extractUsername(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
