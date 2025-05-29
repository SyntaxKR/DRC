package com.trustping.entity;

import java.time.LocalDate;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AbnormalData {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long logId;
	@Column(columnDefinition = "TIMESTAMP")
	private LocalDate date;
	private int sAcl;
	private int sBrk;
	private int bothPedal;
	@ManyToOne(cascade = CascadeType.REMOVE)
    @JoinColumn(name = "user_id", referencedColumnName = "userId") // UserData의 id를 참조
    private UserData userData; // UserData 엔티티 참조
}
