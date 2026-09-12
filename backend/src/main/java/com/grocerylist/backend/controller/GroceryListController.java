package com.grocerylist.backend.controller;

import com.grocerylist.backend.dto.ListDtos.*;
import com.grocerylist.backend.entity.User;
import com.grocerylist.backend.service.GroceryListService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lists")
public class GroceryListController {

    private final GroceryListService listService;

    public GroceryListController(GroceryListService listService) {
        this.listService = listService;
    }

    @PostMapping
    public ListResponse createList(@AuthenticationPrincipal User user, @Valid @RequestBody CreateListRequest request) {
        return listService.createList(user, request);
    }

    @GetMapping
    public List<ListResponse> myLists(@AuthenticationPrincipal User user) {
        return listService.listsForUser(user);
    }

    @PostMapping("/{listId}/members")
    public void addMember(@AuthenticationPrincipal User user, @PathVariable Long listId,
                           @Valid @RequestBody AddMemberRequest request) {
        listService.addMember(user, listId, request);
    }

    @GetMapping("/{listId}/members")
    public List<MemberResponse> members(@AuthenticationPrincipal User user, @PathVariable Long listId) {
        return listService.listMembers(user, listId);
    }

    @GetMapping("/{listId}/items")
    public List<ItemResponse> getItems(@AuthenticationPrincipal User user, @PathVariable Long listId) {
        return listService.getItems(user, listId);
    }

    @PostMapping("/{listId}/items")
    public ItemResponse addItem(@AuthenticationPrincipal User user, @PathVariable Long listId,
                                 @Valid @RequestBody CreateItemRequest request) {
        return listService.addItem(user, listId, request);
    }

    @PatchMapping("/{listId}/items/{itemId}")
    public ItemResponse updateItem(@AuthenticationPrincipal User user, @PathVariable Long listId,
                                    @PathVariable Long itemId, @RequestBody UpdateItemRequest request) {
        return listService.updateItem(user, listId, itemId, request);
    }

    @DeleteMapping("/{listId}/items/{itemId}")
    public void deleteItem(@AuthenticationPrincipal User user, @PathVariable Long listId, @PathVariable Long itemId) {
        listService.deleteItem(user, listId, itemId);
    }

    @DeleteMapping("/{listId}")
    public void deleteList(@AuthenticationPrincipal User user, @PathVariable Long listId) {
        listService.deleteList(user, listId);
    }
}
