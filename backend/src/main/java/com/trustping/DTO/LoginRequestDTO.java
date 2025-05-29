package com.trustping.DTO;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDTO {	
	@NotBlank(message = "아이디(Email) 입력")
	@Email(message = "올바른 이메일 형식이 아닙니다.")
	private String id;
	@NotBlank(message = "패스워드 입력")
	@Pattern(
			regexp="^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
			message = "비밀번호는 최소 8자, 하나의 문자, 숫자, 특수 문자가 포함해야 합니다."
			)
	private String pw;
}
