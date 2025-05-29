package com.trustping.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.bind.annotation.RequestMapping;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtRequestFilter jwtTokenFilter;

    public SecurityConfig(JwtRequestFilter jwtTokenFilter) {
        this.jwtTokenFilter = jwtTokenFilter;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // CSRF 비활성화
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)  // 세션 사용 안함 (Stateless)
            )
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/api/user/check").permitAll() 
                    .requestMatchers("/api/user/signUp").permitAll() 
                    .requestMatchers("/api/user/login").permitAll()  
                    .requestMatchers("/api/user/otp").hasRole("USER")
                    .requestMatchers("/api/user/mfa").permitAll()
                    .requestMatchers("/api/user/myData").hasRole("USER")  
                    .requestMatchers("/api/user/modifyNickname").hasRole("USER")
                    .requestMatchers("/api/user/modifyBirthDate").hasRole("USER")  
                    .requestMatchers("/api/user/driveTime").hasRole("USER")  
                    .requestMatchers("/api/user/verifyPassword").hasRole("USER")
                    .requestMatchers("/api/user/modifyPassword").hasRole("USER")  
                    .requestMatchers("/api/user/deleteUser").hasRole("USER") 
                    .requestMatchers("/api/user/validate").permitAll()
                    .requestMatchers("/api/user/disableMfa").hasRole("USER")
            	    .requestMatchers("/api/abnormal/**").hasRole("USER")
            	    .requestMatchers("/api/driveLog/**").hasRole("USER")
            	    .requestMatchers("/api/score/**").hasRole("USER")
            	    .anyRequest().authenticated()  // 그 외 요청은 인증 필요
            	)
            .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class);  // JWT 필터 추가
        	
        return http.build();
    }
}
