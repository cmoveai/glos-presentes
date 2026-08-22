import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { BRAND_CONFIG } from "../config/brand";
import { submitOrder, validateCoupon, createMercadoPagoPreference, fetchAddressByCep, calculateShipping } from "../services/api";
import { trackEcommerceEvent } from "../services/marketing";
import { Order, ShippingOption } from "../types";
import { PRODUCTS } from "../data/products";
import { UpsellSection } from "../components/common/UpsellSection";
import {
  ShieldCheck,
  Lock,
  Truck,
  CreditCard,
  QrCode,
  FileText,
  CheckCircle2,
  Copy,
  ArrowLeft,
  ArrowRight,
  Gift,
  Sparkles,
  ExternalLink,
  Loader2,
  MapPin,
} from "lucide-react";

interface CheckoutPageProps {
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
  onNavigateAccount: () => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  onNavigateHome,
  onNavigateCatalog,
  onNavigateAccount,
}) => {
  const {
    items,
    subtotal,
    appliedCoupon,
    discount,
    shippingPrice,
    total,
    selectedShipping,
    applyCoupon,
    removeCoupon,
    setSelectedShipping,
    clearCart,
  } = useCart();

  const { user } = useAuth();
  const { showToast } = useToast();

  // Checkout Step: 'details' | 'success'
  const [step, setStep] = useState<"details" | "success">("details");
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States - Customer
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [customerCpf, setCustomerCpf] = useState(user?.cpf || "");

  // Form States - Shipping Address
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("São Paulo");
  const [state, setState] = useState("SP");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card" | "boleto">("pix");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);

  // Coupon input
  const [couponCode, setCouponCode] = useState("");

  // Shipping dynamic options
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepRegionLabel, setCepRegionLabel] = useState<string>("");

  // Pix Discount Calculation
  const isPix = paymentMethod === "pix";
  const pixDiscount = isPix ? (subtotal - discount) * (BRAND_CONFIG.pixDiscountPercentage / 100) : 0;
  const finalOrderTotal = Math.max(0, total - pixDiscount);

  useEffect(() => {
    if (user) {
      if (user.name && !customerName) setCustomerName(user.name);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
    }
  }, [user]);

  // Track InitiateCheckout / begin_checkout on mount if cart has items
  useEffect(() => {
    if (items.length > 0) {
      trackEcommerceEvent("begin_checkout", {
        total,
        items: items.map((i) => ({
          id: i.product.id,
          name: i.product.name,
          price: i.product.promotionalPrice ?? i.product.price,
          quantity: i.quantity,
        })),
      });
    }
  }, []);

  // Sync abandoned cart session to backend when details are filled
  useEffect(() => {
    if (items.length === 0 || step === "success") return;

    let cartTrackingId = sessionStorage.getItem("active_abandoned_cart_id");
    if (!cartTrackingId) {
      cartTrackingId = "CART-ABN-" + Math.floor(1000 + Math.random() * 9000);
      sessionStorage.setItem("active_abandoned_cart_id", cartTrackingId);
    }

    const timer = setTimeout(() => {
      let stepReached: "cart" | "email" | "address" | "shipping" | "payment" = "cart";
      if (paymentMethod) stepReached = "payment";
      else if (selectedShipping) stepReached = "shipping";
      else if (street && number) stepReached = "address";
      else if (customerEmail || customerPhone) stepReached = "email";

      fetch("/api/abandoned-carts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cartTrackingId,
          customerName: customerName || "Visitante",
          customerEmail: customerEmail || "",
          customerPhone: customerPhone || "",
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            price: i.product.promotionalPrice ?? i.product.price,
            quantity: i.quantity,
            image: i.product.images?.[0],
            sku: i.product.sku,
          })),
          subtotal,
          shippingPrice,
          discount,
          total: finalOrderTotal,
          stepReached,
        }),
      }).catch((e) => console.warn("Abandoned cart sync error:", e));
    }, 1500);

    return () => clearTimeout(timer);
  }, [customerName, customerEmail, customerPhone, street, number, paymentMethod, selectedShipping, items.length, total]);

  // Handle Cep Address Lookup & Real-time Shipping Calculation
  const handleCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      try {
        const addressData = await fetchAddressByCep(cleanCep);
        if (addressData) {
          if (addressData.street) setStreet(addressData.street);
          if (addressData.neighborhood) setNeighborhood(addressData.neighborhood);
          if (addressData.city) setCity(addressData.city);
          if (addressData.state) setState(addressData.state);
        }

        const shippingData = await calculateShipping(cleanCep, subtotal);
        if (shippingData && shippingData.options.length > 0) {
          setShippingOptions(shippingData.options);
          if (shippingData.locationLabel) {
            setCepRegionLabel(shippingData.locationLabel);
          }
          // Default selection to first option (e.g. Economico / PAC)
          setSelectedShipping(shippingData.options[0]);
        }
      } catch (err) {
        console.warn("Erro ao buscar CEP:", err);
      } finally {
        setIsSearchingCep(false);
      }
    }
  };

  const handleCepBlur = () => {
    handleCepLookup(cep);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCep(val);
    if (val.replace(/\D/g, "").length === 8) {
      handleCepLookup(val);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await applyCoupon(couponCode);
    setCouponCode("");
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName || !customerEmail || !customerPhone || !customerCpf) {
      showToast("Por favor, preencha todos os dados pessoais obrigatórios.", "error");
      return;
    }

    if (!street || !number || !neighborhood || !city || !state || !cep) {
      showToast("Por favor, preencha o endereço completo de entrega.", "error");
      return;
    }

    const shippingChoice: ShippingOption = selectedShipping || {
      id: "pac",
      name: "Envio Econômico",
      price: subtotal > BRAND_CONFIG.freeShippingThreshold ? 0 : 18.9,
      originalPrice: 18.9,
      deadline: "5 a 8 dias úteis",
    };

    setIsSubmitting(true);
    try {
      // 1. Create Preference on backend via Mercado Pago SDK
      const mpPreferenceResult = await createMercadoPagoPreference({
        items: items.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.promotionalPrice ?? item.product.price,
          quantity: item.quantity,
          image: item.product.images[0],
        })),
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          cpf: customerCpf,
        },
        shippingPrice: shippingChoice.price,
        discount: discount + pixDiscount,
      });

      const orderPayload: Partial<Order> = {
        id: mpPreferenceResult.orderId,
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          cpf: customerCpf,
        },
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          image: item.product.images[0],
          price: item.product.promotionalPrice ?? item.product.price,
          quantity: item.quantity,
          variantName: item.selectedVariant?.name,
        })),
        shippingAddress: {
          id: "addr-1",
          recipientName: customerName,
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          zipCode: cep,
          phone: customerPhone,
        },
        shippingOption: shippingChoice,
        paymentMethod,
        paymentDetails: {
          installments: paymentMethod === "credit_card" ? installments : 1,
          cardLast4: cardNumber ? cardNumber.slice(-4) : undefined,
          pixCode: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540410.005802BR5913NOME DA MARCA6009SAO PAULO62070503***6304E2CA",
          pixQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014BR.GOV.BCB.PIX",
          pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          initPoint: mpPreferenceResult.init_point,
          preferenceId: mpPreferenceResult.preferenceId,
          isLiveGateway: mpPreferenceResult.isLiveGateway,
        },
        subtotal,
        discount: discount + pixDiscount,
        shippingPrice: shippingChoice.price,
        total: finalOrderTotal,
        couponCode: appliedCoupon?.code,
      };

      const response = await submitOrder(orderPayload);
      if (response.success && response.order) {
        setCompletedOrder(response.order);
        setStep("success");
        
        // Track Purchase event in GA4, Ads, and Meta Pixel
        trackEcommerceEvent("purchase", {
          orderId: response.order.id,
          total: response.order.total,
          items: response.order.items.map((it) => ({
            id: it.productId,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
          })),
        });

        clearCart();
        showToast("Pedido gerado com sucesso!", "success");
      }
    } catch {
      showToast("Erro ao processar o pedido. Tente novamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS VIEW
  if (step === "success" && completedOrder) {
    return (
      <div className="bg-stone-50 min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xl text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Pedido Realizado com Sucesso
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                Obrigado, {completedOrder.customer.name.split(" ")[0]}!
              </h1>
              <p className="text-xs sm:text-sm text-stone-700 mt-2">
                Número do Pedido: <strong className="font-mono text-stone-950">#{completedOrder.id}</strong>
              </p>
              <p className="text-xs text-stone-700">
                Enviamos os detalhes da compra e o comprovante para <strong>{completedOrder.customer.email}</strong>
              </p>
            </div>

            {/* PIX QR CODE & CODE IF PIX */}
            {completedOrder.paymentMethod === "pix" && completedOrder.paymentDetails.pixQrCodeUrl && (
              <div className="p-6 bg-stone-900 text-white rounded-2xl max-w-md mx-auto space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" /> Pagamento Instantâneo via Pix
                  </span>
                  <span className="text-[11px] text-stone-400">Expira em 30 minutos</span>
                </div>

                <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
                  <img
                    src={completedOrder.paymentDetails.pixQrCodeUrl}
                    alt="Pix QR Code"
                    className="w-48 h-48 mx-auto"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-stone-300">Ou copie o código Pix abaixo:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={completedOrder.paymentDetails.pixCode || ""}
                      className="flex-1 text-[11px] font-mono bg-stone-800 border border-stone-700 text-stone-300 rounded-lg px-2.5 py-1.5 truncate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (completedOrder.paymentDetails.pixCode) {
                          navigator.clipboard.writeText(completedOrder.paymentDetails.pixCode);
                          showToast("Código Pix copiado!", "success");
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-400 text-stone-950 text-xs font-bold rounded-lg hover:bg-amber-300 flex items-center gap-1 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MERCADO PAGO CHECKOUT BUTTON / REDIRECT */}
            {completedOrder.paymentDetails?.initPoint && (
              <div className="p-5 bg-sky-50 border border-sky-200 rounded-2xl max-w-md mx-auto space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-sky-700" /> Mercado Pago Checkout
                  </span>
                  <span className="text-[10px] bg-sky-200/80 text-sky-900 px-2 py-0.5 rounded-full font-bold">
                    Oficial
                  </span>
                </div>
                <p className="text-xs text-sky-800">
                  Caso deseje pagar ou parcelar no ambiente seguro do Mercado Pago com cartão, Pix ou saldo de conta:
                </p>
                <a
                  href={completedOrder.paymentDetails.initPoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 bg-[#009EE3] hover:bg-[#0089C7] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <span>Pagar com Mercado Pago</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Summary details */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between font-semibold text-stone-900">
                <span>Total do Pedido:</span>
                <span>R$ {completedOrder.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Forma de Pagamento:</span>
                <span className="capitalize">{completedOrder.paymentMethod.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between text-stone-700">
                <span>Prazo Estimado de Entrega:</span>
                <span>{completedOrder.shippingOption.deadline}</span>
              </div>
              <div className="text-stone-700 pt-1 border-t border-stone-200">
                <span>Endereço: </span>
                <span>
                  {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.number} -{" "}
                  {completedOrder.shippingAddress.city}/{completedOrder.shippingAddress.state}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-6 py-3 rounded-xl bg-stone-950 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                Voltar à Página Inicial
              </button>
              <button
                type="button"
                onClick={onNavigateAccount}
                className="px-6 py-3 rounded-xl bg-stone-100 text-stone-800 text-xs font-semibold hover:bg-stone-200 transition-colors"
              >
                Ver Meus Pedidos
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART CHECKOUT GUARD
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Seu carrinho está vazio</h2>
        <p className="text-xs text-stone-700 mb-6">
          Adicione produtos incríveis à sua sacola para prosseguir para o checkout.
        </p>
        <button
          onClick={onNavigateCatalog}
          className="px-6 py-3 bg-stone-950 text-white text-xs font-bold rounded-xl"
        >
          Explorar Catálogo de Presentes
        </button>
      </div>
    );
  }

  return (
    <div className="bg-stone-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateCatalog}
              className="text-stone-500 hover:text-stone-900 text-xs font-semibold flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Continuar Comprando
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Checkout Seguro SSL 256-bit</span>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* LEFT COLUMN: STEPS & FORMS (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* STEP 1: IDENTIFICATION */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-stone-950 text-white text-xs font-bold flex items-center justify-center">
                    1
                  </div>
                  <h2 className="text-base font-bold text-stone-950">Dados Pessoais</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nome de quem está comprando"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">E-mail para Confirmação</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">WhatsApp / Telefone</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">CPF (Necessário para emissão da NF-e)</label>
                    <input
                      type="text"
                      required
                      value={customerCpf}
                      onChange={(e) => setCustomerCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: SHIPPING ADDRESS */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-stone-950 text-white text-xs font-bold flex items-center justify-center">
                    2
                  </div>
                  <h2 className="text-base font-bold text-stone-950">Endereço de Entrega</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                      <span>CEP</span>
                      {isSearchingCep && (
                        <span className="text-[10px] text-amber-700 flex items-center gap-1 font-normal">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Buscando...
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={9}
                      value={cep}
                      onBlur={handleCepBlur}
                      onChange={handleCepChange}
                      placeholder="01310-100"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">Rua / Avenida</label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Av. Paulista"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Número</label>
                    <input
                      type="text"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Complemento</label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto 42, Bloco B"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bela Vista"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-stone-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="SP"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-stone-900"
                    />
                  </div>
                </div>

                {/* Shipping Method Selection */}
                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-stone-800">
                      Forma de Envio Selecionada:
                    </label>
                    {cepRegionLabel && (
                      <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-stone-700" />
                        {cepRegionLabel}
                      </span>
                    )}
                  </div>

                  {shippingOptions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {shippingOptions.map((opt) => (
                        <label
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selectedShipping?.id === opt.id
                              ? "border-stone-950 bg-stone-50 ring-1 ring-stone-950"
                              : "border-stone-200 hover:border-stone-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="shipping"
                              checked={selectedShipping?.id === opt.id}
                              onChange={() => setSelectedShipping(opt)}
                              className="text-stone-950"
                            />
                            <div>
                              <p className="text-xs font-bold text-stone-900">{opt.name}</p>
                              <p className="text-[11px] text-stone-500">{opt.deadline}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {opt.isFree || opt.price === 0 ? (
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                                GRÁTIS
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-stone-950">
                                R$ {opt.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedShipping?.id === "sedex"
                            ? "border-stone-950 bg-stone-50 ring-1 ring-stone-950"
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedShipping?.id === "sedex"}
                            onChange={() =>
                              setSelectedShipping({
                                id: "sedex",
                                name: "Sedex Expresso",
                                price: 29.9,
                                originalPrice: 29.9,
                                deadline: "1 a 3 dias úteis",
                              })
                            }
                            className="text-stone-950"
                          />
                          <div>
                            <p className="text-xs font-bold text-stone-900">Sedex Expresso</p>
                            <p className="text-[11px] text-stone-500">1 a 3 dias úteis</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-stone-950">R$ 29,90</span>
                      </label>

                      <label
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          selectedShipping?.id === "pac" || !selectedShipping
                            ? "border-stone-950 bg-stone-50 ring-1 ring-stone-950"
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="shipping"
                            checked={selectedShipping?.id === "pac" || !selectedShipping}
                            onChange={() =>
                              setSelectedShipping({
                                id: "pac",
                                name: "Econômico (PAC)",
                                price: subtotal >= BRAND_CONFIG.freeShippingThreshold ? 0 : 18.9,
                                originalPrice: 18.9,
                                deadline: "5 a 8 dias úteis",
                                isFree: subtotal >= BRAND_CONFIG.freeShippingThreshold,
                              })
                            }
                            className="text-stone-950"
                          />
                          <div>
                            <p className="text-xs font-bold text-stone-900">Envio Econômico</p>
                            <p className="text-[11px] text-stone-500">5 a 8 dias úteis</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-stone-950">
                          {subtotal >= BRAND_CONFIG.freeShippingThreshold ? (
                            <span className="text-emerald-700 font-bold">Grátis</span>
                          ) : (
                            "R$ 18,90"
                          )}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: PAYMENT METHOD */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-stone-950 text-white text-xs font-bold flex items-center justify-center">
                    3
                  </div>
                  <h2 className="text-base font-bold text-stone-950">Forma de Pagamento</h2>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === "pix"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600"
                        : "border-stone-200 hover:border-stone-300 text-stone-700 font-medium"
                    }`}
                  >
                    <QrCode className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
                    <span className="text-xs block">Pix</span>
                    <span className="text-[10px] text-emerald-700 font-bold block">
                      5% OFF Extra
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("credit_card")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === "credit_card"
                        ? "border-stone-950 bg-stone-50 text-stone-950 font-bold ring-1 ring-stone-950"
                        : "border-stone-200 hover:border-stone-300 text-stone-700 font-medium"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mx-auto mb-1 text-stone-900" />
                    <span className="text-xs block">Cartão de Crédito</span>
                    <span className="text-[10px] text-stone-500 block">Até 10x sem juros</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("boleto")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      paymentMethod === "boleto"
                        ? "border-stone-950 bg-stone-50 text-stone-950 font-bold ring-1 ring-stone-950"
                        : "border-stone-200 hover:border-stone-300 text-stone-700 font-medium"
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1 text-stone-900" />
                    <span className="text-xs block">Boleto</span>
                    <span className="text-[10px] text-stone-500 block">Vencimento 3 dias</span>
                  </button>
                </div>

                {/* PIX DETAILS PREVIEW */}
                {paymentMethod === "pix" && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                      Você economiza R$ {pixDiscount.toFixed(2)} pagando no Pix!
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      O QR Code e a chave Pix "Copia e Cola" serão gerados imediatamente na confirmação do pedido.
                    </p>
                  </div>
                )}

                {/* CREDIT CARD FIELDS */}
                {paymentMethod === "credit_card" && (
                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Número do Cartão</label>
                      <input
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Nome Impresso no Cartão</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        placeholder="NOME COMO NO CARTAO"
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">Validade (MM/AA)</label>
                        <input
                          type="text"
                          maxLength={5}
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                          placeholder="12/28"
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          placeholder="123"
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Parcelamento</label>
                      <select
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6, 10].map((num) => (
                          <option key={num} value={num}>
                            {num}x de R$ {(total / num).toFixed(2)} sem juros
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200 shadow-2xs space-y-5">
                <h2 className="text-base font-bold text-stone-950 pb-3 border-b border-stone-100">
                  Resumo do Pedido ({items.reduce((sum, i) => sum + i.quantity, 0)} itens)
                </h2>

                {/* Items List */}
                <div className="divide-y divide-stone-100 max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const price = item.product.promotionalPrice ?? item.product.price;
                    return (
                      <div key={`${item.product.id}-${item.selectedVariant?.id}`} className="py-3 flex gap-3">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">
                            {item.product.name}
                          </h4>
                          {item.selectedVariant && (
                            <p className="text-[11px] text-stone-500">
                              Modelo: {item.selectedVariant.name}
                            </p>
                          )}
                          {item.includeGiftWrap && (
                            <p className="text-[10px] text-amber-700 font-semibold flex items-center gap-1 mt-0.5">
                              <Gift className="w-3 h-3" /> Embalagem de presente
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-stone-500">Qtd: {item.quantity}</span>
                            <span className="font-bold text-stone-950">
                              R$ {(price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Coupon input */}
                <div className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Cupom de desconto"
                      className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-xl uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800"
                    >
                      Aplicar
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg">
                      <span>Cupom <strong>{appliedCoupon.code}</strong> ativo</span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-stone-400 hover:text-stone-600 underline text-[11px]"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Upsell & Cross-Sell Suggestions */}
                <UpsellSection allProducts={PRODUCTS} compact={true} />

                {/* Price Breakdown */}
                <div className="pt-4 border-t border-stone-100 space-y-2 text-xs text-stone-700">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Desconto do Cupom</span>
                      <span>- R$ {discount.toFixed(2)}</span>
                    </div>
                  )}

                  {isPix && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Desconto Pix (5% OFF)</span>
                      <span>- R$ {pixDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span>
                      {shippingPrice === 0 ? (
                        <span className="text-emerald-700 font-bold">Grátis</span>
                      ) : (
                        `R$ ${shippingPrice.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-stone-950">Total Final</span>
                    <div className="text-right">
                      <span className="text-2xl font-black text-stone-950">
                        R$ {finalOrderTotal.toFixed(2)}
                      </span>
                      {paymentMethod === "credit_card" && (
                        <p className="text-[11px] text-stone-500">
                          ou {installments}x de R$ {(finalOrderTotal / installments).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-stone-950 hover:bg-stone-800 text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? "Finalizando Compra..." : "Concluir Pedido com Segurança"}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
