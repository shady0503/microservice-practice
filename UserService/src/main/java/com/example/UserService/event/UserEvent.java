package com.example.UserService.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserEvent {
    private Long userId;
    private String email;
    private String role;
    private String action; // "CREATED", "UPDATED", "DELETED"
}