import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { CartItem, Coupon, Product, ProductVariant, ShippingOption } from "../types";
import { BRAND_CONFIG } from "../config/brand";
import { useToast } from "./ToastContext";
import { validateCoupon as apiValidateCoupon } from "../services/api";

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingPrice: number;
  total: number;
  appliedCoupon: Coupon | null;
  selectedShipping: ShippingOption | null;
  giftWrapIncluded: boolean;
  giftCardMessage: string;
  isCartDrawerOpen: boolean;
  freeShippingThreshold: number;
  freeShippingProgress: number; // 0 to 100
  amountNeededForFreeShipping: number;
  addToCart: (product: Product, quantity?: number, variant?: ProductVariant, giftOptions?: { wrap?: boolean; message?: string }) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setSelectedShipping: (option: ShippingOption | null) => void;
  setGiftWrapIncluded: (included: boolean) => void;
  setGiftCardMessage: (msg: string) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "ndm_user_cart_items";
const GIFT_WRAP_PRICE = 14.9; // Valor da embalagem especial de presente

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [giftWrapIncluded, setGiftWrapIncluded] = useState<boolean>(false);
  const [giftCardMessage, setGiftCardMessage] = useState<string>("");
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Erro ao salvar carrinho:", e);
    }
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const itemPrice = item.product.promotionalPrice ?? item.product.price;
      return acc + itemPrice * item.quantity;
    }, 0);
  }, [items]);

  const freeShippingThreshold = BRAND_CONFIG.freeShippingThreshold;
  const freeShippingProgress = useMemo(() => {
    if (subtotal >= freeShippingThreshold) return 100;
    return Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  }, [subtotal, freeShippingThreshold]);

  const amountNeededForFreeShipping = useMemo(() => {
    return Math.max(0, freeShippingThreshold - subtotal);
  }, [subtotal, freeShippingThreshold]);

  const discount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountPercent) {
      return (subtotal * appliedCoupon.discountPercent) / 100;
    }
    if (appliedCoupon.discountValue) {
      return Math.min(subtotal, appliedCoupon.discountValue);
    }
    return 0;
  }, [appliedCoupon, subtotal]);

  const shippingPrice = useMemo(() => {
    if (!selectedShipping) {
      // Default to 0 if eligible for free shipping
      return subtotal >= freeShippingThreshold ? 0 : 0;
    }
    if (subtotal >= freeShippingThreshold && selectedShipping.id === "pac") {
      return 0;
    }
    return selectedShipping.price;
  }, [selectedShipping, subtotal, freeShippingThreshold]);

  const giftWrapCost = giftWrapIncluded ? GIFT_WRAP_PRICE : 0;

  const total = useMemo(() => {
    const rawTotal = subtotal - discount + shippingPrice + giftWrapCost;
    return Math.max(0, rawTotal);
  }, [subtotal, discount, shippingPrice, giftWrapCost]);

  const addToCart = useCallback(
    (
      product: Product,
      quantity = 1,
      variant?: ProductVariant,
      giftOptions?: { wrap?: boolean; message?: string }
    ) => {
      const variantId = variant?.id;
      const targetVariant = variant || (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);

      setItems((prev) => {
        const existingIndex = prev.findIndex(
          (item) => item.product.id === product.id && item.selectedVariant?.id === (variantId || targetVariant?.id)
        );

        if (existingIndex > -1) {
          const updated = [...prev];
          const newQty = Math.min(product.stock, updated[existingIndex].quantity + quantity);
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: newQty,
            includeGiftWrap: giftOptions?.wrap ?? updated[existingIndex].includeGiftWrap,
            customGiftMessage: giftOptions?.message ?? updated[existingIndex].customGiftMessage,
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              product,
              quantity,
              selectedVariant: targetVariant,
              includeGiftWrap: giftOptions?.wrap ?? false,
              customGiftMessage: giftOptions?.message ?? "",
            },
          ];
        }
      });

      showToast(`"${product.name}" adicionado ao carrinho!`, "success");
      setIsCartDrawerOpen(true);
    },
    [showToast]
  );

  const removeFromCart = useCallback(
    (productId: string, variantId?: string) => {
      setItems((prev) =>
        prev.filter((item) => {
          if (item.product.id !== productId) return true;
          if (variantId && item.selectedVariant?.id !== variantId) return true;
          return false;
        })
      );
      showToast("Item removido do carrinho.", "info");
    },
    [showToast]
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string) => {
      if (quantity <= 0) {
        removeFromCart(productId, variantId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          const isMatch =
            item.product.id === productId &&
            (!variantId || item.selectedVariant?.id === variantId);
          if (isMatch) {
            const cappedQty = Math.min(item.product.stock, quantity);
            return { ...item, quantity: cappedQty };
          }
          return item;
        })
      );
    },
    [removeFromCart]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
    setSelectedShipping(null);
    setGiftWrapIncluded(false);
    setGiftCardMessage("");
  }, []);

  const applyCoupon = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        const result = await apiValidateCoupon(code, subtotal);
        if (result.valid) {
          setAppliedCoupon({
            code: result.code,
            description: result.description,
            discountValue: result.discountAmount,
          });
          showToast(`Cupom "${result.code}" aplicado com sucesso!`, "success");
          return true;
        }
        return false;
      } catch (err: any) {
        showToast(err.message || "Erro ao aplicar cupom", "error");
        return false;
      }
    },
    [subtotal, showToast]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    showToast("Cupom removido.", "info");
  }, [showToast]);

  const openCart = useCallback(() => setIsCartDrawerOpen(true), []);
  const closeCart = useCallback(() => setIsCartDrawerOpen(false), []);
  const toggleCart = useCallback(() => setIsCartDrawerOpen((p) => !p), []);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount,
        shippingPrice,
        total,
        appliedCoupon,
        selectedShipping,
        giftWrapIncluded,
        giftCardMessage,
        isCartDrawerOpen,
        freeShippingThreshold,
        freeShippingProgress,
        amountNeededForFreeShipping,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        setSelectedShipping,
        setGiftWrapIncluded,
        setGiftCardMessage,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
