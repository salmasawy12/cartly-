package com.grocerylist.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/**
 * Join entity granting a user access to a shared list (owner is also given a row here).
 */
@Entity
@Table(name = "list_members", uniqueConstraints = @UniqueConstraint(columnNames = {"list_id", "user_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "list_id", nullable = false)
    private GroceryList list;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder.Default
    @Column(nullable = false)
    private Instant joinedAt = Instant.now();

    // columnDefinition gives ddl-auto=update a DB-level default, so adding this NOT NULL
    // column to a table that already has rows (from before this field existed) doesn't fail.
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'ACCEPTED'")
    private MembershipStatus status = MembershipStatus.ACCEPTED;
}
