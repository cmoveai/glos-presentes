import React from "react";
import { Product, ProductVariant } from "../../types";
import { Heart, ShoppingBag, Eye, Star, Gift } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import { BRAND_CONFIG } from "../../config/brand";

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onNavigateToProduct: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onNavigateToProduct,
}) => {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const isFav = isFavorite(product.id);
  const currentPrice = product.promotionalPrice ?? product.price;
  const hasDiscount = !!product.promotionalPrice && product.promotionalPrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - (product.promotionalPrice || 0)) / product.price) * 100)
    : 0;

  const pixPrice = currentPrice * (1 - BRAND_CONFIG.pixDiscountPercentage / 100);
  const installmentValue = currentPrice / (product.installments || 1);

  const [selectedVariant, setSelectedVariant] = React.useState<ProductVariant | undefined>(
    product.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );

  return (
    <div
      id={`product-card-${product.id}`}
      className="group relative flex flex-col bg-white rounded-2xl border border-stone-200/80 hover:border-stone-400/80 transition-all duration-300 hover:shadow-md overflow-hidden"
    >
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-stone-100/70">
        <button
          type="button"
          onClick={() => onNavigateToProduct(product.slug)}
          className="w-full h-full text-left focus:outline-none"
        >
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />
        </button>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {hasDiscount && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white shadow-sm">
              -{discountPercentage}%
            </span>
          )}
          {product.isKit && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-stone-900 text-amber-300 shadow-sm">
              <Gift className="w-3 h-3" /> Kit Presente
            </span>
          )}
          {product.bestseller && !hasDiscount && !product.isKit && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-900 text-white shadow-sm">
              Mais Vendido
            </span>
          )}
          {product.new && !product.bestseller && !hasDiscount && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-700 text-white shadow-sm">
              Novidade
            </span>
          )}
        </div>

        {/* Action Buttons Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {/* Wishlist Button */}
          <button
            id={`fav-btn-${product.id}`}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(product);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
              isFav
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : "bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200/60"
            }`}
            title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
          </button>

          {/* Quick View Button */}
          {onQuickView && (
            <button
              id={`quick-view-btn-${product.id}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-900 border border-stone-200/60 flex items-center justify-center transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100 sm:translate-x-2 group-hover:translate-x-0"
              title="Espiar produto"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Product Details Info */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-stone-700 mb-1.5">
            <span className="font-medium tracking-wide">{product.categoryName}</span>
            {product.rating && (
              <span className="flex items-center gap-1 text-stone-700">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{product.rating.toFixed(1)}</span>
                {product.reviewCount && <span className="text-stone-600">({product.reviewCount})</span>}
              </span>
            )}
          </div>

          {/* Product Title */}
          <button
            type="button"
            onClick={() => onNavigateToProduct(product.slug)}
            className="text-left font-semibold text-stone-900 hover:text-stone-600 line-clamp-2 text-sm sm:text-base leading-snug transition-colors mb-2"
          >
            {product.name}
          </button>

          {/* Color/Variant Preview Dots */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex items-center gap-1.5 mb-3">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariant(v);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                    selectedVariant?.id === v.id
                      ? "ring-2 ring-stone-900 ring-offset-1 scale-110"
                      : "border-stone-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: v.colorHex || "#9ca3af" }}
                  title={v.name}
                />
              ))}
              <span className="text-[11px] text-stone-600 ml-1">
                {product.variants.length} opções
              </span>
            </div>
          )}
        </div>

        {/* Price & Action Area */}
        <div className="pt-2 border-t border-stone-100 mt-2">
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-stone-950">
                R$ {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
              {hasDiscount && (
                <span className="text-xs text-stone-600 line-through">
                  R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            <p className="text-xs text-emerald-700 font-medium">
              R$ {pixPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no Pix ({BRAND_CONFIG.pixDiscountPercentage}% OFF)
            </p>

            <p className="text-[11px] text-stone-600">
              ou {product.installments}x de R${" "}
              {installmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id={`add-cart-${product.id}`}
              type="button"
              onClick={() => addToCart(product, 1, selectedVariant)}
              className="w-full py-2 px-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Adicionar</span>
            </button>

            <button
              id={`buy-now-${product.id}`}
              type="button"
              onClick={() => {
                addToCart(product, 1, selectedVariant);
              }}
              className="w-full py-2 px-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center transition-colors"
            >
              Comprar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
