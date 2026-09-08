import React, { useState } from "react";
import { Product, ProductVariant } from "../../types";
import { X, Heart, Star, Check, ShoppingBag, ArrowRight, ShieldCheck, Truck, RefreshCw, Gift } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import { BRAND_CONFIG } from "../../config/brand";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onNavigateToProduct: (slug: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onNavigateToProduct,
}) => {
  if (!product) return null;

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const isFav = isFavorite(product.id);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [giftWrap, setGiftWrap] = useState(false);

  const currentPrice = product.promotionalPrice ?? product.price;
  const hasDiscount = !!product.promotionalPrice && product.promotionalPrice < product.price;
  const pixPrice = currentPrice * (1 - BRAND_CONFIG.pixDiscountPercentage / 100);
  const installmentCount = BRAND_CONFIG.maxInstallmentsWithoutInterest || 10;
  const installmentValue = currentPrice / installmentCount;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant, { wrap: giftWrap });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
          {/* Gallery side */}
          <div className="p-6 bg-stone-50 flex flex-col items-center justify-between gap-4">
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-white border border-stone-200">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {product.images.length > 1 && (
              <div className="flex gap-2 justify-center overflow-x-auto max-w-full pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      activeImageIndex === i
                        ? "border-stone-900 ring-2 ring-stone-900/20"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details side */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            <div>
              {/* Category & SKU */}
              <div className="flex items-center justify-between text-xs text-stone-700 mb-2">
                <span className="font-medium">{product.categoryName}</span>
                <span className="font-mono">SKU: {product.sku}</span>
              </div>

              {/* Title */}
              <h2 className="text-xl sm:text-2xl font-bold text-stone-950 mb-2 leading-snug">
                {product.name}
              </h2>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2 mb-4 text-xs">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-stone-800">{product.rating.toFixed(1)}</span>
                  <span className="text-stone-600">({product.reviewCount} avaliações reais)</span>
                </div>
              )}

              {/* Price */}
              <div className="p-4 bg-stone-50 rounded-xl mb-5 border border-stone-100">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-black text-stone-950">
                    R$ {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-stone-600 line-through">
                      R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-emerald-700 font-semibold">
                  R$ {pixPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no Pix ({BRAND_CONFIG.pixDiscountPercentage}% de desconto)
                </p>
                <p className="text-xs text-stone-600">
                  ou até {installmentCount}x de R${" "}
                  {installmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros no cartão
                </p>
              </div>

              {/* Short description */}
              <p className="text-xs sm:text-sm text-stone-600 mb-5 leading-relaxed">
                {product.shortDescription}
              </p>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-stone-800 mb-2">
                    Opção: <span className="font-normal text-stone-600">{selectedVariant?.name}</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition-all ${
                          selectedVariant?.id === v.id
                            ? "border-stone-950 bg-stone-950 text-white"
                            : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
                        }`}
                      >
                        {v.colorHex && (
                          <span
                            className="w-3 h-3 rounded-full border border-white/40"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        <span>{v.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Gift Kit items */}
              {product.isKit && product.kitItems && (
                <div className="mb-5 p-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 mb-2">
                    <Gift className="w-4 h-4 text-amber-700" />
                    <span>Itens Inclusos neste Kit:</span>
                  </div>
                  <ul className="text-xs text-stone-700 space-y-1 pl-4 list-disc">
                    {product.kitItems.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100"
                  >
                    -
                  </button>
                  <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="w-9 h-9 flex items-center justify-center text-stone-600 hover:bg-stone-100"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium">
                  <Check className="w-3.5 h-3.5" /> Em estoque ({product.stock} unidades disponíveis)
                </span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div>
              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar ao Carrinho</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleFavorite(product)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                    isFav
                      ? "bg-rose-50 text-rose-600 border-rose-200"
                      : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                  }`}
                  title="Salvar nos Favoritos"
                >
                  <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToProduct(product.slug);
                }}
                className="w-full text-center text-xs text-stone-600 hover:text-stone-900 font-medium flex items-center justify-center gap-1 py-1"
              >
                <span>Ver todos os detalhes, especificações e frete</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
