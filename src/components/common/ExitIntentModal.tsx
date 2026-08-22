import React, { useState, useEffect } from "react";
import { Sparkles, Gift, X, ArrowRight, Clock, ShieldCheck, Tag, Percent } from "lucide-react";
import { useCart } from "../../context/CartContext";
import { BRAND_CONFIG } from "../../config/brand";

interface ExitIntentModalProps {
  onProceedToCheckout?: () => void;
}

export const ExitIntentModal: React.FC<ExitIntentModalProps> = ({ onProceedToCheckout }) => {
  const { items, subtotal, applyCoupon, appliedCoupon } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
  const [offer, setOffer] = useState<{
    title: string;
    message: string;
    couponCode: string;
    discountPercent: number;
  }>({
    title: "Espere! Não vá embora de mãos vazias 🎁",
    message: "Preparamos um cupom especial de 5% OFF exclusivo válido agora para você concluir suas escolhas.",
    couponCode: "VOLTA5",
    discountPercent: 5,
  });

  // Track exit intent (cursor moving up towards tab close)
  useEffect(() => {
    // Only show if user has items in cart and hasn't already dismissed in this session
    if (items.length === 0) return;

    const alreadyShown = sessionStorage.getItem("exit_intent_shown_v1");
    if (alreadyShown) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 15 && items.length > 0) {
        sessionStorage.setItem("exit_intent_shown_v1", "true");
        triggerOffer();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [items.length]);

  const triggerOffer = async () => {
    try {
      const firstItem = items[0]?.product?.name || "";
      const res = await fetch("/api/ai/exit-intent-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartTotal: subtotal,
          itemCount: items.length,
          firstItemName: firstItem,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOffer(data);
      }
    } catch (err) {
      console.warn("Exit intent offer fallback:", err);
    }
    setIsOpen(true);
  };

  // 10 minutes countdown timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen || items.length === 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleClaimOffer = async () => {
    await applyCoupon(offer.couponCode);
    setIsOpen(false);
    if (onProceedToCheckout) {
      onProceedToCheckout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-stone-950/75 backdrop-blur-xs transition-opacity animate-in fade-in"
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center overflow-hidden">
        {/* Decorative Top Ribbon */}
        <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400" />

        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Sparkle */}
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shadow-inner relative">
          <Gift className="w-7 h-7 text-amber-600" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
          </span>
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5">
          <span className="inline-block bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
            🎁 Presente Exclusivo Desbloqueado
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-stone-950 leading-tight">
            {offer.title}
          </h3>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            {offer.message}
          </p>
        </div>

        {/* Coupon Highlight Box with Countdown */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 rounded-xl border border-dashed border-amber-300 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-amber-600" /> Código Promocional:
            </span>
            <span className="flex items-center gap-1 text-red-600 font-bold font-mono">
              <Clock className="w-3.5 h-3.5 animate-pulse" /> Expira em:{" "}
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 bg-white py-2 px-4 rounded-lg border border-amber-200 shadow-xs">
            <span className="font-mono text-lg font-black text-stone-900 tracking-wider">
              {offer.couponCode}
            </span>
            <span className="bg-amber-400 text-stone-950 text-[11px] font-black px-2 py-0.5 rounded">
              {offer.discountPercent}% OFF
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleClaimOffer}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white py-3.5 px-6 rounded-xl font-black text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] cursor-pointer"
          >
            <span>Aplicar Desconto e Concluir Pedido</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className="text-xs text-stone-400 hover:text-stone-600 font-medium py-1 transition-colors cursor-pointer"
          >
            Não, obrigado. Prefiro continuar sem o desconto
          </button>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 border-t border-stone-100 flex items-center justify-center gap-4 text-[11px] text-stone-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Compra 100% Segura
          </span>
          <span>•</span>
          <span>Entrega Garantida para Todo o Brasil</span>
        </div>
      </div>
    </div>
  );
};
