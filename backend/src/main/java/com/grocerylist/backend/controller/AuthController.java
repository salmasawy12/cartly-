package com.grocerylist.backend.controller;

import com.grocerylist.backend.dto.AuthDtos.AuthResponse;
import com.grocerylist.backend.dto.AuthDtos.LoginRequest;
import com.grocerylist.backend.dto.AuthDtos.MeResponse;
import com.grocerylist.backend.dto.AuthDtos.RegisterRequest;
import com.grocerylist.backend.entity.User;
import com.grocerylist.backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal User user) {
        return new MeResponse(user.getId(), user.getEmail(), user.getDisplayName());
    }

    @DeleteMapping("/me")
    public void deleteAccount(@AuthenticationPrincipal User user) {
        authService.deleteAccount(user);
    }
}
