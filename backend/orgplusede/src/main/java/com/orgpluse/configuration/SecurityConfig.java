package com.orgpluse.configuration;

import com.orgpluse.jwt.JwtRequestValidator;
import com.orgpluse.services.OrgpluseUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtRequestValidator jwtRequestValidator;

    @Autowired
    private OrgpluseUserDetailsService userDetailsService;

    // ── BCryptPasswordEncoder bean ────────────────────────────────────────────
    // Declared here so Spring injects it into AdminAuthService + EmployeeAuthService
    // via @Autowired PasswordEncoder. PasswordUtil.hash() is still used directly
    // in those services (it calls new BCryptPasswordEncoder() internally), but
    // PasswordEncoder bean is needed by AuthenticationManager for login comparison.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ── AuthenticationManager bean ────────────────────────────────────────────
    // Exposes Spring's internal AuthenticationManager so AdminAuthService /
    // EmployeeAuthService can call authenticationManager.authenticate().
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    // ── SecurityFilterChain ───────────────────────────────────────────────────
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth

                // ── Public — no token required ────────────────────────────────
                .requestMatchers(
                        "/api/v1/auth/admin/login",
                        "/api/v1/auth/admin/register",
                        "/api/v1/auth/employee/login",
                        "/api/v1/auth/employee/register"
                ).permitAll()

                // ── Admin-only endpoints ──────────────────────────────────────
                .requestMatchers("/api/v1/admin/**").hasAuthority("ROLE_ADMIN")

                // ── Employee self-service endpoints ───────────────────────────
                .requestMatchers("/api/v1/employee/**").hasAuthority("ROLE_EMPLOYEE")

                // ── Everything else requires any valid token ──────────────────
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );

        // JWT filter runs BEFORE Spring's form-login filter
        http.addFilterBefore(jwtRequestValidator, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // ── CORS ──────────────────────────────────────────────────────────────────
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:3000"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));   // allow Authorization header
        config.setExposedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
