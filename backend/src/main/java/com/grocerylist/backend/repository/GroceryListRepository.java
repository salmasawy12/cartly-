package com.grocerylist.backend.repository;

import com.grocerylist.backend.entity.GroceryList;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroceryListRepository extends JpaRepository<GroceryList, Long> {
}
