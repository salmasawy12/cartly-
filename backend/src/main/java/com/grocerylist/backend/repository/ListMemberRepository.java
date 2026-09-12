package com.grocerylist.backend.repository;

import com.grocerylist.backend.entity.ListMember;
import com.grocerylist.backend.entity.MembershipStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListMemberRepository extends JpaRepository<ListMember, Long> {
    List<ListMember> findByUserId(Long userId);
    List<ListMember> findByUserIdAndStatus(Long userId, MembershipStatus status);
    List<ListMember> findByListId(Long listId);
    Optional<ListMember> findByListIdAndUserId(Long listId, Long userId);
    Optional<ListMember> findByListIdAndUserIdAndStatus(Long listId, Long userId, MembershipStatus status);
    boolean existsByListIdAndUserId(Long listId, Long userId);
    void deleteByListId(Long listId);
}
