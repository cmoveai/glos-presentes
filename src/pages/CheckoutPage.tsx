import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { BRAND_CONFIG } from "../config/brand";
import {
  submitOrder,
  createMercadoPagoPreference,
  fetchAddressByCep,
  calculateShipping,
} from "../services/api";
import { trackEcommerceEvent } from "../services/marketing";
import { Order, ShippingOption } from "../types";
import {
  ShieldCheck,
  Lock,
  Truck,
  ArrowLeft,
  Gift,
  ExternalLink,
  Loader2,
  MapPin,
  Check,
  AlertCircle,
  MessageCircle,
  Clock,
  UserCheck,
  LogOut,
  RefreshCw,
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

  const { user, login, loginWithGoogle, register, logout, addAddress } = useAuth();
  const { showToast } = useToast();

  // Return query parameters detection (Mercado Pago redirect back)
  const [returnStatus, setReturnStatus] = useState<"approved" | "pending" | "failure" | null>(null);
  const [externalReference, setExternalReference] = useState<string | null>(null);

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      let statusParam = searchParams.get("status") || searchParams.get("collection_status") || searchParams.get("checkout");
      let refParam = searchParams.get("external_reference") || searchParams.get("preference_id");

      if (!statusParam && hash.includes("?")) {
        const hashQuery = hash.substring(hash.indexOf("?") + 1);
        const hashParams = new URLSearchParams(hashQuery);
        statusParam = hashParams.get("status") || hashParams.get("collection_status") || hashParams.get("checkout");
        refParam = hashParams.get("external_reference") || hashParams.get("preference_id");
      }

      if (statusParam === "approved" || statusParam === "success") {
        setReturnStatus("approved");
        if (refParam) setExternalReference(refParam);
      } else if (statusParam === "pending" || statusParam === "in_process") {
        setReturnStatus("pending");
        if (refParam) setExternalReference(refParam);
      } else if (statusParam === "rejected" || statusParam === "failure" || statusParam === "null") {
        setReturnStatus("failure");
        if (refParam) setExternalReference(refParam);
      }
    } catch {
      // Ignorar erro de parsing de URL
    }
  }, []);

  // Checkout Step & States
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth Form State (when user is not logged in)
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Customer Form State
  const [customerName, setCustomerName] = useState(user?.name || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "");
  const [customerCpf, setCustomerCpf] = useState(user?.cpf || "");

  // Shipping Address State
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("São Paulo");
  const [state, setState] = useState("SP");

  // Shipping dynamic options
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepRegionLabel, setCepRegionLabel] = useState<string>("");

  // Coupon input
  const [couponCode, setCouponCode] = useState("");

  // Gift options
  const [giftCardMessage, setGiftCardMessage] = useState("");
  const [isGift, setIsGift] = useState(false);

  // Sync user details when logged in
  useEffect(() => {
    if (user) {
      if (user.name && !customerName) setCustomerName(user.name);
      if (user.email && !customerEmail) setCustomerEmail(user.email);
      if (user.phone && !customerPhone) setCustomerPhone(user.phone);
      if (user.cpf && !customerCpf) setCustomerCpf(user.cpf);

      // Pre-fill default address if present
      if (user.addresses && user.addresses.length > 0 && !street) {
        const defaultAddr = user.addresses.find((a) => a.isDefault) || user.addresses[0];
        if (defaultAddr) {
          setCep(defaultAddr.zipCode);
          setStreet(defaultAddr.street);
          setNumber(defaultAddr.number);
          setComplement(defaultAddr.complement || "");
          setNeighborhood(defaultAddr.neighborhood);
          setCity(defaultAddr.city);
          setState(defaultAddr.state);
          handleCepLookup(defaultAddr.zipCode);
        }
      }
    }
  }, [user]);

  // Track InitiateCheckout / begin_checkout on mount
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

  // Bifurcation evaluation: check if any item requires personalization
  const hasPersonalizavel = items.some(
    (item) =>
      item.requerArquivo ||
      item.natureza === "personalizavel" ||
      item.product?.productType === "personalizavel" ||
      (item.product as any)?.natureza === "personalizavel"
  );

  // Format CPF as typing
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 9) {
      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    } else if (v.length > 6) {
      v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    } else if (v.length > 3) {
      v = v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    }
    setCustomerCpf(v);
  };

  // Format Phone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 10) {
      v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    } else if (v.length > 6) {
      v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
    } else if (v.length > 2) {
      v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
    }
    setCustomerPhone(v);
  };

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

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 8) val = val.substring(0, 8);
    let formatted = val;
    if (val.length > 5) {
      formatted = val.replace(/^(\d{5})(\d{1,3})/, "$1-$2");
    }
    setCep(formatted);
    if (val.length === 8) {
      handleCepLookup(val);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await applyCoupon(couponCode);
    setCouponCode("");
  };

  // Handle login from within checkout
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      if (authMode === "login") {
        if (!authEmail) {
          showToast("Informe seu e-mail.", "error");
          return;
        }
        await login(authEmail, authPassword);
      } else {
        if (!authName || !authEmail) {
          showToast("Preencha seu nome e e-mail.", "error");
          return;
        }
        await register(authName, authEmail, authPhone, authPassword);
      }
    } catch (err: any) {
      showToast(err.message || "Erro na autenticação. Tente novamente.", "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handle Order Submit & Mercado Pago Redirection
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast("Por favor, faça login ou cadastre-se para prosseguir com o pedido.", "info");
      return;
    }

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !customerCpf.trim()) {
      showToast("Por favor, preencha todos os dados pessoais obrigatórios (Nome, E-mail, WhatsApp e CPF).", "error");
      return;
    }

    if (!street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !state.trim() || !cep.trim()) {
      showToast("Por favor, preencha o endereço completo de entrega.", "error");
      return;
    }

    const shippingChoice: ShippingOption = selectedShipping || {
      id: "pac",
      name: "Envio Econômico",
      price: subtotal >= BRAND_CONFIG.freeShippingThreshold ? 0 : 18.9,
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
          image: item.product.images?.[0] || item.imagem,
        })),
        customer: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          cpf: customerCpf,
        },
        shippingPrice: shippingChoice.price,
        discount: discount,
      });

      const orderId = mpPreferenceResult.orderId || "PED-" + Math.floor(100000 + Math.random() * 900000);

      // 2. Order Bifurcation status:
      // If any item requires customization/file -> 'aguardando_arquivo'
      // If simple or licensed -> 'a_despachar'
      const statusPedido = hasPersonalizavel ? "aguardando_arquivo" : "a_despachar";

      const orderPayload: Partial<Order> = {
        id: orderId,
        clienteId: user?.id,
        status: "PEDIDO_REALIZADO",
        statusPedido,
        statusPagamento: "aguardando_pagamento",
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
          image: item.product.images?.[0] || item.imagem,
          price: item.product.promotionalPrice ?? item.product.price,
          quantity: item.quantity,
          variantName: item.selectedVariant?.name || item.variacaoSelecionada?.nome,
          natureza: (item.natureza || item.product?.productType || "simples") as any,
          requerArquivo: !!item.requerArquivo,
          cor: item.cor || item.selectedVariant?.name || null,
          textoCurto: item.textoCurto || null,
        })),
        shippingAddress: {
          id: "addr-" + Date.now(),
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
        paymentMethod: "credit_card",
        paymentStatus: "pendente",
        paymentDetails: {
          installments: 1,
          initPoint: mpPreferenceResult.init_point || mpPreferenceResult.sandbox_init_point,
          preferenceId: mpPreferenceResult.preferenceId,
          isLiveGateway: mpPreferenceResult.isLiveGateway,
        },
        subtotal,
        discount,
        shippingPrice: shippingChoice.price,
        total,
        couponCode: appliedCoupon?.code,
        giftWrap: isGift,
        giftCardMessage: isGift ? giftCardMessage : undefined,
      };

      const response = await submitOrder(orderPayload);
      if (response.success && response.order) {
        setCompletedOrder(response.order);

        // Also save address to user profile if not saved
        if (user && (!user.addresses || user.addresses.length === 0)) {
          addAddress({
            recipientName: customerName,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            zipCode: cep,
            phone: customerPhone,
            isDefault: true,
          });
        }

        // Track Purchase / begin_payment
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

        // If Mercado Pago init_point is provided, redirect to Checkout Pro
        if (mpPreferenceResult.init_point) {
          window.location.href = mpPreferenceResult.init_point;
          return;
        }

        // Otherwise, stay in success view
        setReturnStatus("approved");
        showToast("Pedido gerado com sucesso!", "success");
      }
    } catch (err: any) {
      showToast("Erro ao processar o pedido. Tente novamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // RETURN STATE 1: APPROVED / SUCCESS VIEW
  // ==========================================
  if (returnStatus === "approved" || (completedOrder && !returnStatus)) {
    const orderNum = completedOrder?.id || externalReference || "PED-NOVO";
    const waOrderMsg = encodeURIComponent(
      `Olá, equipe glos.! Acabei de fazer meu pedido #${orderNum}. Gostaria de enviar os detalhes e fotos para personalização.`
    );
    const waLink = `https://wa.me/5511961820588?text=${waOrderMsg}`;

    return (
      <div className="bg-[#E4E2DD] min-h-screen py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#004AAD]/10 text-[#004AAD] flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[12px] uppercase tracking-wider text-[#004AAD] font-medium block mb-1">
                Pedido Recebido com Sucesso
              </span>
              <h1 className="text-2xl sm:text-3xl font-medium text-[#272727]">
                Obrigado pelo seu pedido!
              </h1>
              <p className="text-sm text-[#6B6A64] mt-2">
                Número do pedido: <span className="font-mono text-[#272727] tabular-nums font-medium">#{orderNum}</span>
              </p>
              <p className="text-xs text-[#6B6A64] mt-1">
                Recebemos seu pedido! A confirmação do pagamento é validada automaticamente em instantes via Mercado Pago.
              </p>
            </div>

            {/* Bifurcation Notice for Personalized Items */}
            {hasPersonalizavel && (
              <div className="bg-[#EEEDE8] border border-[#D6D3CC] rounded-[8px] p-4 text-left space-y-3">
                <div className="flex items-start gap-2.5">
                  <MessageCircle className="w-5 h-5 text-[#004AAD] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-medium text-[#272727]">
                      Seu pedido contém presente personalizado
                    </h3>
                    <p className="text-xs text-[#6B6A64] mt-1 leading-relaxed">
                      Para garantirmos que cada detalhe fique perfeito, envie suas fotos ou mensagens diretamente para o nosso WhatsApp de atendimento. Nossa designer prepara a prévia com todo o carinho!
                    </p>
                  </div>
                </div>

                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-[#004AAD] hover:bg-[#003882] text-white text-xs font-medium rounded-[8px] flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enviar fotos no WhatsApp (11) 96182-0588</span>
                </a>
              </div>
            )}

            {/* Order details review */}
            {completedOrder && (
              <div className="bg-[#EEEDE8] border border-[#D6D3CC] rounded-[8px] p-4 text-left text-xs space-y-2">
                <div className="flex justify-between text-[#272727] font-medium pb-2 border-b border-[#D6D3CC]">
                  <span>Total:</span>
                  <span className="tabular-nums">R$ {completedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6B6A64]">
                  <span>Prazo estimado:</span>
                  <span>{completedOrder.shippingOption.deadline}</span>
                </div>
                <div className="flex justify-between text-[#6B6A64]">
                  <span>Endereço de entrega:</span>
                  <span>
                    {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.number} - {completedOrder.shippingAddress.city}/{completedOrder.shippingAddress.state}
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={onNavigateAccount}
                className="py-2.5 px-5 bg-[#004AAD] hover:bg-[#003882] text-white text-xs font-medium rounded-[8px] transition-colors"
              >
                Acompanhar Meus Pedidos
              </button>
              <button
                type="button"
                onClick={onNavigateHome}
                className="py-2.5 px-5 bg-[#EEEDE8] hover:bg-[#E4E2DD] text-[#272727] border border-[#D6D3CC] text-xs font-medium rounded-[8px] transition-colors"
              >
                Voltar à Página Inicial
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RETURN STATE 2: PENDING VIEW
  // ==========================================
  if (returnStatus === "pending") {
    return (
      <div className="bg-[#E4E2DD] min-h-screen py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[12px] uppercase tracking-wider text-amber-700 font-medium block mb-1">
                Pagamento em Processamento
              </span>
              <h1 className="text-2xl sm:text-3xl font-medium text-[#272727]">
                Aguardando Confirmação
              </h1>
              <p className="text-xs text-[#6B6A64] mt-2 leading-relaxed">
                Se você pagou via Pix ou Boleto no Mercado Pago, a confirmação pode levar alguns instantes. Assim que o pagamento for compensado, iniciaremos a preparação do seu presente.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
              <button
                type="button"
                onClick={onNavigateAccount}
                className="py-2.5 px-5 bg-[#004AAD] hover:bg-[#003882] text-white text-xs font-medium rounded-[8px] transition-colors"
              >
                Ver Meus Pedidos
              </button>
              <a
                href="https://wa.me/5511961820588"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 bg-[#EEEDE8] hover:bg-[#E4E2DD] text-[#272727] border border-[#D6D3CC] text-xs font-medium rounded-[8px] transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-[#004AAD]" />
                <span>Atendimento WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RETURN STATE 3: FAILURE VIEW
  // ==========================================
  if (returnStatus === "failure") {
    return (
      <div className="bg-[#E4E2DD] min-h-screen py-10 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-6 sm:p-8 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#9B2C2C]/10 text-[#9B2C2C] flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[12px] uppercase tracking-wider text-[#9B2C2C] font-medium block mb-1">
                Pagamento Não Concluído
              </span>
              <h1 className="text-2xl sm:text-3xl font-medium text-[#272727]">
                Não foi possível processar o pagamento
              </h1>
              <p className="text-xs text-[#6B6A64] mt-2 leading-relaxed">
                Houve uma recusa ou interrupção na tela do Mercado Pago. Seus itens continuam salvos no carrinho para que você possa tentar novamente ou escolher outro método.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
              <button
                type="button"
                onClick={() => setReturnStatus(null)}
                className="py-2.5 px-5 bg-[#004AAD] hover:bg-[#003882] text-white text-xs font-medium rounded-[8px] transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
              <a
                href="https://wa.me/5511961820588"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-5 bg-[#EEEDE8] hover:bg-[#E4E2DD] text-[#272727] border border-[#D6D3CC] text-xs font-medium rounded-[8px] transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4 text-[#004AAD]" />
                <span>Falar com Atendimento</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY CART GUARD
  // ==========================================
  if (items.length === 0) {
    return (
      <div className="bg-[#E4E2DD] min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-8 max-w-md w-full space-y-4">
          <h2 className="text-lg font-medium text-[#272727]">Sua sacola está vazia</h2>
          <p className="text-xs text-[#6B6A64] leading-relaxed">
            Adicione presentes criativos e afetivos à sua sacola para prosseguir para o checkout.
          </p>
          <button
            type="button"
            onClick={onNavigateCatalog}
            className="w-full py-2.5 px-4 bg-[#004AAD] hover:bg-[#003882] text-white text-xs font-medium rounded-[8px] transition-colors"
          >
            Explorar Presentes
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN CHECKOUT FORM
  // ==========================================
  return (
    <div className="bg-[#E4E2DD] min-h-screen py-8 sm:py-10">
      <div className="w-full px-4 sm:px-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#D6D3CC]">
          <button
            type="button"
            onClick={onNavigateCatalog}
            className="text-xs text-[#6B6A64] hover:text-[#272727] font-medium flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao catálogo</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-[#6B6A64] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#004AAD]" />
            <span>Checkout Seguro</span>
          </div>
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: STEPS & FORMS (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* STEP 1: IDENTIFICATION & AUTH */}
              <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#004AAD] text-white text-xs font-medium flex items-center justify-center">
                      1
                    </span>
                    <h2 className="text-sm font-medium text-[#272727]">Identificação</h2>
                  </div>

                  {user && (
                    <button
                      type="button"
                      onClick={logout}
                      className="text-[11px] text-[#6B6A64] hover:text-[#9B2C2C] flex items-center gap-1 transition-colors"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Trocar de conta</span>
                    </button>
                  )}
                </div>

                {user ? (
                  /* LOGGED IN USER VIEW */
                  <div className="space-y-3">
                    <div className="bg-[#EEEDE8] border border-[#D6D3CC] rounded-[8px] p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#004AAD]/10 text-[#004AAD] flex items-center justify-center font-medium text-xs">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#272727] font-medium truncate">
                          {customerName || user.name || "Cliente Glos"}
                        </p>
                        <p className="text-[11px] text-[#6B6A64] truncate">
                          {customerEmail || user.email}
                        </p>
                      </div>
                      <span className="text-[10px] text-[#004AAD] font-medium bg-[#004AAD]/10 px-2 py-0.5 rounded-[4px]">
                        Conectado
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Seu nome"
                          className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          required
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                          WhatsApp / Telefone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={customerPhone}
                          onChange={handlePhoneChange}
                          placeholder="(11) 99999-9999"
                          className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] tabular-nums focus:outline-none focus:border-[#004AAD]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                          CPF (para emissão de NF-e) *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerCpf}
                          onChange={handleCpfChange}
                          placeholder="000.000.000-00"
                          className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] tabular-nums focus:outline-none focus:border-[#004AAD]"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* GUEST / MANDATORY LOGIN FORM */
                  <div className="space-y-4">
                    <p className="text-xs text-[#6B6A64] leading-relaxed">
                      Identifique-se para acompanhar o envio e ter acesso rápido aos seus pedidos.
                    </p>

                    {/* Google Login 1-Click */}
                    <button
                      type="button"
                      onClick={loginWithGoogle}
                      className="w-full py-2.5 px-4 bg-white hover:bg-[#EEEDE8] border border-[#D6D3CC] rounded-[8px] text-xs font-medium text-[#272727] flex items-center justify-center gap-2 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continuar com Google</span>
                    </button>

                    <div className="relative flex items-center justify-center my-3">
                      <div className="border-t border-[#D6D3CC] w-full" />
                      <span className="bg-[#F4F3EF] px-2 text-[10px] text-[#9B998F] uppercase absolute">
                        ou com e-mail
                      </span>
                    </div>

                    <div className="space-y-3">
                      {authMode === "register" && (
                        <div>
                          <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                            Nome Completo *
                          </label>
                          <input
                            type="text"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            placeholder="Seu nome"
                            className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                          E-mail *
                        </label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                        />
                      </div>

                      {authMode === "register" && (
                        <div>
                          <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                            WhatsApp / Telefone
                          </label>
                          <input
                            type="tel"
                            value={authPhone}
                            onChange={(e) => setAuthPhone(e.target.value)}
                            placeholder="(11) 99999-9999"
                            className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] tabular-nums focus:outline-none focus:border-[#004AAD]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                          Senha (opcional ou mín. 6 dígitos)
                        </label>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          placeholder="••••••"
                          className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                          className="text-[11px] text-[#004AAD] hover:underline font-medium"
                        >
                          {authMode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Fazer login"}
                        </button>

                        <button
                          type="button"
                          disabled={isAuthLoading}
                          onClick={handleAuthSubmit}
                          className="py-2 px-4 bg-[#004AAD] hover:bg-[#003882] text-white text-xs font-medium rounded-[8px] transition-colors disabled:opacity-50"
                        >
                          {isAuthLoading ? "Entrando..." : authMode === "login" ? "Entrar" : "Cadastrar"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: SHIPPING ADDRESS */}
              <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#004AAD] text-white text-xs font-medium flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-sm font-medium text-[#272727]">Endereço de Entrega</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#6B6A64] font-medium mb-1 flex items-center justify-between">
                      <span>CEP *</span>
                      {isSearchingCep && (
                        <span className="text-[10px] text-[#004AAD] flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" /> Buscando...
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={9}
                      value={cep}
                      onChange={handleCepChange}
                      placeholder="01310-100"
                      className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] tabular-nums focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                      Rua / Avenida *
                    </label>
                    <input
                      type="text"
                      required
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Ex: Av. Paulista"
                      className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                      Número *
                    </label>
                    <input
                      type="text"
                      required
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      placeholder="123"
                      className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] tabular-nums focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={complement}
                      onChange={(e) => setComplement(e.target.value)}
                      placeholder="Apto 42, Bloco B"
                      className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                      Bairro *
                    </label>
                    <input
                      type="text"
                      required
                      value={neighborhood}
                      onChange={(e) => setNeighborhood(e.target.value)}
                      placeholder="Bela Vista"
                      className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] font-medium mb-1">
                      Estado (UF) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={state}
                      onChange={(e) => setState(e.target.value.toUpperCase())}
                      placeholder="SP"
                      className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                {/* Shipping Method Options */}
                <div className="pt-3 border-t border-[#D6D3CC] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-[#272727]">
                      Opções de Envio:
                    </label>
                    {cepRegionLabel && (
                      <span className="text-[11px] text-[#6B6A64] font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#004AAD]" />
                        {cepRegionLabel}
                      </span>
                    )}
                  </div>

                  {shippingOptions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {shippingOptions.map((opt) => {
                        const isSelected = selectedShipping?.id === opt.id;
                        return (
                          <label
                            key={opt.id}
                            className={`p-3 rounded-[8px] border flex items-center justify-between cursor-pointer transition-colors ${
                              isSelected
                                ? "border-[#004AAD] bg-[#EEEDE8]"
                                : "border-[#D6D3CC] bg-white hover:bg-[#EEEDE8]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="radio"
                                name="shipping"
                                checked={isSelected}
                                onChange={() => setSelectedShipping(opt)}
                                className="accent-[#004AAD]"
                              />
                              <div>
                                <p className="text-xs font-medium text-[#272727]">{opt.name}</p>
                                <p className="text-[11px] text-[#6B6A64]">{opt.deadline}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {opt.isFree || opt.price === 0 ? (
                                <span className="text-xs font-medium text-[#0F7A4F] tabular-nums">
                                  Grátis
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-[#272727] tabular-nums">
                                  R$ {opt.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <label
                        className={`p-3 rounded-[8px] border flex items-center justify-between cursor-pointer transition-colors ${
                          selectedShipping?.id === "sedex"
                            ? "border-[#004AAD] bg-[#EEEDE8]"
                            : "border-[#D6D3CC] bg-white hover:bg-[#EEEDE8]"
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
                            className="accent-[#004AAD]"
                          />
                          <div>
                            <p className="text-xs font-medium text-[#272727]">Sedex Expresso</p>
                            <p className="text-[11px] text-[#6B6A64]">1 a 3 dias úteis</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-[#272727] tabular-nums">R$ 29,90</span>
                      </label>

                      <label
                        className={`p-3 rounded-[8px] border flex items-center justify-between cursor-pointer transition-colors ${
                          selectedShipping?.id === "pac" || !selectedShipping
                            ? "border-[#004AAD] bg-[#EEEDE8]"
                            : "border-[#D6D3CC] bg-white hover:bg-[#EEEDE8]"
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
                                name: "Envio Econômico",
                                price: subtotal >= BRAND_CONFIG.freeShippingThreshold ? 0 : 18.9,
                                originalPrice: 18.9,
                                deadline: "5 a 8 dias úteis",
                                isFree: subtotal >= BRAND_CONFIG.freeShippingThreshold,
                              })
                            }
                            className="accent-[#004AAD]"
                          />
                          <div>
                            <p className="text-xs font-medium text-[#272727]">Envio Econômico</p>
                            <p className="text-[11px] text-[#6B6A64]">5 a 8 dias úteis</p>
                          </div>
                        </div>
                        <span className="text-xs font-medium text-[#272727] tabular-nums">
                          {subtotal >= BRAND_CONFIG.freeShippingThreshold ? (
                            <span className="text-[#0F7A4F]">Grátis</span>
                          ) : (
                            "R$ 18,90"
                          )}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* STEP 3: PAYMENT METHOD (Checkout Pro Mercado Pago) */}
              <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-[#004AAD] text-white text-xs font-medium flex items-center justify-center">
                    3
                  </span>
                  <h2 className="text-sm font-medium text-[#272727]">Pagamento Seguro</h2>
                </div>

                <div className="bg-white border border-[#D6D3CC] rounded-[8px] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#004AAD]/10 text-[#004AAD] flex items-center justify-center font-medium text-xs">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-medium text-[#272727]">
                        Mercado Pago (Checkout Pro Oficial)
                      </span>
                    </div>
                    <span className="text-[10px] text-[#004AAD] bg-[#004AAD]/10 px-2 py-0.5 rounded-[4px] font-medium">
                      Ambiente Seguro SSL
                    </span>
                  </div>

                  <p className="text-xs text-[#6B6A64] leading-relaxed">
                    Você será redirecionado para a tela oficial do Mercado Pago ao clicar no botão de finalizar. Escolha entre <strong>Pix instantâneo</strong>, <strong>Cartão de Crédito em até 10x</strong> ou <strong>Boleto Bancário</strong>.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#D6D3CC] text-[11px] text-[#6B6A64]">
                    <span className="bg-[#EEEDE8] px-2 py-1 rounded-[4px] font-medium">Pix</span>
                    <span className="bg-[#EEEDE8] px-2 py-1 rounded-[4px] font-medium">Cartão de Crédito (até 10x)</span>
                    <span className="bg-[#EEEDE8] px-2 py-1 rounded-[4px] font-medium">Boleto</span>
                  </div>
                </div>

                {/* Gift Wrap & Message Option */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#272727] font-medium">
                    <input
                      type="checkbox"
                      checked={isGift}
                      onChange={(e) => setIsGift(e.target.checked)}
                      className="accent-[#004AAD] rounded"
                    />
                    <span className="flex items-center gap-1.5">
                      <Gift className="w-3.5 h-3.5 text-[#004AAD]" /> É um presente especial? Adicionar cartão afetivo
                    </span>
                  </label>

                  {isGift && (
                    <div className="mt-3 space-y-1.5">
                      <label className="block text-[11px] text-[#6B6A64] font-medium">
                        Mensagem personalizada para o cartão:
                      </label>
                      <textarea
                        value={giftCardMessage}
                        onChange={(e) => setGiftCardMessage(e.target.value)}
                        placeholder="Escreva uma mensagem afetiva para quem vai receber o presente..."
                        rows={3}
                        className="w-full text-xs p-2.5 bg-white rounded-[8px] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 sm:p-6 space-y-4">
                <h2 className="text-sm font-medium text-[#272727] pb-3 border-b border-[#D6D3CC]">
                  Resumo do Pedido ({items.reduce((sum, i) => sum + i.quantity, 0)} itens)
                </h2>

                {/* Items List */}
                <div className="divide-y divide-[#D6D3CC] max-h-72 overflow-y-auto pr-1">
                  {items.map((item) => {
                    const price = item.product.promotionalPrice ?? item.product.price;
                    const isItemPersonalizavel =
                      item.requerArquivo ||
                      item.natureza === "personalizavel" ||
                      item.product?.productType === "personalizavel";

                    return (
                      <div
                        key={`${item.product.id}-${item.selectedVariant?.id || item.cartLineId}`}
                        className="py-3 flex gap-3"
                      >
                        <img
                          src={item.product.images?.[0] || item.imagem}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-[8px] object-cover border border-[#D6D3CC] shrink-0 bg-white"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-[#272727] truncate">
                            {item.product.name}
                          </h4>
                          {(item.selectedVariant || item.variacaoSelecionada) && (
                            <p className="text-[11px] text-[#6B6A64]">
                              Variação: {item.selectedVariant?.name || item.variacaoSelecionada?.nome}
                            </p>
                          )}
                          {isItemPersonalizavel && (
                            <span className="inline-block mt-0.5 text-[10px] text-[#004AAD] font-medium bg-[#004AAD]/10 px-1.5 py-0.5 rounded-[4px]">
                              Personalizado
                            </span>
                          )}
                          <div className="flex items-center justify-between mt-1 text-xs">
                            <span className="text-[#6B6A64] tabular-nums">Qtd: {item.quantity}</span>
                            <span className="font-medium text-[#272727] tabular-nums">
                              R$ {(price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Customizable Items Affective Notice */}
                {hasPersonalizavel && (
                  <div className="p-3 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[8px] text-[11px] text-[#6B6A64] leading-relaxed">
                    <p className="text-[#272727] font-medium mb-0.5">
                      🎨 Detalhes da Personalização
                    </p>
                    Após a confirmação do pedido, nossa equipe alinha fotos e mensagens pelo WhatsApp com você antes da produção.
                  </div>
                )}

                {/* Coupon input */}
                <div className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Cupom de desconto"
                      className="flex-1 text-xs p-2 bg-white rounded-[8px] border border-[#D6D3CC] uppercase text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-3.5 py-2 bg-[#EEEDE8] hover:bg-[#E4E2DD] border border-[#D6D3CC] text-[#272727] text-xs font-medium rounded-[8px] transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between text-xs text-[#0F7A4F] bg-[#EEEDE8] border border-[#D6D3CC] px-3 py-1.5 rounded-[8px]">
                      <span>
                        Cupom <strong>{appliedCoupon.code}</strong> ativo
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-[#9B998F] hover:text-[#9B2C2C] underline text-[11px]"
                      >
                        Remover
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-3 border-t border-[#D6D3CC] space-y-2 text-xs text-[#6B6A64]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="text-[#272727] tabular-nums font-medium">
                      R$ {subtotal.toFixed(2)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-[#0F7A4F] font-medium">
                      <span>Desconto</span>
                      <span className="tabular-nums">- R$ {discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Frete</span>
                    <span className="text-[#272727] tabular-nums font-medium">
                      {shippingPrice === 0 ? (
                        <span className="text-[#0F7A4F]">Grátis</span>
                      ) : (
                        `R$ ${shippingPrice.toFixed(2)}`
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#D6D3CC] flex justify-between items-baseline">
                    <span className="text-sm font-medium text-[#272727]">Total</span>
                    <div className="text-right">
                      <span className="text-xl font-medium text-[#272727] tabular-nums block">
                        R$ {total.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[#6B6A64] block mt-0.5">
                        Parcele em até 10x no cartão
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit / Proceed to Mercado Pago Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 bg-[#004AAD] hover:bg-[#003882] text-white text-xs font-medium rounded-[8px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Conectando ao Mercado Pago...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Ir para o Pagamento Seguro</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-[#9B998F]">
                  Ao finalizar, você será redirecionado para a página segura do Mercado Pago.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
