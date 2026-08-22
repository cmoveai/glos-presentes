import React, { useState, useEffect } from "react";
import { Sparkles, Plus, Check, Gift, ShoppingBag, ArrowRight } from "lucide-react";
import { Product, CartItem, UpsellSuggestion } from "../../types";
import { useCart } from "../../context/CartContext";

interface UpsellSectionProps {
  allProducts: Product[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export const UpsellSection: React.FC<UpsellSectionProps> = ({
  allProducts,
  title = "Compre Junto com Desconto Exclusivo",
  subtitle = "Recomendações inteligentes para completar seu pedido",
  compact = false,
}) => {
  const { items, addToCart } = useCart();
  const [suggestions, setSuggestions] = useState<UpsellSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  useEffect(() => {
    if (items.length === 0 || allProducts.length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchUpsells = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/ai/upsell-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cartItems: items,
            allProducts: allProducts.slice(0, 12),
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.suggestions && data.suggestions.length > 0) {
            setSuggestions(data.suggestions);
          }
        }
      } catch (err) {
        console.warn("Upsell fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUpsells();
  }, [items.map((i) => i.product.id).join(","), allProducts.length]);

  if (items.length === 0 || (!loading && suggestions.length === 0)) {
    return null;
  }

  const handleAddUpsell = (suggestion: UpsellSuggestion) => {
    const p = suggestion.product;
    addToCart(p, 1, undefined, undefined);
    setAddedIds((prev) => [...prev, p.id]);
    setTimeout(() => {
      setAddedIds((prev) => prev.filter((id) => id !== p.id));
    }, 2500);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  return (
    <div className={`rounded-xl border border-amber-200/90 bg-gradient-to-b from-amber-50/50 to-orange-50/30 ${compact ? "p-3 space-y-2.5" : "p-4 space-y-3"}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-stone-900 font-bold text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>{title}</span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded">
          IA Match
        </span>
      </div>

      {subtitle && !compact && (
        <p className="text-[11px] text-stone-600 -mt-1">{subtitle}</p>
      )}

      {/* List of Suggestions */}
      <div className="space-y-2">
        {suggestions.map((sug) => {
          const isAdded = addedIds.includes(sug.product.id);
          const isAlreadyInCart = items.some((i) => i.product.id === sug.product.id);

          if (isAlreadyInCart) return null;

          return (
            <div
              key={sug.product.id}
              className="bg-white/90 rounded-lg p-2.5 border border-amber-100 shadow-xs flex items-center justify-between gap-3 hover:border-amber-300 transition-colors"
            >
              {/* Product Thumbnail & Details */}
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={sug.product.images?.[0] || sug.product.thumbnail || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300"}
                  alt={sug.product.name}
                  className="w-11 h-11 rounded-md object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-1.5 py-0.2 rounded uppercase">
                      {sug.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">
                    {sug.product.name}
                  </h4>
                  <div className="flex items-baseline gap-1.5 text-[11px]">
                    <span className="font-extrabold text-stone-950 font-mono">
                      {formatCurrency(sug.specialPrice || sug.product.price)}
                    </span>
                    {sug.specialPrice && sug.specialPrice < sug.product.price && (
                      <span className="text-stone-400 line-through text-[10px] font-mono">
                        {formatCurrency(sug.product.price)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={() => handleAddUpsell(sug)}
                disabled={isAdded}
                className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isAdded
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-900 hover:bg-stone-800 text-white shadow-xs hover:scale-105"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Adicionado
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> + Adicionar
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
