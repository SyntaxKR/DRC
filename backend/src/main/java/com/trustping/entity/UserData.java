package com.trustping.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserData {	
    @Id
    private String userId;
    private String pw;
    private String nickname;
    private LocalDate birthDate;
    @Column(unique = true)
    private String carId;
    private String otpKey;
    @Column(nullable = false) 
    private String role; 
}