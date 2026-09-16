"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export interface CartItem {
  id: string; // menuItemId
  name: string;
  price: number; // effective price
  originalPrice: number;
  imageUrl: string | null;
  quantity: number;
  cafeteriaId: string;
  cafeteriaName: string;
  preparationTimeMinutes: number;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountTotal: number;
  maxPrepTime: number;
  cafeteriaId: string | null;
  cafeteriaName: string | null;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  updateItemNotes: (id: string, notes: string) => void;
  clearCart: () => void;
  getItemQuantity: (id: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "cou_dinex_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load cart from localStorage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }, [items, isLoaded]);

  const addItem = (newItem: Omit<CartItem, "quantity">, quantity: number = 1) => {
    setItems((prev) => {
      // Check if item already exists in cart
      const existingIndex = prev.findIndex((i) => i.id === newItem.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [...prev, { ...newItem, quantity }];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const increaseQuantity = (id: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
    );
  };

  const decreaseQuantity = (id: string) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const nextQty = i.quantity - 1;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemNotes = (id: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, notes } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.error("Failed to clear cart storage", e);
    }
  };

  const getItemQuantity = (id: string) => {
    const found = items.find((i) => i.id === id);
    return found ? found.quantity : 0;
  };

  const itemCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const discountTotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const diff = item.originalPrice - item.price;
      return sum + (diff > 0 ? diff * item.quantity : 0);
    }, 0);
  }, [items]);

  const maxPrepTime = useMemo(() => {
    if (items.length === 0) return 0;
    return Math.max(...items.map((i) => i.preparationTimeMinutes || 15));
  }, [items]);

  const cafeteriaId = items.length > 0 ? items[0].cafeteriaId : null;
  const cafeteriaName = items.length > 0 ? items[0].cafeteriaName : null;

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discountTotal,
        maxPrepTime,
        cafeteriaId,
        cafeteriaName,
        addItem,
        removeItem,
        increaseQuantity,
        decreaseQuantity,
        updateItemNotes,
        clearCart,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
