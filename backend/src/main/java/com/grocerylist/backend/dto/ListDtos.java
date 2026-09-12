package com.grocerylist.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class ListDtos {

    public record CreateListRequest(@NotBlank String name) {}

    public record ListResponse(Long id, String name, Long ownerId, Instant createdAt) {}

    public record AddMemberRequest(@Email @NotBlank String email) {}

    public record UserLookupResponse(Long id, String email, String displayName) {}

    public record InviteResponse(Long listId, String listName, Long ownerId, String ownerName) {}

    public record MemberResponse(Long userId, String displayName, boolean owner) {}

    public record CreateItemRequest(@NotBlank String name, String category) {}

    public record UpdateItemRequest(String name, String category, Boolean checked) {}

    public record ItemResponse(Long id, Long listId, String name, String category, boolean checked, Instant createdAt) {}
}
