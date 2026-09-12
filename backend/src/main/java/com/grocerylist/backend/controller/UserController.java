package com.grocerylist.backend.controller;

import com.grocerylist.backend.dto.ListDtos.UserLookupResponse;
import com.grocerylist.backend.service.GroceryListService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final GroceryListService listService;

    public UserController(GroceryListService listService) {
        this.listService = listService;
    }

    @GetMapping("/lookup")
    public UserLookupResponse lookup(@RequestParam String email) {
        return listService.lookupUser(email);
    }
}
