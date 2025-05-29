package com.trustping.DTO;

import java.time.LocalDateTime;

import com.trustping.utils.ExcelColumnName;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriveLogExcelDTO {

	@ExcelColumnName(name ="차량 번호")
    private String carId;

	@ExcelColumnName(name ="액셀 수치")
    private int aclPedal;

	@ExcelColumnName(name ="브레이크 수치")
    private int brkPedal;	

	@ExcelColumnName(name ="속도")
    private int speed;

	@ExcelColumnName(name ="RPM")
    private int rpm;

	@ExcelColumnName(name ="시간")
    private LocalDateTime createdAt;
}
