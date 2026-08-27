package com.orgpluse.jwt;

import com.orgpluse.services.OrgpluseUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtRequestValidator extends OncePerRequestFilter {

    @Autowired
    private JwtTokenGenerator jwtTokenGenerator;

    @Autowired
    private OrgpluseUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String header = request.getHeader("Authorization");

        String jwtToken = null;
        String username = null;
        String role     = null;

        // ── 1. Extract token from "Bearer <token>" ────────────────────────────
        if (header != null && header.startsWith("Bearer ")) {
            jwtToken = header.substring(7);
            try {
                username = jwtTokenGenerator.extractUsername(jwtToken);
                role     = jwtTokenGenerator.extractRole(jwtToken);
            } catch (Exception e) {
                System.out.println("JWT validation error: " + e.getMessage());
            }
        }

        // ── 2. Authenticate if token is valid and context is empty ────────────
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtTokenGenerator.validateToken(jwtToken, userDetails)) {
                List<SimpleGrantedAuthority> authorities =
                        List.of(new SimpleGrantedAuthority(role));

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // ── 3. Always continue the chain ──────────────────────────────────────
        filterChain.doFilter(request, response);
    }
}
