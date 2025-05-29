package com.trustping.exception;

import java.io.IOException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;

import com.fasterxml.jackson.databind.JsonMappingException;
import com.trustping.DTO.TokenValidationDTO;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

@ControllerAdvice
public class GlobalExceptionHandler {

    // JSON 매핑 오류 처리
    @ExceptionHandler(JsonMappingException.class)
    public ResponseEntity<String> handleJsonMappingException(JsonMappingException ex, WebRequest request) {
        return new ResponseEntity<>("JSON 매핑 오류 : " + ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    // IO 오류 처리
    @ExceptionHandler(IOException.class)
    public ResponseEntity<String> handleIOException(IOException ex, WebRequest request) {
        return new ResponseEntity<>("IO 오류 : " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // 잘못된 입력 데이터 처리
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<String> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        return new ResponseEntity<>("잘못된 입력 데이터 : " + ex.getMessage(), HttpStatus.BAD_REQUEST);
    }

    // 기타 예외 처리
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleGlobalException(Exception ex, WebRequest request) {
        return new ResponseEntity<>("예기치 못한 오류 : " + ex.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    // JWT 예외 처리 (형식 오류 등 포함)
    @ExceptionHandler(JwtException.class)
    public ResponseEntity<TokenValidationDTO> handleJwtException(JwtException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                             .body(new TokenValidationDTO(false, "유효하지 않은 토큰입니다."));
    }

    // 회원 정보를 찾을 수 없는 경우 (예: 유저 데이터 조회 실패)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("데이터를 찾을 수 없습니다: " + e.getMessage());
    }
}
