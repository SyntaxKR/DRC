package com.trustping.utils;

import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class ExcelUtil {

    // CSV 다운로드 메서드
    public void download(Class<?> clazz, List<?> data, String fileName, HttpServletResponse response) {
        response.setContentType("text/csv");
        response.setHeader("Content-Disposition", "attachment; filename=" + fileName + ".csv");
        response.setCharacterEncoding("UTF-8"); // 응답 인코딩 설정

        try (ServletOutputStream outputStream = response.getOutputStream();
             PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream, "UTF-8"))) { // UTF-8로 인코딩 설정
            
            writer.write("\uFEFF"); // UTF-8 BOM 이거 있어야 제대로 출력됨
            
            // 헤더 작성
            List<String> headerNames = findHeaderNames(clazz);
            writer.println(String.join(",", headerNames));
            
            // 데이터 작성
            for (Object obj : data) {
                List<Object> fieldValues = findFieldValue(clazz, obj);
                String line = fieldValues.stream()
                    .map(value -> {
                        // 특수 문자 처리: 콤마, 큰따옴표 포함 시 큰따옴표로 감싸기
                        String stringValue = String.valueOf(value);
                        if (stringValue.contains(",") || stringValue.contains("\"")) {
                            stringValue = "\"" + stringValue.replace("\"", "\"\"") + "\""; // 큰따옴표 이스케이프
                        }
                        return stringValue;
                    })
                    .collect(Collectors.joining(",")); // 각 필드를 콤마로 연결
                writer.println(line); // 데이터 한 행 추가
            }
            writer.flush();
        } catch (IOException | IllegalAccessException e) {
            System.out.println("Export CSV error: " + e.getMessage());
            throw new RuntimeException(e);
        }
    }

    // 헤더 찾기
    private List<String> findHeaderNames(Class<?> clazz) {
        return Arrays.stream(clazz.getDeclaredFields())
                .filter(field -> field.isAnnotationPresent(ExcelColumnName.class))
                .map(field -> field.getAnnotation(ExcelColumnName.class).name())
                .collect(Collectors.toList());
    }

    // 데이터 값 추출
    private List<Object> findFieldValue(Class<?> clazz, Object obj) throws IllegalAccessException {
        List<Object> result = new ArrayList<>();
        for (Field field : clazz.getDeclaredFields()) {
            field.setAccessible(true);
            result.add(field.get(obj));
        }
        return result;
    }
}
