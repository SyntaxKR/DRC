package com.trustping.config;

import com.trustping.interceptor.LogInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class RequestLogConfig implements WebMvcConfigurer {

    private final LogInterceptor logInterceptor;

    public RequestLogConfig(LogInterceptor loggingInterceptor) {
        this.logInterceptor = loggingInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(logInterceptor).addPathPatterns("/**"); // 인터셉터를 사용할 경로 설정하는 곳임
    }
}
