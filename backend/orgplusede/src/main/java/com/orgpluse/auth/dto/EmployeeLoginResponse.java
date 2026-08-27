package com.orgpluse.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeLoginResponse {

    private Long   id;
    private String employeeCode;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String status;
    private String role;    // "ROLE_EMPLOYEE"
    private String token;   // JWT — used by frontend for all subsequent requests

}
