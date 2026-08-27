package com.orgpluse.auth.services;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public final class PasswordUtil {

    private PasswordUtil() {}

    public static String hash(String plainPassword) {
        return new BCryptPasswordEncoder().encode(plainPassword);
    }

    public static boolean matches(String plainPassword, String storedHash) {
        return new BCryptPasswordEncoder().matches(plainPassword, storedHash);
    }

}
