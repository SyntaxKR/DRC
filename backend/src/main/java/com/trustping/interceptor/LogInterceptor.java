package com.trustping.interceptor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.trustping.entity.UserData;
import com.trustping.service.RequestLogService;
import com.trustping.service.UserDataHelperService;
import com.trustping.utils.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class LogInterceptor implements HandlerInterceptor{
	
	@Autowired
	private RequestLogService requestLogService;
	
	@Autowired
	private UserDataHelperService userDataHelperService;
	
	@Autowired
	private JwtUtil jwtUtil;

    public LogInterceptor(RequestLogService requestLogService) {
        this.requestLogService = requestLogService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String uri = request.getRequestURI();
        UserData userId = null;
        
        if (uri.startsWith("/api/user")) {
        	String method = request.getMethod();
            requestLogService.saveLog(userId, method, uri);
            return true;
        }
        
        String jwtToken = request.getHeader("Authorization");
        
        if (jwtToken != null && jwtToken.startsWith("Bearer ")) {
            jwtToken = jwtToken.substring(7);
            String id = jwtUtil.extractUsername(jwtToken); 
            userId = userDataHelperService.getUserDataById(id).orElse(null);
        }
        
    	String method = request.getMethod();
        requestLogService.saveLog(userId, method, uri);
        return true; 
    }
}
