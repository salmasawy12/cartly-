package com.grocerylist.backend.repository;

import com.grocerylist.backend.entity.GroceryList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroceryListRepository extends JpaRepository<GroceryList, Long> {
    List<GroceryList> findByOwnerId(Long ownerId);
}
