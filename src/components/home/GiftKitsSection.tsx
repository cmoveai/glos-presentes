import React, { useState } from "react";
import { PRODUCTS } from "../../data/products";
import { Product } from "../../types";
import { Gift, Package, Check, ShoppingBag, Eye, Heart, Sparkles } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import { BRAND_CONFIG } from "../../config/brand";

interface GiftKitsSectionProps {
  onNavigateProduct: (slug: string) => void;
  onQuickView: (product: Product) => void;
}

export const GiftKitsSection: React.FC<GiftKitsSectionProps> = ({
  onNavigateProduct,
  onQuickView,
}) => {
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const kits = PRODUCTS.filter((p) => p.isKit || p.category === "kits-presenteaveis").slice(0, 3);
  const [activeTab, setActiveTab] = useState<string>(kits[0]?.id || "");

  const activeKit = kits.find((k) => k.id === activeTab) || kits[0];

  if (!activeKit) return null;

  const currentPrice = activeKit.promotionalPrice ?? activeKit.price;
  const isFav = isFavorite(activeKit.id);

  return (
    <section className="py-14 bg-gradient-to-b from-stone-900 to-stone-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
            <Gift className="w-3.5 h-3.5" />
            <span>Prontos para Surpreender</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Kits Especiais para Presentear
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-2">
            Composições selecionadas em caixas rígidas de luxo, berço sob medida e cartão com dedicatória personalizada.
          </p>
        </div>

        {/* Kit Selector Tabs */}
        <div className="flex justify-center gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {kits.map((kit) => (
            <button
              key={kit.id}
              onClick={() => setActiveTab(kit.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeKit.id === kit.id
                  ? "bg-white text-stone-950 shadow-lg scale-102"
                  : "bg-white/10 text-stone-300 hover:bg-white/20"
              }`}
            >
              {kit.name.split(":")[0]}
            </button>
          ))}
        </div>

        {/* Featured Kit Card Container */}
        <div className="bg-stone-800/80 rounded-3xl border border-stone-700/80 overflow-hidden shadow-2xl p-6 sm:p-8 lg:p-10 backdrop-blur-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Main Image */}
            <div className="lg:col-span-5 relative">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-stone-900 border border-stone-700">
                <img
                  src={activeKit.images[0]}
                  alt={activeKit.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => toggleFavorite(activeKit)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                    isFav
                      ? "bg-rose-500 text-white"
                      : "bg-stone-950/60 text-white hover:bg-stone-950"
                  }`}
                  title="Favoritar kit"
                >
                  <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                </button>
                <button
                  onClick={() => onQuickView(activeKit)}
                  className="w-9 h-9 rounded-full bg-stone-950/60 text-white hover:bg-stone-950 flex items-center justify-center backdrop-blur-md"
                  title="Espiar produto"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right: Detailed Kit Information */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  {activeKit.categoryName}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 leading-snug">
                  {activeKit.name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
                  {activeKit.shortDescription}
                </p>
              </div>

              {/* Items included */}
              {activeKit.kitItems && (
                <div className="p-4 bg-stone-900/80 rounded-2xl border border-stone-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>O que vem na caixa:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-200">
                    {activeKit.kitItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Packaging info & Card message banner */}
              <div className="flex flex-wrap gap-4 text-xs text-stone-300">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{activeKit.kitPackaging || "Caixa rígida com laço de cetim incluso"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Cartão com dedicatória personalizada grátis</span>
                </div>
              </div>

              {/* Price & CTA */}
              <div className="pt-3 border-t border-stone-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      R$ {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    {activeKit.promotionalPrice && (
                      <span className="text-xs text-stone-400 line-through">
                        R$ {activeKit.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400">
                    ou até {BRAND_CONFIG.maxInstallmentsWithoutInterest}x de R${" "}
                    {(currentPrice / (BRAND_CONFIG.maxInstallmentsWithoutInterest || 10)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => addToCart(activeKit, 1, undefined, { wrap: true })}
                    className="px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Adicionar Kit ao Carrinho</span>
                  </button>

                  <button
                    onClick={() => onNavigateProduct(activeKit.slug)}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
                  >
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
