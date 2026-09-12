package com.grocerylist.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "list_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "list_id", nullable = false)
    private GroceryList list;

    @Column(nullable = false)
    private String name;

    private String category;

    @Builder.Default
    @Column(nullable = false)
    private boolean checked = false;

    @Builder.Default
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
