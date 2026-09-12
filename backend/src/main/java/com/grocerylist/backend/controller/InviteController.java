package com.grocerylist.backend.controller;

import com.grocerylist.backend.dto.ListDtos.InviteResponse;
import com.grocerylist.backend.entity.User;
import com.grocerylist.backend.service.GroceryListService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invites")
public class InviteController {

    private final GroceryListService listService;

    public InviteController(GroceryListService listService) {
        this.listService = listService;
    }

    @GetMapping
    public List<InviteResponse> pendingInvites(@AuthenticationPrincipal User user) {
        return listService.pendingInvitesForUser(user);
    }

    @PostMapping("/{listId}/accept")
    public void accept(@AuthenticationPrincipal User user, @PathVariable Long listId) {
        listService.acceptInvite(user, listId);
    }

    @PostMapping("/{listId}/decline")
    public void decline(@AuthenticationPrincipal User user, @PathVariable Long listId) {
        listService.declineInvite(user, listId);
    }
}
