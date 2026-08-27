package com.orgpluse.auth.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminLoginResponse {

    private Long   id;
    private String fullName;
    private String email;
    private String status;
    private String role;    // "ROLE_ADMIN"
    private String token;   // JWT — used by frontend for all subsequent requests

}
