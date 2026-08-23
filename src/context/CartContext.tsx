import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { CartItem, CartVariantSelection, Coupon, Product, ProductVariant, ShippingOption } from "../types";
import { BRAND_CONFIG } from "../config/brand";
import { useToast } from "./ToastContext";
import { validateCoupon as apiValidateCoupon } from "../services/api";

export interface AddToCartCustomizationOptions {
  wrap?: boolean;
  message?: string;
  cor?: string | null;
  textoCurto?: string | null;
  natureza?: "licenciado" | "personalizavel";
  precoUnitario?: number;
  variacaoSelecionada?: CartVariantSelection | null;
  requerArquivo?: boolean;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingPrice: number;
  total: number;
  pixDiscountAmount: number;
  pixSubtotal: number;
  hasPersonalizavelItems: boolean;
  appliedCoupon: Coupon | null;
  selectedShipping: ShippingOption | null;
  giftWrapIncluded: boolean;
  giftCardMessage: string;
  isCartDrawerOpen: boolean;
  freeShippingThreshold: number;
  freeShippingProgress: number; // 0 to 100
  amountNeededForFreeShipping: number;
  addToCart: (
    product: Product,
    quantity?: number,
    variant?: ProductVariant,
    customizationOptions?: AddToCartCustomizationOptions
  ) => void;
  removeFromCart: (cartLineIdOrProductId: string, variantId?: string) => void;
  updateQuantity: (cartLineIdOrProductId: string, quantity: number, variantId?: string) => void;
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

const CART_STORAGE_KEY = "glos_user_cart_items";
const LEGACY_CART_STORAGE_KEY = "ndm_user_cart_items";
const GIFT_WRAP_PRICE = 14.9; // Valor da embalagem de presente especial

/**
 * Utilitário determinístico para gerar a chave única da linha de carrinho.
 * Se dois itens forem do mesmo produto, mas com personalização diferente,
 * seus IDs serão diferentes (linhas separadas).
 */
export function generateCartLineId(
  productId: string,
  variantId?: string | null,
  cor?: string | null,
  textoCurto?: string | null
): string {
  const normVar = variantId ? variantId.trim() : "base";
  const normCor = cor ? cor.trim().toLowerCase() : "none";
  const normTexto = textoCurto ? textoCurto.trim().toLowerCase() : "none";
  return `${productId}__${normVar}__${normCor}__${normTexto}`;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem(LEGACY_CART_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      // Normalizar itens salvos para garantir a estrutura canônica
      return parsed.map((item: any) => {
        const product: Product = item.product || {
          id: item.productId,
          name: item.nome || "Presente Glos",
          price: item.precoUnitario || 0,
          images: item.imagem ? [item.imagem] : [],
          stock: 50,
          sku: item.sku || `GLOS-${item.productId}`,
        };

        const natureza: "licenciado" | "personalizavel" =
          item.natureza || (product.productType === "licenciado" ? "licenciado" : "personalizavel");
        const requerArquivo = item.requerArquivo ?? (natureza === "personalizavel");
        const precoUnitario = item.precoUnitario ?? (product.promotionalPrice ?? product.price);
        const cor = item.cor ?? item.selectedVariant?.colorHex ?? null;
        const textoCurto = item.textoCurto ?? item.customGiftMessage ?? null;

        const cartLineId =
          item.cartLineId ||
          generateCartLineId(
            product.id,
            item.variacaoSelecionada?.id || item.selectedVariant?.id,
            cor,
            textoCurto
          );

        return {
          cartLineId,
          productId: product.id,
          nome: item.nome || product.name,
          imagem: item.imagem || product.images?.[0] || "",
          precoUnitario,
          quantidade: item.quantidade ?? item.quantity ?? 1,
          quantity: item.quantidade ?? item.quantity ?? 1,
          natureza,
          variacaoSelecionada: item.variacaoSelecionada || (item.selectedVariant ? {
            id: item.selectedVariant.id,
            nome: item.selectedVariant.name,
            cor: item.selectedVariant.colorHex || null,
            priceModifier: item.selectedVariant.priceModifier || 0,
          } : null),
          cor,
          textoCurto,
          requerArquivo,
          product,
          selectedVariant: item.selectedVariant,
          customGiftMessage: item.customGiftMessage,
          includeGiftWrap: item.includeGiftWrap ?? false,
        };
      });
    } catch (e) {
      console.warn("Falha ao carregar carrinho local:", e);
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [giftWrapIncluded, setGiftWrapIncluded] = useState<boolean>(false);
  const [giftCardMessage, setGiftCardMessage] = useState<string>("");
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Sincronizar com localStorage sempre que os itens mudarem
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Erro ao salvar carrinho no localStorage:", e);
    }
  }, [items]);

  // Contagem total de peças no carrinho
  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantidade || 0), 0);
  }, [items]);

  // Subtotal exato (usando o preço unitário canônico gravado no momento da adição)
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      const price = item.precoUnitario ?? (item.product?.promotionalPrice ?? item.product?.price ?? 0);
      return acc + price * (item.quantidade || 1);
    }, 0);
  }, [items]);

  // Verifica se o carrinho possui ao menos 1 item personalizável
  const hasPersonalizavelItems = useMemo(() => {
    return items.some(
      (item) => item.natureza === "personalizavel" || item.requerArquivo === true
    );
  }, [items]);

  // Desconto Pix estimado (ex.: 5%)
  const pixDiscountAmount = useMemo(() => {
    return (subtotal * (BRAND_CONFIG.pixDiscountPercentage || 5)) / 100;
  }, [subtotal]);

  const pixSubtotal = useMemo(() => {
    return Math.max(0, subtotal - pixDiscountAmount);
  }, [subtotal, pixDiscountAmount]);

  const freeShippingThreshold = BRAND_CONFIG.freeShippingThreshold || 299;
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

  /**
   * Adiciona um item ao carrinho preservando fielmente a natureza, variações e textos.
   */
  const addToCart = useCallback(
    (
      product: Product,
      quantity = 1,
      variant?: ProductVariant,
      customizationOptions?: AddToCartCustomizationOptions
    ) => {
      // 1. Determinar natureza do produto
      const isPersonalizavel =
        customizationOptions?.natureza === "personalizavel" ||
        product.productType === "personalizavel" ||
        Boolean(
          product.customizationOptions?.allowName ||
          product.customizationOptions?.allowPhoto ||
          product.customizationOptions?.allowMessage ||
          product.isKit ||
          product.category === "kits-presenteaveis" ||
          product.name.toLowerCase().includes("personaliz") ||
          product.name.toLowerCase().includes("foto") ||
          customizationOptions?.textoCurto
        );

      const natureza: "licenciado" | "personalizavel" = isPersonalizavel ? "personalizavel" : "licenciado";
      const requerArquivo = customizationOptions?.requerArquivo ?? (natureza === "personalizavel");

      // 2. Variação e cores
      const targetVariant = variant || (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
      const variacaoSelecionada: CartVariantSelection | null = targetVariant
        ? {
            id: targetVariant.id,
            nome: targetVariant.name,
            cor: targetVariant.colorHex || customizationOptions?.cor || null,
            priceModifier: targetVariant.priceModifier || 0,
          }
        : customizationOptions?.variacaoSelecionada || null;

      const cor = customizationOptions?.cor || targetVariant?.colorHex || null;
      const textoCurto = customizationOptions?.textoCurto || null;

      // 3. Preço Unitário com modificadores
      const priceModifier = variacaoSelecionada?.priceModifier || targetVariant?.priceModifier || 0;
      const baseProductPrice = product.promotionalPrice ?? product.price;
      const precoUnitario = customizationOptions?.precoUnitario ?? (baseProductPrice + priceModifier);

      // 4. Imagem do item
      const imagem = targetVariant?.image || product.images?.[0] || "";

      // 5. Geração do ID exclusivo da linha
      const cartLineId = generateCartLineId(
        product.id,
        variacaoSelecionada?.id,
        cor,
        textoCurto
      );

      setItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.cartLineId === cartLineId);

        if (existingIndex > -1) {
          const updated = [...prev];
          const existingItem = updated[existingIndex];
          const newQty = Math.min(product.stock || 50, (existingItem.quantidade || 0) + quantity);
          updated[existingIndex] = {
            ...existingItem,
            quantidade: newQty,
            quantity: newQty,
            precoUnitario, // atualiza com o preço mais recente
            includeGiftWrap: customizationOptions?.wrap ?? existingItem.includeGiftWrap,
            customGiftMessage: customizationOptions?.message ?? existingItem.customGiftMessage,
          };
          return updated;
        } else {
          const qty = Math.min(product.stock || 50, quantity);
          const newItem: CartItem = {
            cartLineId,
            productId: product.id,
            nome: product.name,
            imagem,
            precoUnitario,
            quantidade: qty,
            quantity: qty,
            natureza,
            variacaoSelecionada,
            cor,
            textoCurto,
            requerArquivo,
            product,
            selectedVariant: targetVariant,
            includeGiftWrap: customizationOptions?.wrap ?? false,
            customGiftMessage: customizationOptions?.message ?? "",
          };
          return [...prev, newItem];
        }
      });

      showToast(`"${product.name}" adicionado ao carrinho!`, "success");
    },
    [showToast]
  );

  /**
   * Remove item pelo ID exclusivo da linha (ou productId por fallback)
   */
  const removeFromCart = useCallback(
    (cartLineIdOrProductId: string, variantId?: string) => {
      setItems((prev) =>
        prev.filter((item) => {
          if (item.cartLineId === cartLineIdOrProductId) return false;
          if (item.productId === cartLineIdOrProductId) {
            if (variantId && (item.variacaoSelecionada?.id === variantId || item.selectedVariant?.id === variantId)) {
              return false;
            }
            if (!variantId) return false;
          }
          return true;
        })
      );
      showToast("Item removido do carrinho.", "info");
    },
    [showToast]
  );

  /**
   * Atualiza a quantidade de uma linha do carrinho
   */
  const updateQuantity = useCallback(
    (cartLineIdOrProductId: string, quantity: number, variantId?: string) => {
      if (quantity <= 0) {
        removeFromCart(cartLineIdOrProductId, variantId);
        return;
      }

      setItems((prev) =>
        prev.map((item) => {
          const isMatch =
            item.cartLineId === cartLineIdOrProductId ||
            (item.productId === cartLineIdOrProductId &&
              (!variantId || item.variacaoSelecionada?.id === variantId || item.selectedVariant?.id === variantId));

          if (isMatch) {
            const maxStock = item.product?.stock || 50;
            const cappedQty = Math.min(maxStock, quantity);
            return { ...item, quantidade: cappedQty };
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
    showToast("Carrinho esvaziado.", "info");
  }, [showToast]);

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
        pixDiscountAmount,
        pixSubtotal,
        hasPersonalizavelItems,
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
