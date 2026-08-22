import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Product } from "../types";
import { PRODUCTS } from "../data/products";
import { useToast } from "./ToastContext";

interface FavoritesContextType {
  favoriteIds: string[];
  favoriteProducts: Product[];
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  favoritesCount: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = "ndm_user_favorites";

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch (e) {
      console.error("Erro ao salvar favoritos:", e);
    }
  }, [favoriteIds]);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    (product: Product) => {
      setFavoriteIds((prev) => {
        if (prev.includes(product.id)) {
          showToast(`"${product.name}" removido dos favoritos.`, "info");
          return prev.filter((id) => id !== product.id);
        } else {
          showToast(`"${product.name}" adicionado aos favoritos!`, "success");
          return [...prev, product.id];
        }
      });
    },
    [showToast]
  );

  const favoriteProducts = React.useMemo(() => {
    return PRODUCTS.filter((p) => favoriteIds.includes(p.id));
  }, [favoriteIds]);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteIds,
        favoriteProducts,
        toggleFavorite,
        isFavorite,
        favoritesCount: favoriteIds.length,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
