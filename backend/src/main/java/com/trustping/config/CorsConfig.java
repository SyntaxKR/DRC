/*
 * package com.trustping.config;
 * 
 * import org.springframework.context.annotation.Bean; import
 * org.springframework.context.annotation.Configuration; import
 * org.springframework.web.cors.CorsConfiguration; import
 * org.springframework.web.cors.UrlBasedCorsConfigurationSource; import
 * org.springframework.web.filter.CorsFilter;
 * 
 * //Cors 문제 났을 때 사용
 * 
 * @Configuration public class CorsConfig {
 * 
 * @Bean public CorsFilter corsFilter() { CorsConfiguration config = new
 * CorsConfiguration(); config.setAllowCredentials(true); // 쿠키 허용
 * config.addAllowedOriginPattern("*"); // 모든 도메인 허용
 * config.addAllowedHeader("*"); // 모든 헤더 허용 config.addAllowedMethod("*"); // 모든
 * 메소드 허용
 * 
 * UrlBasedCorsConfigurationSource source = new
 * UrlBasedCorsConfigurationSource(); source.registerCorsConfiguration("/**",
 * config); return new CorsFilter(source); } }
 */