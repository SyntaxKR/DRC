package com.trustping.DTO;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OtpResponseDTO {
	private boolean success;
	private String otpKey;
	private String QRUrl;
}
