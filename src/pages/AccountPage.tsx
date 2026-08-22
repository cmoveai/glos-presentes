import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useCart } from "../context/CartContext";
import { getOrders, trackPackage, fetchAddressByCep } from "../services/api";
import { Order, OrderStatus, Product, Address } from "../types";
import { ProductCard } from "../components/common/ProductCard";
import { BRAND_CONFIG } from "../config/brand";
import {
  User,
  Package,
  Heart,
  LogOut,
  MapPin,
  Clock,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Truck,
  X,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  ExternalLink,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Tag,
  HelpCircle,
  ChevronRight,
  RotateCcw,
  Receipt,
  Search,
  AlertCircle,
  CreditCard,
} from "lucide-react";

interface AccountPageProps {
  initialTab?: "overview" | "orders" | "favorites" | "addresses" | "profile" | "coupons" | "help";
  onNavigateCatalog: () => void;
  onNavigateProduct: (slug: string) => void;
  onQuickView: (product: Product) => void;
  onOpenAuthModal: () => void;
}

type TabType = "overview" | "orders" | "favorites" | "addresses" | "profile" | "coupons" | "help";

export const AccountPage: React.FC<AccountPageProps> = ({
  initialTab = "overview",
  onNavigateCatalog,
  onNavigateProduct,
  onQuickView,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated, logout, updateProfile, addAddress, updateAddress, deleteAddress, setDefaultAddress, login, loginWithGoogle } = useAuth();
  const { favoriteProducts } = useFavorites();
  const { addToCart, openCart } = useCart();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");

  // Tracking Modal State
  const [trackingModalData, setTrackingModalData] = useState<{
    orderId: string;
    trackingCode: string;
    carrier: string;
    status: string;
    estimatedDelivery: string;
    checkpoints: Array<{
      status: string;
      title: string;
      description: string;
      location: string;
      date: string;
      completed: boolean;
      current?: boolean;
    }>;
  } | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  // Pix Modal for Pending Orders
  const [pixModalOrder, setPixModalOrder] = useState<Order | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Order Details Modal
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);

  // Address Modal State (Add/Edit)
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    recipientName: "",
    zipCode: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    phone: "",
    isDefault: false,
  });
  const [loadingCep, setLoadingCep] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);

  // Copied coupon code feedback
  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  // Load orders on mount or user change
  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const data = await getOrders(user?.email);
        setOrders(data);
      } catch (e) {
        console.warn("Erro ao buscar pedidos:", e);
      } finally {
        setLoadingOrders(false);
      }
    };
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, user?.email]);

  // Sync profile form
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        cpf: user.cpf || "",
      });
    }
  }, [user]);

  const handleOpenTracking = async (order: Order) => {
    const code = order.trackingCode || `BR${order.id.replace(/\D/g, "").slice(0, 9)}SP`;
    setLoadingTracking(true);
    try {
      const data = await trackPackage(code);
      setTrackingModalData({
        orderId: order.id,
        ...data,
      });
    } catch (e) {
      console.warn("Tracking error:", e);
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const data = await fetchAddressByCep(cleanCep);
        if (data) {
          setAddressForm((prev) => ({
            ...prev,
            street: data.street || prev.street,
            neighborhood: data.neighborhood || prev.neighborhood,
            city: data.city || prev.city,
            state: data.state || prev.state,
          }));
        }
      } catch (err) {
        console.warn("Erro ao consultar CEP:", err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleOpenAddressModal = (address?: Address) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        recipientName: address.recipientName,
        zipCode: address.zipCode,
        street: address.street,
        number: address.number,
        complement: address.complement || "",
        neighborhood: address.neighborhood,
        city: address.city,
        state: address.state,
        phone: address.phone,
        isDefault: address.isDefault || false,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        recipientName: user?.name || "",
        zipCode: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: "SP",
        phone: user?.phone || "",
        isDefault: (user?.addresses || []).length === 0,
      });
    }
    setAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.street || !addressForm.zipCode || !addressForm.number || !addressForm.city) {
      alert("Por favor, preencha todos os campos obrigatórios do endereço.");
      return;
    }

    if (editingAddressId) {
      updateAddress({
        id: editingAddressId,
        ...addressForm,
      });
    } else {
      addAddress(addressForm);
    }
    setAddressModalOpen(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    updateProfile(profileForm);
    setTimeout(() => {
      setIsSavingProfile(false);
      setProfileSavedSuccess(true);
      setTimeout(() => setProfileSavedSuccess(false), 3000);
    }, 400);
  };

  const handleCopyPix = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(null), 2500);
  };

  const handleBuyAgain = (order: Order) => {
    order.items.forEach((item) => {
      addToCart(
        {
          id: item.productId,
          slug: item.productId,
          name: item.name,
          shortDescription: "",
          description: "",
          category: "presentes-criativos",
          categoryName: "Presentes",
          price: item.price,
          installments: 3,
          images: [item.image],
          stock: 10,
          sku: item.sku,
          specifications: {},
        },
        item.quantity
      );
    });
    openCart();
  };

  const handleOpenWhatsAppHelp = (orderId?: string) => {
    const text = orderId
      ? `Olá! Gostaria de tirar uma dúvida sobre o meu Pedido #${orderId} na loja Ativva.`
      : `Olá! Gostaria de atendimento sobre a minha conta na loja Ativva.`;
    window.open(`https://wa.me/${BRAND_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 sm:p-6 bg-stone-50">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-stone-950 text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <User className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-stone-950 text-center mb-1.5 tracking-tight">Portal do Cliente</h2>
          <p className="text-xs text-stone-500 text-center mb-6 leading-relaxed">
            Acompanhe seus pedidos em tempo real, rastreie entregas, gerencie seus endereços e acesse cupons exclusivos.
          </p>

          <div className="space-y-3">
            {/* Quick Demo/Google Login for Fast Access */}
            <button
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full py-3 px-4 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold rounded-xl border border-stone-300 flex items-center justify-center gap-3 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Acessar com Google</span>
            </button>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className="w-full py-3 px-4 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" /> Entrar com E-mail ou Cadastrar
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-[11px] text-stone-400">
                <span className="bg-white px-2">Acesso Rápido de Teste</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => login("cliente.demonstracao@gmail.com", "Cliente Teste")}
              className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl border border-stone-200 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Entrar como Cliente Exemplo (1 Clique)</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 text-center">
            <button
              onClick={onNavigateCatalog}
              className="text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors underline"
            >
              ← Voltar e continuar navegando na loja
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "ENTREGUE":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Entregue
          </span>
        );
      case "ENVIADO":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Em Transporte
          </span>
        );
      case "EM_SEPARACAO":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Em Separação
          </span>
        );
      case "PAGAMENTO_CONFIRMADO":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Pago / Aprovado
          </span>
        );
      case "CANCELADO":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Cancelado
          </span>
        );
      case "PEDIDO_REALIZADO":
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Aguardando Pagamento
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((ord) => {
    const matchesFilter =
      orderStatusFilter === "all" ||
      (orderStatusFilter === "in_progress" && ["PEDIDO_REALIZADO", "PAGAMENTO_CONFIRMADO", "EM_SEPARACAO", "ENVIADO"].includes(ord.status)) ||
      (orderStatusFilter === "delivered" && ord.status === "ENTREGUE") ||
      (orderStatusFilter === "cancelled" && ord.status === "CANCELADO");

    const matchesSearch =
      orderSearchQuery.trim() === "" ||
      ord.id.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      ord.items.some((it) => it.name.toLowerCase().includes(orderSearchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const activeOrdersCount = orders.filter((o) => ["PEDIDO_REALIZADO", "PAGAMENTO_CONFIRMADO", "EM_SEPARACAO", "ENVIADO"].includes(o.status)).length;
  const latestOrder = orders.length > 0 ? orders[0] : null;

  return (
    <div className="bg-stone-50 min-h-screen py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* TOP WELCOME BANNER */}
        <div className="bg-stone-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-stone-950/10">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-stone-950 flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-amber-500/20">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Olá, {user?.name?.split(" ")[0]}!
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                    Cliente Ativva
                  </span>
                </div>
                <p className="text-xs text-stone-300">
                  {user?.email} • Gerencie seus pedidos, dados cadastrais e benefícios em um só lugar.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab("orders")}
                className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-stone-100 text-stone-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Package className="w-4 h-4" /> Meus Pedidos
              </button>
              <button
                onClick={logout}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                title="Sair da Conta"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>
        </div>

        {/* MAIN LAYOUT WITH NAVIGATION SIDEBAR & TAB CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* NAVIGATION SIDEBAR */}
          <aside className="lg:col-span-3 space-y-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-400 px-3 py-2">
                Painel do Cliente
              </p>

              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  activeTab === "overview" ? "bg-stone-950 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> Visão Geral
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === "overview" ? "opacity-100" : "opacity-40"}`} />
              </button>

              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  activeTab === "orders" ? "bg-stone-950 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Package className="w-4 h-4" /> Meus Pedidos
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeTab === "orders" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"}`}>
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("favorites")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  activeTab === "favorites" ? "bg-stone-950 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Heart className="w-4 h-4 text-rose-500" /> Lista de Desejos
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeTab === "favorites" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"}`}>
                  {favoriteProducts.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("addresses")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  activeTab === "addresses" ? "bg-stone-950 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-500" /> Endereços de Entrega
                </span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeTab === "addresses" ? "bg-white/20 text-white" : "bg-stone-100 text-stone-700"}`}>
                  {user?.addresses?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  activeTab === "profile" ? "bg-stone-950 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-purple-500" /> Meus Dados Pessoais
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === "profile" ? "opacity-100" : "opacity-40"}`} />
              </button>

              <button
                onClick={() => setActiveTab("coupons")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  activeTab === "coupons" ? "bg-stone-950 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-emerald-500" /> Cupons & Benefícios
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded">
                  Ativos
                </span>
              </button>

              <button
                onClick={() => setActiveTab("help")}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  activeTab === "help" ? "bg-stone-950 text-white shadow-xs" : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 text-amber-500" /> Ajuda & Suporte
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${activeTab === "help" ? "opacity-100" : "opacity-40"}`} />
              </button>
            </div>

            {/* QUICK CONTACT CARD */}
            <div className="bg-stone-100 rounded-2xl p-4 text-xs text-stone-600 space-y-3 border border-stone-200">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <MessageSquare className="w-4 h-4 text-stone-800" /> Precisa de Ajuda?
              </div>
              <p className="text-[11px] leading-relaxed">
                Nosso time de atendimento está disponível de Seg a Sex, das 09h às 18h.
              </p>
              <button
                onClick={() => handleOpenWhatsAppHelp()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-center flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Falar no WhatsApp
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT PANELS */}
          <main className="lg:col-span-9 space-y-6">
            
            {/* 1. OVERVIEW DASHBOARD */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* 4 STATS CARDS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div
                    onClick={() => setActiveTab("orders")}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-400 transition cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-900 flex items-center justify-center mb-2">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-extrabold text-stone-950 block">{orders.length}</span>
                    <span className="text-xs text-stone-500 font-medium">Pedidos Realizados</span>
                  </div>

                  <div
                    onClick={() => setActiveTab("orders")}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-400 transition cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-extrabold text-stone-950 block">{activeOrdersCount}</span>
                    <span className="text-xs text-stone-500 font-medium">Em Andamento</span>
                  </div>

                  <div
                    onClick={() => setActiveTab("favorites")}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-400 transition cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2">
                      <Heart className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-extrabold text-stone-950 block">{favoriteProducts.length}</span>
                    <span className="text-xs text-stone-500 font-medium">Itens Favoritos</span>
                  </div>

                  <div
                    onClick={() => setActiveTab("addresses")}
                    className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-stone-400 transition cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-extrabold text-stone-950 block">{user?.addresses?.length || 0}</span>
                    <span className="text-xs text-stone-500 font-medium">Endereços Salvos</span>
                  </div>
                </div>

                {/* HIGHLIGHT: LATEST ORDER */}
                {latestOrder ? (
                  <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                      <div>
                        <span className="text-xs uppercase tracking-wider font-bold text-stone-400 block mb-1">
                          Último Pedido em Andamento
                        </span>
                        <div className="flex items-center gap-3">
                          <h3 className="font-mono font-bold text-stone-950 text-base">
                            Pedido #{latestOrder.id}
                          </h3>
                          {getStatusBadge(latestOrder.status)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-stone-500 block">Total do Pedido</span>
                        <span className="text-base font-extrabold text-stone-950">
                          R$ {latestOrder.total.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* STATUS TIMELINE PROGRESS */}
                    <div className="py-2">
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-stone-600 mb-2">
                        <span className={latestOrder.status ? "text-stone-950" : ""}>1. Pedido Criado</span>
                        <span className={["PAGAMENTO_CONFIRMADO", "EM_SEPARACAO", "ENVIADO", "ENTREGUE"].includes(latestOrder.status) ? "text-emerald-700" : ""}>
                          2. Aprovado
                        </span>
                        <span className={["EM_SEPARACAO", "ENVIADO", "ENTREGUE"].includes(latestOrder.status) ? "text-blue-700" : ""}>
                          3. Envio
                        </span>
                        <span className={latestOrder.status === "ENTREGUE" ? "text-emerald-700" : ""}>
                          4. Entregue
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full transition-all duration-500 ${
                            latestOrder.status === "ENTREGUE"
                              ? "w-full bg-emerald-600"
                              : latestOrder.status === "ENVIADO"
                              ? "w-3/4 bg-blue-600"
                              : latestOrder.status === "EM_SEPARACAO" || latestOrder.status === "PAGAMENTO_CONFIRMADO"
                              ? "w-1/2 bg-teal-600"
                              : "w-1/4 bg-amber-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {latestOrder.paymentMethod === "pix" && latestOrder.status === "PEDIDO_REALIZADO" && (
                          <button
                            onClick={() => setPixModalOrder(latestOrder)}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition"
                          >
                            <QrCode className="w-4 h-4" /> Pagar com PIX Agora
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenTracking(latestOrder)}
                          disabled={loadingTracking}
                          className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition"
                        >
                          <Truck className="w-4 h-4" /> Rastrear Entrega
                        </button>
                        <button
                          onClick={() => setSelectedOrderDetails(latestOrder)}
                          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition"
                        >
                          Ver Detalhes
                        </button>
                      </div>

                      <button
                        onClick={() => handleOpenWhatsAppHelp(latestOrder.id)}
                        className="text-xs text-stone-600 hover:text-stone-950 font-bold flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Dúvidas sobre o pedido?
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center space-y-4 shadow-2xs">
                    <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
                    <div>
                      <h3 className="font-bold text-stone-900 text-base mb-1">Nenhum pedido realizado ainda</h3>
                      <p className="text-xs text-stone-500 max-w-md mx-auto">
                        Explore nossa curadoria especial de presentes e itens para casa e faça sua primeira compra com entrega garantida para todo o Brasil.
                      </p>
                    </div>
                    <button
                      onClick={onNavigateCatalog}
                      className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition"
                    >
                      Explorar Produtos da Loja
                    </button>
                  </div>
                )}

                {/* BANNER WITH ACTIVE COUPON */}
                <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <Tag className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                        Cupom Exclusivo de Boas-Vindas
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">Ganhe 10% OFF no seu próximo pedido</h3>
                    <p className="text-xs text-stone-300">
                      Use o cupom <span className="font-mono font-bold text-white">BEMVINDO10</span> na finalização da sua compra.
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopyCoupon("BEMVINDO10")}
                    className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    {copiedCoupon === "BEMVINDO10" ? (
                      <>
                        <Check className="w-4 h-4 text-stone-950" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-stone-950" /> Copiar Código
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 2. ORDERS TAB */}
            {activeTab === "orders" && (
              <div className="space-y-5">
                {/* Header and filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-stone-950">Histórico de Pedidos</h2>
                    <p className="text-xs text-stone-500">
                      {filteredOrders.length} {filteredOrders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
                    </p>
                  </div>

                  {/* Status Filters */}
                  <div className="flex flex-wrap items-center gap-1.5 bg-stone-200/60 p-1 rounded-xl text-xs">
                    <button
                      onClick={() => setOrderStatusFilter("all")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        orderStatusFilter === "all" ? "bg-white text-stone-950 shadow-xs" : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Todos ({orders.length})
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter("in_progress")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        orderStatusFilter === "in_progress" ? "bg-white text-stone-950 shadow-xs" : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Em Andamento ({activeOrdersCount})
                    </button>
                    <button
                      onClick={() => setOrderStatusFilter("delivered")}
                      className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                        orderStatusFilter === "delivered" ? "bg-white text-stone-950 shadow-xs" : "text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      Entregues
                    </button>
                  </div>
                </div>

                {/* Search orders */}
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Buscar por número do pedido (#PED-...) ou nome do item..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-none focus:border-stone-950 transition"
                  />
                  {orderSearchQuery && (
                    <button
                      onClick={() => setOrderSearchQuery("")}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {loadingOrders ? (
                  <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3">
                    <Clock className="w-8 h-8 text-stone-400 animate-spin mx-auto" />
                    <p className="text-xs text-stone-500 font-medium">Carregando seus pedidos...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-3 shadow-2xs">
                    <Package className="w-12 h-12 text-stone-300 mx-auto mb-2" />
                    <h3 className="font-bold text-stone-900 text-base">Nenhum pedido encontrado</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      {orderSearchQuery || orderStatusFilter !== "all"
                        ? "Nenhum pedido corresponde aos filtros aplicados. Tente limpar a busca."
                        : "Você ainda não possui pedidos concluídos. Explore nossa loja e presenteie com afeto!"}
                    </p>
                    {orderSearchQuery ? (
                      <button
                        onClick={() => {
                          setOrderSearchQuery("");
                          setOrderStatusFilter("all");
                        }}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition"
                      >
                        Limpar Filtros
                      </button>
                    ) : (
                      <button
                        onClick={onNavigateCatalog}
                        className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition"
                      >
                        Descobrir Produtos
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-2xs space-y-4 hover:border-stone-300 transition"
                      >
                        {/* ORDER HEADER */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-stone-950">
                                Pedido #{ord.id}
                              </span>
                              <span className="text-[10px] text-stone-400">•</span>
                              <span className="text-xs text-stone-500">
                                {new Date(ord.createdAt).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-stone-500">
                                Pagamento:{" "}
                                <strong className="text-stone-800 capitalize">
                                  {ord.paymentMethod === "pix"
                                    ? "PIX Instantâneo"
                                    : ord.paymentMethod === "credit_card"
                                    ? `Cartão de Crédito (${ord.paymentDetails?.installments || 1}x)`
                                    : "Boleto"}
                                </strong>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {getStatusBadge(ord.status)}
                            <span className="text-base font-extrabold text-stone-950">
                              R$ {ord.total.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* ORDER ITEMS LIST */}
                        <div className="divide-y divide-stone-50">
                          {ord.items.map((item, idx) => (
                            <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0"
                                />
                                <div>
                                  <h4 className="font-bold text-stone-900 line-clamp-1">{item.name}</h4>
                                  <p className="text-[11px] text-stone-500">
                                    Qtd: <strong>{item.quantity}</strong> • R$ {item.price.toFixed(2)} un
                                    {item.variantName && ` • Cor/Modelo: ${item.variantName}`}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-stone-900">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* GIFT WRAP & MESSAGE IF ANY */}
                        {(ord.giftWrap || ord.giftCardMessage) && (
                          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              Pedido com Embalagem & Cartão de Presente
                            </div>
                            {ord.giftCardMessage && (
                              <p className="text-[11px] italic text-amber-800">
                                "{ord.giftCardMessage}"
                              </p>
                            )}
                          </div>
                        )}

                        {/* FOOTER ACTIONS */}
                        <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="text-stone-600">
                            <span className="font-bold text-stone-800">Envio:</span> {ord.shippingOption?.name || "Frete Padrão"} ({ord.shippingOption?.deadline || "Prazo informado"})
                            {ord.trackingCode && (
                              <span className="ml-2 font-mono font-bold text-emerald-700">
                                [{ord.trackingCode}]
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* PIX PAY BUTTON IF PENDING */}
                            {ord.paymentMethod === "pix" && ord.status === "PEDIDO_REALIZADO" && (
                              <button
                                onClick={() => setPixModalOrder(ord)}
                                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
                              >
                                <QrCode className="w-3.5 h-3.5" /> Pagar com PIX
                              </button>
                            )}

                            {/* TRACK PACKAGE */}
                            <button
                              onClick={() => handleOpenTracking(ord)}
                              disabled={loadingTracking}
                              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                            >
                              <Truck className="w-3.5 h-3.5" /> Rastrear
                            </button>

                            {/* ORDER RECEIPT / DETAILS */}
                            <button
                              onClick={() => setSelectedOrderDetails(ord)}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                            >
                              <Receipt className="w-3.5 h-3.5" /> Comprovante
                            </button>

                            {/* BUY AGAIN */}
                            <button
                              onClick={() => handleBuyAgain(ord)}
                              className="px-3 py-1.5 bg-white border border-stone-200 hover:bg-stone-50 text-stone-900 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                              title="Adicionar itens novamente ao carrinho"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Repetir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. FAVORITES / WISHLIST TAB */}
            {activeTab === "favorites" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-stone-950">Lista de Desejos</h2>
                    <p className="text-xs text-stone-500">
                      {favoriteProducts.length} {favoriteProducts.length === 1 ? "produto salvo" : "produtos salvos"}
                    </p>
                  </div>
                  {favoriteProducts.length > 0 && (
                    <button
                      onClick={onNavigateCatalog}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold rounded-xl transition"
                    >
                      Adicionar Mais Itens
                    </button>
                  )}
                </div>

                {favoriteProducts.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4 shadow-2xs">
                    <Heart className="w-12 h-12 text-stone-300 mx-auto" />
                    <div>
                      <h3 className="font-bold text-stone-900 text-base mb-1">Sua lista de desejos está vazia</h3>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        Clique no ícone de coração em qualquer presente ou item da loja para salvar nesta lista e comprar quando quiser.
                      </p>
                    </div>
                    <button
                      onClick={onNavigateCatalog}
                      className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition"
                    >
                      Explorar Produtos da Loja
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favoriteProducts.map((prod) => (
                      <ProductCard
                        key={prod.id}
                        product={prod}
                        onQuickView={onQuickView}
                        onNavigateToProduct={onNavigateProduct}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. ADDRESSES TAB (CRUD) */}
            {activeTab === "addresses" && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-stone-950">Endereços de Entrega</h2>
                    <p className="text-xs text-stone-500">
                      Cadastre e gerencie seus locais de entrega para agilizar suas compras no checkout.
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenAddressModal()}
                    className="px-4 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Novo Endereço
                  </button>
                </div>

                {(!user?.addresses || user.addresses.length === 0) ? (
                  <div className="bg-white p-10 rounded-3xl border border-stone-200 text-center space-y-3">
                    <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
                    <h3 className="font-bold text-stone-900 text-base">Nenhum endereço cadastrado</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Adicione seu endereço principal para cálculo instantâneo de frete no checkout.
                    </p>
                    <button
                      onClick={() => handleOpenAddressModal()}
                      className="px-5 py-2.5 bg-stone-950 text-white font-bold text-xs rounded-xl"
                    >
                      Cadastrar Primeiro Endereço
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-white rounded-2xl p-5 border transition space-y-3 relative ${
                          addr.isDefault
                            ? "border-stone-950 ring-1 ring-stone-950 shadow-xs"
                            : "border-stone-200 hover:border-stone-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-950 text-sm">{addr.recipientName}</span>
                            {addr.isDefault && (
                              <span className="px-2 py-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-full">
                                Principal
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenAddressModal(addr)}
                              className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition"
                              title="Editar endereço"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Deseja realmente remover este endereço?")) {
                                  deleteAddress(addr.id);
                                }
                              }}
                              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Excluir endereço"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-stone-600 space-y-1">
                          <p>{addr.street}, nº {addr.number} {addr.complement ? `- ${addr.complement}` : ""}</p>
                          <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
                          <p className="font-mono text-stone-500">CEP: {addr.zipCode}</p>
                          {addr.phone && <p className="text-[11px] text-stone-500">Contato: {addr.phone}</p>}
                        </div>

                        {!addr.isDefault && (
                          <div className="pt-2 border-t border-stone-100">
                            <button
                              onClick={() => setDefaultAddress(addr.id)}
                              className="text-xs text-stone-700 hover:text-stone-950 font-bold transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" /> Definir como Endereço Principal
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. PROFILE & PERSONAL DATA TAB */}
            {activeTab === "profile" && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-950">Meus Dados Pessoais</h2>
                  <p className="text-xs text-stone-500">
                    Mantenha suas informações cadastrais atualizadas para emissão correta de notas e contatos de entrega.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1.5">Nome Completo</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full p-3 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none bg-stone-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1.5">E-mail Cadastrado</label>
                      <input
                        type="email"
                        required
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full p-3 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none bg-stone-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1.5">Telefone / WhatsApp</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="w-full p-3 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none bg-stone-50/50"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1.5">CPF (Documento)</label>
                      <input
                        type="text"
                        value={profileForm.cpf}
                        onChange={(e) => setProfileForm({ ...profileForm, cpf: e.target.value })}
                        placeholder="000.000.000-00"
                        className="w-full p-3 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none bg-stone-50/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-stone-500 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Seus dados estão protegidos por criptografia.
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-2"
                    >
                      {isSavingProfile ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" /> Salvando...
                        </>
                      ) : profileSavedSuccess ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" /> Salvo com Sucesso!
                        </>
                      ) : (
                        "Salvar Alterações"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* 6. COUPONS & BENEFITS TAB */}
            {activeTab === "coupons" && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-stone-950">Cupons & Benefícios Disponíveis</h2>
                  <p className="text-xs text-stone-500">
                    Aproveite os descontos especiais para sua próxima compra na loja.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Coupon 1 */}
                  <div className="bg-white border-2 border-dashed border-amber-300 rounded-3xl p-5 shadow-2xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                        10% DE DESCONTO
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">Sem valor mínimo</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-base">Boas-Vindas à Loja</h4>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Válido para qualquer produto da nossa curadoria.
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <span className="font-mono font-extrabold text-stone-900 text-sm">BEMVINDO10</span>
                      <button
                        onClick={() => handleCopyCoupon("BEMVINDO10")}
                        className="px-3 py-1 bg-stone-900 text-white font-bold text-xs rounded-lg hover:bg-stone-800 transition flex items-center gap-1.5"
                      >
                        {copiedCoupon === "BEMVINDO10" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCoupon === "BEMVINDO10" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>

                  {/* Coupon 2 */}
                  <div className="bg-white border-2 border-dashed border-emerald-300 rounded-3xl p-5 shadow-2xs space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                        FRETE GRÁTIS
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">Acima de R$ 249</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-base">Frete Especial Brasil</h4>
                      <p className="text-xs text-stone-600 mt-0.5">
                        Envio econômico grátis para compras acima do valor mínimo.
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      <span className="font-mono font-extrabold text-stone-900 text-sm">FRETEGRATIS</span>
                      <button
                        onClick={() => handleCopyCoupon("FRETEGRATIS")}
                        className="px-3 py-1 bg-stone-900 text-white font-bold text-xs rounded-lg hover:bg-stone-800 transition flex items-center gap-1.5"
                      >
                        {copiedCoupon === "FRETEGRATIS" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedCoupon === "FRETEGRATIS" ? "Copiado!" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. HELP & FAQ TAB */}
            {activeTab === "help" && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-stone-950">Central de Ajuda & Dúvidas Frequentes</h2>
                  <p className="text-xs text-stone-500">
                    Respostas rápidas para as principais dúvidas sobre pedidos, envios e trocas.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h4 className="font-bold text-stone-900 text-sm mb-1">Como acompanhar o rastreio do meu pedido?</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Assim que o pacote for despachado pela transportadora, o código de rastreio aparecerá na aba "Meus Pedidos". Você pode clicar em "Rastrear" para ver a linha do tempo completa de entregas.
                    </p>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h4 className="font-bold text-stone-900 text-sm mb-1">Como funciona a troca ou devolução?</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Conforme o Código de Defesa do Consumidor, você tem até 7 dias corridos após o recebimento para solicitar a devolução ou troca sem custos. Basta entrar em contato pelo nosso WhatsApp com o número do pedido.
                    </p>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h4 className="font-bold text-stone-900 text-sm mb-1">Quais as formas de pagamento aceitas?</h4>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      Aceitamos PIX Instantâneo com desconto especial, e Cartão de Crédito em até 12x (com até 10x sem juros) processado com máxima segurança via Mercado Pago.
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-stone-600">
                    Ainda tem dúvidas? Fale diretamente com a nossa equipe de suporte.
                  </div>
                  <button
                    onClick={() => handleOpenWhatsAppHelp()}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4" /> Abrir Atendimento no WhatsApp
                  </button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* TRACKING TIMELINE MODAL */}
      {trackingModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-950 text-sm sm:text-base">
                    Rastreamento da Encomenda
                  </h3>
                  <p className="text-[11px] text-stone-500 font-mono">
                    Código: {trackingModalData.trackingCode}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setTrackingModalData(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-500 block text-[11px]">Transportadora</span>
                <span className="font-bold text-stone-900">{trackingModalData.carrier}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block text-[11px]">Previsão de Entrega</span>
                <span className="font-bold text-emerald-700">{trackingModalData.estimatedDelivery}</span>
              </div>
            </div>

            <div className="space-y-4 py-2">
              {trackingModalData.checkpoints.map((cp, idx) => (
                <div key={idx} className="flex gap-3 relative">
                  {idx !== trackingModalData.checkpoints.length - 1 && (
                    <div
                      className={`absolute left-3.5 top-6 bottom-0 w-0.5 ${
                        cp.completed ? "bg-stone-950" : "bg-stone-200"
                      }`}
                    />
                  )}

                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      cp.current
                        ? "bg-amber-500 text-white ring-4 ring-amber-100"
                        : cp.completed
                        ? "bg-stone-950 text-white"
                        : "bg-stone-200 text-stone-400"
                    }`}
                  >
                    {cp.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="flex-1 text-xs pb-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="font-bold text-stone-900">{cp.title}</h4>
                      <span className="text-[10px] text-stone-500 shrink-0">{cp.date}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5">{cp.description}</p>
                    <p className="text-[10px] text-stone-400 font-medium flex items-center gap-1 mt-1">
                      <MapPin className="w-2.5 h-2.5" /> {cp.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setTrackingModalData(null)}
              className="w-full py-3 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* PIX QR CODE MODAL FOR PENDING ORDERS */}
      {pixModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-950 text-sm">Pagar Pedido via PIX</h3>
                  <span className="text-[11px] font-mono text-stone-500">Pedido #{pixModalOrder.id}</span>
                </div>
              </div>

              <button
                onClick={() => setPixModalOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs">
              <span className="text-stone-500 block">Valor a Pagar</span>
              <span className="text-2xl font-extrabold text-stone-950">
                R$ {pixModalOrder.total.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-center py-2">
              <div className="p-3 bg-white border-2 border-stone-900 rounded-2xl shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    pixModalOrder.paymentDetails?.pixCode || "00020126580014BR.GOV.BCB.PIX0136pix@ativvastore.com.br5204000053039865405"
                  )}`}
                  alt="QR Code Pix"
                  className="w-44 h-44 mx-auto"
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-stone-600">
                Abra o app do seu banco, escolha <strong>Pagar com Pix</strong> e aponte a câmera ou use o código abaixo:
              </p>
              <button
                onClick={() =>
                  handleCopyPix(
                    pixModalOrder.paymentDetails?.pixCode ||
                      "00020126580014BR.GOV.BCB.PIX0136pix@ativvastore.com.br52040000530398654055802BR5912ATIVVA_GIFTS6009SAO_PAULO62070503***6304ABCD"
                  )
                }
                className="w-full py-3 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                {copiedPix ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Código Pix Copiado com Sucesso!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copiar Código Pix (Copia e Cola)
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Confirmação e baixa automática em segundos após o pagamento.
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAILS & RECEIPT MODAL */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-stone-950 text-base">Comprovante do Pedido</h3>
                <p className="text-xs font-mono text-stone-500">#{selectedOrderDetails.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Customer & Shipping info */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-200">
                <div>
                  <span className="text-stone-500 block text-[11px]">Destinatário</span>
                  <strong className="text-stone-900">{selectedOrderDetails.customer?.name}</strong>
                  <p className="text-[11px] text-stone-500">{selectedOrderDetails.customer?.phone}</p>
                </div>
                <div>
                  <span className="text-stone-500 block text-[11px]">Data da Compra</span>
                  <strong className="text-stone-900">
                    {new Date(selectedOrderDetails.createdAt).toLocaleString("pt-BR")}
                  </strong>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <span className="font-bold text-stone-900 block text-xs">Itens Comprados</span>
                <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden p-2">
                  {selectedOrderDetails.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <img src={it.image} alt="" className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                        <div>
                          <p className="font-bold text-stone-900">{it.name}</p>
                          <span className="text-[11px] text-stone-500">
                            Qtd: {it.quantity} • R$ {it.price.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <strong className="text-stone-900">R$ {(it.price * it.quantity).toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Breakdown */}
              <div className="p-3.5 bg-stone-50 rounded-2xl space-y-1.5 text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal dos Produtos</span>
                  <span>R$ {selectedOrderDetails.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete ({selectedOrderDetails.shippingOption?.name})</span>
                  <span>
                    {selectedOrderDetails.shippingPrice === 0 ? "Grátis" : `R$ ${selectedOrderDetails.shippingPrice.toFixed(2)}`}
                  </span>
                </div>
                {selectedOrderDetails.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Desconto Aplicado</span>
                    <span>- R$ {selectedOrderDetails.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-stone-200 flex justify-between font-extrabold text-sm text-stone-950">
                  <span>Total Pago</span>
                  <span>R$ {selectedOrderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs rounded-xl transition"
              >
                Imprimir Recibo
              </button>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="flex-1 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT ADDRESS MODAL */}
      {addressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-stone-950 text-base">
                {editingAddressId ? "Editar Endereço" : "Novo Endereço de Entrega"}
              </h3>
              <button
                onClick={() => setAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nome do Destinatário</label>
                <input
                  type="text"
                  required
                  value={addressForm.recipientName}
                  onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                  placeholder="Ex: Seu Nome ou de quem vai receber o presente"
                  className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    CEP {loadingCep && <span className="text-amber-600 text-[10px] font-normal">(Buscando...)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.zipCode}
                    onChange={(e) => {
                      setAddressForm({ ...addressForm, zipCode: e.target.value });
                      handleCepLookup(e.target.value);
                    }}
                    placeholder="00000-000"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Telefone de Contato</label>
                  <input
                    type="tel"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-stone-700 mb-1">Rua / Avenida</label>
                  <input
                    type="text"
                    required
                    value={addressForm.street}
                    onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                    placeholder="Ex: Rua das Flores"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Número</label>
                  <input
                    type="text"
                    required
                    value={addressForm.number}
                    onChange={(e) => setAddressForm({ ...addressForm, number: e.target.value })}
                    placeholder="123"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    value={addressForm.complement}
                    onChange={(e) => setAddressForm({ ...addressForm, complement: e.target.value })}
                    placeholder="Apto 42, Bloco B (Opcional)"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Bairro</label>
                  <input
                    type="text"
                    required
                    value={addressForm.neighborhood}
                    onChange={(e) => setAddressForm({ ...addressForm, neighborhood: e.target.value })}
                    placeholder="Bairro"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-stone-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Cidade"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Estado (UF)</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value.toUpperCase() })}
                    placeholder="SP"
                    className="w-full p-2.5 rounded-xl border border-stone-200 focus:border-stone-950 focus:outline-none uppercase text-center font-bold"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded border-stone-300 text-stone-950 focus:ring-stone-950"
                />
                <span className="font-bold text-stone-800 text-xs">Definir como meu endereço principal</span>
              </label>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition"
                >
                  Salvar Endereço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
