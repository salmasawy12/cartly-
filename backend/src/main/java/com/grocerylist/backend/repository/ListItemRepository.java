package com.grocerylist.backend.repository;

import com.grocerylist.backend.entity.ListItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ListItemRepository extends JpaRepository<ListItem, Long> {
    List<ListItem> findByListIdOrderByCreatedAtAsc(Long listId);
    void deleteByListId(Long listId);
}
