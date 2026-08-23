import React, { useState } from "react";
import { useCart } from "../../context/CartContext";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Gift, Truck, Tag, Check, Sparkles } from "lucide-react";
import { BRAND_CONFIG } from "../../config/brand";
import { PRODUCTS } from "../../data/products";
import { UpsellSection } from "./UpsellSection";

interface CartDrawerProps {
  onNavigateToCheckout: () => void;
  onNavigateToCart: () => void;
  onNavigateToCatalog: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onNavigateToCheckout,
  onNavigateToCart,
  onNavigateToCatalog,
}) => {
  const {
    items,
    itemCount,
    subtotal,
    discount,
    total,
    isCartDrawerOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    freeShippingThreshold,
    freeShippingProgress,
    amountNeededForFreeShipping,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    giftWrapIncluded,
    setGiftWrapIncluded,
    giftCardMessage,
    setGiftCardMessage,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showGiftMessageInput, setShowGiftMessageInput] = useState(false);

  if (!isCartDrawerOpen) return null;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    await applyCoupon(couponInput.trim());
    setIsApplyingCoupon(false);
    setCouponInput("");
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stone-900" />
              <h2 className="text-lg font-bold text-stone-950">Seu Carrinho</h2>
              <span className="bg-stone-900 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                {itemCount} {itemCount === 1 ? "item" : "itens"}
              </span>
            </div>
            <button
              onClick={closeCart}
              className="w-8 h-8 rounded-full hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="p-4 bg-stone-100/70 border-b border-stone-200">
            <div className="flex items-center justify-between text-xs font-medium mb-1.5">
              <div className="flex items-center gap-1.5 text-stone-800">
                <Truck className="w-4 h-4 text-emerald-700" />
                {amountNeededForFreeShipping === 0 ? (
                  <span className="font-semibold text-emerald-800">
                    Parabéns! Você ganhou <strong className="text-emerald-900">Frete Grátis</strong>
                  </span>
                ) : (
                  <span>
                    Faltam <strong>R$ {amountNeededForFreeShipping.toFixed(2)}</strong> para Frete Grátis
                  </span>
                )}
              </div>
              <span className="text-stone-700 font-semibold">{freeShippingProgress}%</span>
            </div>
            <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${freeShippingProgress}%` }}
              />
            </div>
          </div>

          {/* Items Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-600">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4 text-stone-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-stone-900 mb-1">Seu carrinho está vazio</h3>
                <p className="text-xs text-stone-600 max-w-xs mb-6">
                  Explore nossa curadoria de presentes e encontre peças únicas para você ou para presentear.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    onNavigateToCatalog();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-stone-950 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              <>
                {items.map((item) => {
                  const itemPrice = item.precoUnitario ?? (item.product?.promotionalPrice ?? item.product?.price ?? 0);
                  const isPersonalizavel = item.natureza === "personalizavel" || item.requerArquivo === true;
                  return (
                    <div
                      key={item.cartLineId}
                      className="flex gap-3 p-3 bg-stone-50/80 rounded-xl border border-stone-200/80 relative group"
                    >
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-white shrink-0 border border-stone-200">
                        <img
                          src={item.imagem || item.product?.images?.[0]}
                          alt={item.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            {isPersonalizavel ? (
                              <span className="text-[10px] font-medium text-[#004AAD] bg-[#004AAD]/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                Personalizável
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                Pronto
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-stone-950 line-clamp-1">
                            {item.nome}
                          </h4>
                          {item.variacaoSelecionada && (
                            <p className="text-[11px] text-stone-600 mt-0.5">
                              Opção: {item.variacaoSelecionada.nome}
                            </p>
                          )}
                          {item.textoCurto && (
                            <p className="text-[10px] text-stone-700 italic truncate">
                              “{item.textoCurto}”
                            </p>
                          )}
                          <div className="mt-1 font-bold text-xs sm:text-sm text-stone-950">
                            R$ {itemPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-200/60">
                          <div className="flex items-center border border-stone-300 rounded-lg bg-white overflow-hidden">
                            <button
                              onClick={() =>
                                updateQuantity(item.cartLineId, item.quantidade - 1)
                              }
                              className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-xs"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-7 text-center text-xs font-semibold">{item.quantidade}</span>
                            <button
                              onClick={() =>
                                updateQuantity(item.cartLineId, item.quantidade + 1)
                              }
                              className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.cartLineId)}
                            className="text-stone-600 hover:text-red-600 transition-colors p-1"
                            title="Remover item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Gift Option Box */}
                <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={giftWrapIncluded}
                        onChange={(e) => setGiftWrapIncluded(e.target.checked)}
                        className="rounded border-amber-400 text-stone-900 focus:ring-stone-900"
                      />
                      <span className="text-xs font-medium text-amber-950 flex items-center gap-1">
                        <Gift className="w-3.5 h-3.5 text-amber-700" />
                        Embalagem de presente premium (+R$ 14,90)
                      </span>
                    </label>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => setShowGiftMessageInput((p) => !p)}
                      className="text-[11px] text-amber-900 hover:underline font-medium flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      {showGiftMessageInput ? "Ocultar mensagem no cartão" : "+ Escrever dedicatória no cartão (Grátis)"}
                    </button>
                    {showGiftMessageInput && (
                      <textarea
                        value={giftCardMessage}
                        onChange={(e) => setGiftCardMessage(e.target.value)}
                        placeholder="Deixe uma mensagem carinhosa para ser impressa em papel nobre..."
                        rows={2}
                        className="mt-2 w-full text-xs p-2 rounded-lg border border-amber-300 bg-white placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                      />
                    )}
                  </div>
                </div>

                {/* AI Upsell Recommendations ("Compre Junto") */}
                <UpsellSection allProducts={PRODUCTS} compact={true} />

                {/* Coupon Box */}
                <div className="pt-2">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <Tag className="w-3.5 h-3.5" />
                        <span>Cupom <strong>{appliedCoupon.code}</strong> ativo</span>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-stone-600 hover:text-stone-800 underline text-xs"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="w-3.5 h-3.5 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder="Cupom (ex: BEMVINDO10)"
                          className="w-full text-xs pl-8 pr-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900 uppercase tracking-wider"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isApplyingCoupon || !couponInput.trim()}
                        className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                      >
                        {isApplyingCoupon ? "..." : "Aplicar"}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Footer & Checkout Action */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50/70 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-stone-900">
                    R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Desconto ({appliedCoupon?.code})</span>
                    <span>- R$ {discount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {giftWrapIncluded && (
                  <div className="flex justify-between">
                    <span>Embalagem Presente</span>
                    <span className="font-semibold text-stone-900">R$ 14,90</span>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-stone-950 pt-2 border-t border-stone-200">
                  <span>Total Estimado</span>
                  <span>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-1">
                <button
                  id="cart-drawer-checkout-btn"
                  onClick={() => {
                    closeCart();
                    onNavigateToCheckout();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>Finalizar Compra</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    closeCart();
                    onNavigateToCart();
                  }}
                  className="w-full py-2 text-center text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors"
                >
                  Ver carrinho completo com cálculo de frete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
