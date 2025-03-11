"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  location?: string;
  cubby_location?: string;
  date_added: string;
  image_url?: string;
  barcode?: string;
  description?: string;
}

export function useInventoryFilters(inventoryItems: InventoryItem[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCubby, setSelectedCubby] = useState<string | null>(null);
  const [filteredItems, setFilteredItems] =
    useState<InventoryItem[]>(inventoryItems);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedCubby(null);
  }, []);

  // Memoized filter function to improve performance by preventing recalculation
  // when dependencies haven't changed
  const filterItems = useCallback(() => {
    let filtered = inventoryItems;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          (item.barcode && item.barcode.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query)),
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Apply cubby filter
    if (selectedCubby) {
      filtered = filtered.filter(
        (item) => item.cubby_location === selectedCubby,
      );
    }

    // Only show items with quantity > 0
    filtered = filtered.filter((item) => item.quantity > 0);

    return filtered;
  }, [searchQuery, selectedCategory, selectedCubby, inventoryItems]);

  // Memoize the filtered items to prevent recalculation on every render
  const memoizedFilteredItems = useMemo(() => filterItems(), [filterItems]);

  // Apply filters when search, category, or cubby changes with debounce for search
  useEffect(() => {
    // Debounce search to avoid filtering on every keystroke
    const debounceTimeout = setTimeout(() => {
      setFilteredItems(memoizedFilteredItems);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, selectedCategory, selectedCubby, memoizedFilteredItems]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedCubby,
    setSelectedCubby,
    filteredItems,
    setFilteredItems,
    resetFilters,
  };
}
