package com.grocerylist.backend.service;

import com.grocerylist.backend.dto.ListDtos.*;
import com.grocerylist.backend.entity.GroceryList;
import com.grocerylist.backend.entity.ListItem;
import com.grocerylist.backend.entity.ListMember;
import com.grocerylist.backend.entity.MembershipStatus;
import com.grocerylist.backend.entity.User;
import com.grocerylist.backend.repository.GroceryListRepository;
import com.grocerylist.backend.repository.ListItemRepository;
import com.grocerylist.backend.repository.ListMemberRepository;
import com.grocerylist.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class GroceryListService {

    private final GroceryListRepository listRepository;
    private final ListMemberRepository memberRepository;
    private final ListItemRepository itemRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public GroceryListService(GroceryListRepository listRepository,
                               ListMemberRepository memberRepository,
                               ListItemRepository itemRepository,
                               UserRepository userRepository,
                               SimpMessagingTemplate messagingTemplate) {
        this.listRepository = listRepository;
        this.memberRepository = memberRepository;
        this.itemRepository = itemRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public ListResponse createList(User owner, CreateListRequest request) {
        GroceryList list = listRepository.save(GroceryList.builder()
                .name(request.name())
                .owner(owner)
                .build());

        memberRepository.save(ListMember.builder().list(list).user(owner).build());

        return toResponse(list);
    }

    public List<ListResponse> listsForUser(User user) {
        return memberRepository.findByUserIdAndStatus(user.getId(), MembershipStatus.ACCEPTED).stream()
                .map(ListMember::getList)
                .map(this::toResponse)
                .toList();
    }

    public UserLookupResponse lookupUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No user with that email"));
        return new UserLookupResponse(user.getId(), user.getEmail(), user.getDisplayName());
    }

    @Transactional
    public void addMember(User requester, Long listId, AddMemberRequest request) {
        GroceryList list = requireMembership(requester, listId);

        User invitee = userRepository.findByEmailIgnoreCase(request.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No user with that email"));

        memberRepository.findByListIdAndUserId(listId, invitee.getId()).ifPresent(existing -> {
            String message = existing.getStatus() == MembershipStatus.ACCEPTED
                    ? "Already a member of this list"
                    : "Already invited - waiting for them to accept";
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        });

        memberRepository.save(ListMember.builder().list(list).user(invitee).status(MembershipStatus.PENDING).build());
    }

    public List<InviteResponse> pendingInvitesForUser(User user) {
        return memberRepository.findByUserIdAndStatus(user.getId(), MembershipStatus.PENDING).stream()
                .map(member -> {
                    GroceryList list = member.getList();
                    return new InviteResponse(list.getId(), list.getName(), list.getOwner().getId(), list.getOwner().getDisplayName());
                })
                .toList();
    }

    @Transactional
    public void acceptInvite(User user, Long listId) {
        ListMember membership = memberRepository.findByListIdAndUserIdAndStatus(listId, user.getId(), MembershipStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No pending invite for this list"));
        membership.setStatus(MembershipStatus.ACCEPTED);
        memberRepository.save(membership);
        messagingTemplate.convertAndSend("/topic/lists/" + listId, new MemberJoinedEvent(listId, user.getId()));
    }

    public List<MemberResponse> listMembers(User requester, Long listId) {
        requireMembership(requester, listId);
        GroceryList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));

        return memberRepository.findByListId(listId).stream()
                .filter(member -> member.getStatus() == MembershipStatus.ACCEPTED)
                .map(member -> new MemberResponse(
                        member.getUser().getId(),
                        member.getUser().getDisplayName(),
                        member.getUser().getId().equals(list.getOwner().getId())
                ))
                .toList();
    }

    @Transactional
    public void declineInvite(User user, Long listId) {
        ListMember membership = memberRepository.findByListIdAndUserIdAndStatus(listId, user.getId(), MembershipStatus.PENDING)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No pending invite for this list"));
        memberRepository.delete(membership);
    }

    public List<ItemResponse> getItems(User requester, Long listId) {
        requireMembership(requester, listId);
        return itemRepository.findByListIdOrderByCreatedAtAsc(listId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ItemResponse addItem(User requester, Long listId, CreateItemRequest request) {
        GroceryList list = requireMembership(requester, listId);

        ListItem item = itemRepository.save(ListItem.builder()
                .list(list)
                .name(request.name())
                .category(request.category())
                .build());

        ItemResponse response = toResponse(item);
        broadcast(listId, response);
        return response;
    }

    @Transactional
    public ItemResponse updateItem(User requester, Long listId, Long itemId, UpdateItemRequest request) {
        requireMembership(requester, listId);

        ListItem item = itemRepository.findById(itemId)
                .filter(i -> i.getList().getId().equals(listId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        if (request.name() != null) item.setName(request.name());
        if (request.category() != null) item.setCategory(request.category());
        if (request.checked() != null) item.setChecked(request.checked());

        ItemResponse response = toResponse(item);
        broadcast(listId, response);
        return response;
    }

    @Transactional
    public void deleteItem(User requester, Long listId, Long itemId) {
        requireMembership(requester, listId);

        ListItem item = itemRepository.findById(itemId)
                .filter(i -> i.getList().getId().equals(listId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item not found"));

        itemRepository.delete(item);
        messagingTemplate.convertAndSend("/topic/lists/" + listId, new ItemDeletedEvent(itemId));
    }

    @Transactional
    public void deleteList(User requester, Long listId) {
        GroceryList list = listRepository.findById(listId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "List not found"));

        if (!list.getOwner().getId().equals(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the list owner can delete this list");
        }

        itemRepository.deleteByListId(listId);
        memberRepository.deleteByListId(listId);
        listRepository.delete(list);

        messagingTemplate.convertAndSend("/topic/lists/" + listId, new ListDeletedEvent(listId));
    }

    @Transactional
    public void deleteAllDataForUser(User user) {
        List<GroceryList> ownedLists = listRepository.findByOwnerId(user.getId());
        for (GroceryList list : ownedLists) {
            itemRepository.deleteByListId(list.getId());
            memberRepository.deleteByListId(list.getId());
            messagingTemplate.convertAndSend("/topic/lists/" + list.getId(), new ListDeletedEvent(list.getId()));
        }
        listRepository.deleteAll(ownedLists);

        memberRepository.deleteAll(memberRepository.findByUserId(user.getId()));
    }

    private GroceryList requireMembership(User user, Long listId) {
        ListMember membership = memberRepository.findByListIdAndUserIdAndStatus(listId, user.getId(), MembershipStatus.ACCEPTED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a member of this list"));
        return membership.getList();
    }

    private void broadcast(Long listId, ItemResponse item) {
        messagingTemplate.convertAndSend("/topic/lists/" + listId, item);
    }

    private ListResponse toResponse(GroceryList list) {
        return new ListResponse(list.getId(), list.getName(), list.getOwner().getId(), list.getCreatedAt());
    }

    private ItemResponse toResponse(ListItem item) {
        return new ItemResponse(item.getId(), item.getList().getId(), item.getName(),
                item.getCategory(), item.isChecked(), item.getCreatedAt());
    }

    public record ItemDeletedEvent(Long itemId) {}
    public record ListDeletedEvent(Long listId) {}
    public record MemberJoinedEvent(Long listId, Long userId) {}
}
