package com.trustping.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RequestLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long logId;    
    private String method;
    private String uri;
    @Column(name = "create_Date", columnDefinition = "TIMESTAMP")
    private LocalDateTime createDate;
    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now().withNano(0);
    }
    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "userId") // UserData의 id를 참조
    private UserData userData; // UserData 엔티티 참조

}
