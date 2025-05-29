package com.trustping.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DriveScore {    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    private Long logId; // 엔티티 고유 ID
    @Min(0)
    @Max(100)
    private int score;
    @OneToOne(cascade = CascadeType.REMOVE)
    @JoinColumn(name = "user_id", referencedColumnName = "userId") // UserData의 id를 참조
    private UserData userData; // UserData 엔티티 참조
}
