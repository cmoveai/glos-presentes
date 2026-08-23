import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getOrders, aprovarMockupPedido, solicitarAjusteMockupPedido, trackPackage } from "../services/api";
import { Order } from "../types";
import { BRAND_CONFIG } from "../config/brand";
import {
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  ChevronRight,
  LogOut,
  Send,
  MessageSquare,
  ZoomIn,
  X,
  User,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface AccountPageProps {
  initialTab?: "orders" | "profile";
  onNavigateCatalog: () => void;
  onNavigateProduct: (slug: string) => void;
  onOpenAuthModal: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
  initialTab = "orders",
  onNavigateCatalog,
  onNavigateProduct,
  onOpenAuthModal,
}) => {
  const { user, isAuthenticated, logout, login, loginWithGoogle, register, updateProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<"orders" | "profile">(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Auth form states (quando deslogado)
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Mockup Approval & Adjustment state
  const [isApproving, setIsApproving] = useState(false);
  const [showAdjustInput, setShowAdjustInput] = useState(false);
  const [adjustComment, setAdjustComment] = useState("");
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [zoomMockupUrl, setZoomMockupUrl] = useState<string | null>(null);

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

  // Profile Edit State
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  // Carregar pedidos do cliente
  const loadOrders = async () => {
    if (!isAuthenticated) return;
    setLoadingOrders(true);
    try {
      const data = await getOrders(user?.email, user?.id);
      setOrders(data);
      if (selectedOrder) {
        const updated = data.find((o) => o.id === selectedOrder.id || o.orderNumber === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (e) {
      console.warn("Erro ao buscar pedidos:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      if (user) {
        setProfileName(user.name || "");
        setProfilePhone(user.phone || "");
      }
    }
  }, [isAuthenticated, user?.email, user?.id]);

  // Formatação de data em "DD mmm, AA"
  const formatDate = (isoOrDate?: string) => {
    if (!isoOrDate) return "";
    try {
      const d = new Date(isoOrDate);
      if (isNaN(d.getTime())) return isoOrDate;
      const day = String(d.getDate()).padStart(2, "0");
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const month = months[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day} ${month}, ${year}`;
    } catch {
      return isoOrDate;
    }
  };

  // Formatação de moeda em BRL
  const formatCurrency = (val?: number) => {
    return (val ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  // Tradução dos status internos para linguagem amigável do cliente
  const getClientStatusInfo = (order: Order) => {
    const statusPedido = order.statusPedido || "aguardando_pagamento";
    const aprovacao = order.aprovacaoMockup;

    if (order.statusPagamento === "aguardando_pagamento" && statusPedido === "aguardando_pagamento") {
      return {
        label: "Aguardando pagamento",
        needsAction: true,
        actionType: "pagamento",
        badgeClass: "bg-[#EEEDE8] text-[#6B6A64] border border-[#D6D3CC]",
        timelineStep: 1,
      };
    }

    if (statusPedido === "aguardando_arquivo" || order.currentStep === "aguardando_arquivo") {
      return {
        label: "Aguardando seu arquivo",
        needsAction: true,
        actionType: "arquivo",
        badgeClass: "bg-[#004AAD]/10 text-[#004AAD] border border-[#004AAD]/20",
        timelineStep: 2,
      };
    }

    if (
      statusPedido === "aguardando_aprovacao" ||
      order.currentStep === "arte_aprovacao" ||
      aprovacao === "aguardando_aprovacao" ||
      (order.items?.some((i) => i.mockupUrl) && aprovacao !== "aprovado")
    ) {
      if (aprovacao === "ajuste_solicitado") {
        return {
          label: "Ajuste de arte em revisão",
          needsAction: false,
          actionType: null,
          badgeClass: "bg-[#EEEDE8] text-[#272727] border border-[#D6D3CC]",
          timelineStep: 3,
        };
      }
      return {
        label: "Arte pronta — aguardando sua aprovação",
        needsAction: true,
        actionType: "aprovacao",
        badgeClass: "bg-[#004AAD] text-white border border-[#004AAD]",
        timelineStep: 3,
      };
    }

    if (statusPedido === "em_producao" || order.currentStep === "em_producao" || aprovacao === "aprovado") {
      return {
        label: "Em produção",
        needsAction: false,
        actionType: null,
        badgeClass: "bg-[#EEEDE8] text-[#0F7A4F] border border-[#D6D3CC]",
        timelineStep: 4,
      };
    }

    if (statusPedido === "a_despachar" || statusPedido === "pago") {
      return {
        label: "Pagamento confirmado — preparando envio",
        needsAction: false,
        actionType: null,
        badgeClass: "bg-[#EEEDE8] text-[#0F7A4F] border border-[#D6D3CC]",
        timelineStep: 4,
      };
    }

    if (statusPedido === "enviado" || statusPedido === "despachado" || order.currentStep === "despachar" || (order.currentStep as any) === "enviado") {
      return {
        label: "A caminho",
        needsAction: false,
        actionType: null,
        badgeClass: "bg-[#004AAD]/10 text-[#004AAD] border border-[#004AAD]/30",
        timelineStep: 5,
      };
    }

    if (statusPedido === "entregue" || order.currentStep === "entregue") {
      return {
        label: "Entregue",
        needsAction: false,
        actionType: null,
        badgeClass: "bg-[#EEEDE8] text-[#6B6A64] border border-[#D6D3CC]",
        timelineStep: 6,
      };
    }

    if (statusPedido === "cancelado" || statusPedido === "recusado") {
      return {
        label: "Cancelado",
        needsAction: false,
        actionType: null,
        badgeClass: "bg-[#9B2C2C]/10 text-[#9B2C2C] border border-[#9B2C2C]/20",
        timelineStep: 0,
      };
    }

    return {
      label: "Em andamento",
      needsAction: false,
      actionType: null,
      badgeClass: "bg-[#EEEDE8] text-[#272727] border border-[#D6D3CC]",
      timelineStep: 2,
    };
  };

  // Helper para obter URL do mockup da arte
  const getOrderMockupUrl = (order: Order): string | null => {
    if (order.mockupUrl) return order.mockupUrl;
    const itemWithMockup = order.items?.find((i) => i.mockupUrl || i.personalization?.mockupUrl);
    if (itemWithMockup?.mockupUrl) return itemWithMockup.mockupUrl;
    if (itemWithMockup?.personalization?.mockupUrl) return itemWithMockup.personalization.mockupUrl;
    // Se o pedido está em aguardando_aprovacao e é personalizável, fornece uma imagem de mockup representativa
    if (
      order.statusPedido === "aguardando_aprovacao" ||
      order.currentStep === "arte_aprovacao" ||
      order.items?.some((i) => i.requerArquivo || i.natureza === "personalizavel")
    ) {
      return "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80";
    }
    return null;
  };

  // Tratar aprovação de mockup
  const handleAprovarMockup = async (orderId: string) => {
    setIsApproving(true);
    setActionSuccessMsg(null);
    try {
      const res = await aprovarMockupPedido(orderId, user?.id);
      setActionSuccessMsg("Arte aprovada com sucesso! Seu pedido foi encaminhado para a produção.");
      await loadOrders();
    } catch (err) {
      console.error("Erro ao aprovar arte:", err);
    } finally {
      setIsApproving(false);
    }
  };

  // Tratar solicitação de ajuste
  const handleSolicitarAjuste = async (orderId: string) => {
    if (!adjustComment.trim()) return;
    setIsSubmittingAdjust(true);
    setActionSuccessMsg(null);
    try {
      await solicitarAjusteMockupPedido(orderId, adjustComment, user?.id);
      setActionSuccessMsg("Sua solicitação de ajuste foi enviada para a nossa equipe de criação!");
      setShowAdjustInput(false);
      setAdjustComment("");
      await loadOrders();
    } catch (err) {
      console.error("Erro ao solicitar ajuste:", err);
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  // Link para WhatsApp com número do pedido
  const getWhatsAppLink = (order: Order, motivo: "arquivo" | "ajuste" | "duvida") => {
    const num = order.id || order.orderNumber;
    let text = `Olá! Gostaria de falar sobre o meu pedido #${num} da Glos Presentes.`;
    if (motivo === "arquivo") {
      text = `Olá! Seguem os arquivos e orientações para personalização do meu pedido #${num}.`;
    } else if (motivo === "ajuste") {
      text = `Olá! Gostaria de solicitar um ajuste na arte do meu pedido #${num}.`;
    }
    return `https://wa.me/${BRAND_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`;
  };

  // Rastreamento
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

  // Tratar login/cadastro direto na tela se deslogado
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      if (authMode === "login") {
        await login(authEmail, authPassword);
      } else {
        await register(authName, authEmail, authPhone, authPassword);
      }
    } catch (err: any) {
      setAuthError(err?.message || "Ocorreu um erro. Verifique seus dados e tente novamente.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Tratar salvar perfil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: profileName,
      phone: profilePhone,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // SE DESLOGADO: Exibe a Área de Identificação da Glos
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] bg-[#E4E2DD] py-12 px-4 sm:px-6 lg:px-8 font-sans text-[#272727]">
        <div className="max-w-md mx-auto">
          <div className="bg-[#F4F3EF] rounded-[8px] border border-[#D6D3CC] p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[12px] uppercase tracking-wider text-[#6B6A64]">
                Minha Conta
              </span>
              <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-[#272727]">
                {authMode === "login" ? "Acessar seus pedidos" : "Criar sua conta"}
              </h1>
              <p className="text-xs text-[#6B6A64] font-normal leading-relaxed">
                Acompanhe o status do seu presente e aprove o mockup da arte com facilidade.
              </p>
            </div>

            {/* Google Login Rápido */}
            <button
              type="button"
              onClick={() => loginWithGoogle()}
              className="w-full py-2.5 px-4 bg-[#F4F3EF] hover:bg-[#EEEDE8] text-[#272727] border border-[#D6D3CC] rounded-[8px] text-xs font-medium transition-colors flex items-center justify-center gap-2"
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

            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#D6D3CC] w-full" />
              <span className="bg-[#F4F3EF] px-3 text-[11px] text-[#9B998F] uppercase tracking-wider">
                ou com e-mail
              </span>
            </div>

            {authError && (
              <div className="p-3 rounded-[8px] bg-[#9B2C2C]/10 border border-[#9B2C2C]/20 text-xs text-[#9B2C2C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "register" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#272727] mb-1">
                      Seu Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Ex: Maria Silva"
                      className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#272727] mb-1">
                      Telefone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1">
                  Senha
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="Sua senha de acesso"
                  className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 px-4 bg-[#004AAD] hover:bg-[#003c8c] text-white rounded-[8px] text-xs font-medium transition-colors disabled:opacity-50"
              >
                {authLoading
                  ? "Carregando..."
                  : authMode === "login"
                  ? "Entrar na Conta"
                  : "Criar Conta e Acessar"}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setAuthError("");
                }}
                className="text-xs text-[#004AAD] hover:underline font-medium"
              >
                {authMode === "login"
                  ? "Primeira vez aqui? Crie sua conta"
                  : "Já tem conta? Clique para entrar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ÁREA DO CLIENTE LOGADA
  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#272727] font-sans">
      {/* 1. CABEÇALHO DO CLIENTE */}
      <div className="border-b border-[#D6D3CC] bg-[#F4F3EF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] uppercase tracking-wider text-[#6B6A64]">
                Minha Conta Glos
              </span>
              <h1 className="text-xl sm:text-2xl font-normal tracking-tight text-[#272727]">
                Olá, {user?.name?.split(" ")[0] || "Cliente"}
              </h1>
              <p className="text-xs text-[#6B6A64]">
                {user?.email} • Acompanhe seus pedidos e aprove a arte dos seus presentes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigateCatalog()}
                className="px-3.5 py-2 bg-[#F4F3EF] hover:bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] text-xs font-medium rounded-[8px] transition-colors"
              >
                Ver Coleção
              </button>
              <button
                onClick={logout}
                className="px-3.5 py-2 bg-[#F4F3EF] hover:bg-[#EEEDE8] border border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727] text-xs font-medium rounded-[8px] transition-colors flex items-center gap-1.5"
                title="Sair da Conta"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* NAVEGAÇÃO DE ABAS ENXUTAS */}
          <div className="flex items-center gap-6 mt-6 border-t border-[#D6D3CC] pt-4">
            <button
              onClick={() => setActiveTab("orders")}
              className={`text-xs font-medium pb-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "orders"
                  ? "border-[#004AAD] text-[#004AAD]"
                  : "border-transparent text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Meus Pedidos ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`text-xs font-medium pb-2 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === "profile"
                  ? "border-[#004AAD] text-[#004AAD]"
                  : "border-transparent text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Meus Dados</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. CORPO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Feedback de ação */}
            {actionSuccessMsg && (
              <div className="p-4 rounded-[8px] bg-[#0F7A4F]/10 border border-[#0F7A4F]/20 text-xs text-[#0F7A4F] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setActionSuccessMsg(null)}
                  className="text-xs hover:underline text-[#0F7A4F]"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* ESTADO VAZIO */}
            {!loadingOrders && orders.length === 0 && (
              <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-8 text-center space-y-4">
                <Package className="w-8 h-8 text-[#9B998F] mx-auto" strokeWidth={1.5} />
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-[#272727]">
                    Você ainda não tem nenhum pedido
                  </h3>
                  <p className="text-xs text-[#6B6A64] max-w-sm mx-auto">
                    Explore nossa curadoria de presentes afetivos e personalize cada detalhe.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateCatalog()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#004AAD] text-white rounded-[8px] text-xs font-medium hover:bg-[#003c8c] transition-colors"
                >
                  <span>Explorar Presentes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* LISTA DE PEDIDOS */}
            {orders.map((order) => {
              const statusInfo = getClientStatusInfo(order);
              const mockupUrl = getOrderMockupUrl(order);
              const isSelected = selectedOrder?.id === order.id;

              return (
                <div
                  key={order.id}
                  className={`bg-[#F4F3EF] border rounded-[8px] overflow-hidden transition-all ${
                    statusInfo.needsAction
                      ? "border-[#004AAD]/40"
                      : "border-[#D6D3CC]"
                  }`}
                >
                  {/* CABEÇALHO DO PEDIDO */}
                  <div className="p-4 sm:p-5 border-b border-[#D6D3CC] flex flex-wrap items-center justify-between gap-3 bg-[#F4F3EF]">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[11px] text-[#6B6A64] block">Pedido</span>
                        <span className="text-xs font-medium text-[#272727] [font-variant-numeric:tabular-nums]">
                          #{order.id || order.orderNumber}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-[#D6D3CC] hidden sm:block" />
                      <div className="hidden sm:block">
                        <span className="text-[11px] text-[#6B6A64] block">Data</span>
                        <span className="text-xs text-[#272727]">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Selo de Status */}
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-[4px] ${statusInfo.badgeClass}`}
                      >
                        {statusInfo.label}
                      </span>

                      {/* Total */}
                      <div className="text-right">
                        <span className="text-[11px] text-[#6B6A64] block">Total</span>
                        <span className="text-xs font-medium text-[#272727] [font-variant-numeric:tabular-nums]">
                          {formatCurrency(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DESTAQUE DE AÇÃO PENDENTE DO CLIENTE (Comando 11) */}
                  {statusInfo.needsAction && (
                    <div className="bg-[#004AAD]/5 border-b border-[#004AAD]/20 px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#004AAD] shrink-0" />
                        <span className="text-xs text-[#272727]">
                          {statusInfo.actionType === "aprovacao"
                            ? "A arte do seu presente está pronta! Veja o mockup abaixo e aprove para iniciarmos a produção."
                            : statusInfo.actionType === "arquivo"
                            ? "Estamos aguardando o envio da sua foto ou texto para criar a arte do seu presente."
                            : "Aguardando confirmação do pagamento para iniciar a produção."}
                        </span>
                      </div>

                      {statusInfo.actionType === "arquivo" && (
                        <a
                          href={getWhatsAppLink(order, "arquivo")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-[#004AAD] text-white rounded-[6px] text-xs font-medium hover:bg-[#003c8c] transition-colors flex items-center gap-1.5 shrink-0"
                        >
                          <Send className="w-3 h-3" />
                          <span>Enviar Foto por WhatsApp</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* ITENS DO PEDIDO */}
                  <div className="p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 p-3 bg-[#EEEDE8] rounded-[6px] border border-[#D6D3CC]"
                        >
                          <img
                            src={item.image || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&q=80"}
                            alt={item.name}
                            className="w-14 h-14 object-cover rounded-[4px] border border-[#D6D3CC] shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <h4 className="text-xs font-medium text-[#272727] truncate">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-[#6B6A64]">
                              Qtd: {item.quantity} • <span className="[font-variant-numeric:tabular-nums]">{formatCurrency(item.price)}</span>
                            </p>
                            {item.variantName && (
                              <p className="text-[11px] text-[#6B6A64]">
                                Variação: {item.variantName}
                              </p>
                            )}
                            {item.textoCurto && (
                              <p className="text-[11px] text-[#004AAD]">
                                Gravação: "{item.textoCurto}"
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* MÓDULO DE APROVAÇÃO DE MOCKUP (Comando 11 — O Coração da Fatia) */}
                    {mockupUrl && (
                      <div className="mt-4 p-4 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[8px] space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D6D3CC] pb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#004AAD]" />
                            <h4 className="text-xs font-medium text-[#272727]">
                              Mockup da Arte Personalizada
                            </h4>
                          </div>
                          <span className="text-[11px] text-[#6B6A64]">
                            {order.aprovacaoMockup === "aprovado"
                              ? `Arte Aprovada em ${formatDate(order.dataAprovacaoMockup || order.createdAt)}`
                              : order.aprovacaoMockup === "ajuste_solicitado"
                              ? "Ajuste em andamento com a equipe de criação"
                              : "Validação necessária pelo cliente"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                          {/* Imagem do Mockup com Zoom */}
                          <div className="md:col-span-4 relative group cursor-pointer" onClick={() => setZoomMockupUrl(mockupUrl)}>
                            <img
                              src={mockupUrl}
                              alt="Mockup da Arte"
                              className="w-full h-44 object-cover rounded-[6px] border border-[#D6D3CC] transition-transform group-hover:scale-[1.01]"
                            />
                            <div className="absolute inset-0 bg-[#272727]/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-[6px] flex items-center justify-center text-white text-xs gap-1.5 font-medium">
                              <ZoomIn className="w-4 h-4" />
                              <span>Ampliar mockup</span>
                            </div>
                          </div>

                          {/* Ações de Aprovação / Estado Atual */}
                          <div className="md:col-span-8 space-y-3">
                            {order.aprovacaoMockup === "aprovado" ? (
                              <div className="p-3 bg-[#0F7A4F]/10 border border-[#0F7A4F]/20 rounded-[6px] text-xs text-[#0F7A4F] flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>
                                  Arte aprovada com sucesso! Seu presente está em processo de personalização e acabamento.
                                </span>
                              </div>
                            ) : order.aprovacaoMockup === "ajuste_solicitado" ? (
                              <div className="space-y-3">
                                <div className="p-3 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs space-y-1">
                                  <span className="text-[#6B6A64] block text-[11px]">
                                    Ajuste solicitado por você:
                                  </span>
                                  <p className="text-[#272727] italic font-normal">
                                    "{order.comentarioAjuste || "Revisão de arte solicitada"}"
                                  </p>
                                </div>
                                <p className="text-xs text-[#6B6A64]">
                                  Nossa equipe de design está preparando a nova versão. Se quiser enviar referências adicionais, clique abaixo:
                                </p>
                                <a
                                  href={getWhatsAppLink(order, "ajuste")}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F3EF] hover:bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] text-xs font-medium rounded-[6px] transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-[#004AAD]" />
                                  <span>Conversar no WhatsApp sobre o ajuste</span>
                                </a>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-xs text-[#6B6A64] leading-relaxed">
                                  Confira atentamente os nomes, datas e detalhes da arte acima. Se estiver tudo certo, aprove para iniciarmos a produção imediatamente.
                                </p>

                                {!showAdjustInput ? (
                                  <div className="flex flex-wrap items-center gap-3 pt-1">
                                    <button
                                      type="button"
                                      disabled={isApproving}
                                      onClick={() => handleAprovarMockup(order.id)}
                                      className="px-4 py-2 bg-[#004AAD] hover:bg-[#003c8c] text-white rounded-[6px] text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>{isApproving ? "Aprovando..." : "Aprovar arte"}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setShowAdjustInput(true)}
                                      className="px-4 py-2 bg-[#F4F3EF] hover:bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] rounded-[6px] text-xs font-medium transition-colors"
                                    >
                                      Pedir ajuste
                                    </button>

                                    <a
                                      href={getWhatsAppLink(order, "ajuste")}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-[#004AAD] hover:underline font-medium flex items-center gap-1"
                                    >
                                      <span>Tirar dúvida no WhatsApp</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                ) : (
                                  <div className="space-y-2 pt-1">
                                    <label className="block text-xs font-medium text-[#272727]">
                                      O que você gostaria de ajustar na arte?
                                    </label>
                                    <textarea
                                      rows={2}
                                      value={adjustComment}
                                      onChange={(e) => setAdjustComment(e.target.value)}
                                      placeholder="Ex: Gostaria de trocar a fonte, diminuir o tamanho da data ou trocar a foto..."
                                      className="w-full p-2.5 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                                    />
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        disabled={isSubmittingAdjust || !adjustComment.trim()}
                                        onClick={() => handleSolicitarAjuste(order.id)}
                                        className="px-3.5 py-1.5 bg-[#004AAD] hover:bg-[#003c8c] text-white rounded-[6px] text-xs font-medium transition-colors disabled:opacity-50"
                                      >
                                        {isSubmittingAdjust ? "Enviando..." : "Enviar pedido de ajuste"}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setShowAdjustInput(false);
                                          setAdjustComment("");
                                        }}
                                        className="px-3 py-1.5 bg-[#F4F3EF] border border-[#D6D3CC] text-[#6B6A64] rounded-[6px] text-xs font-medium hover:text-[#272727]"
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* RASTREIO / DETALHES RÁPIDOS */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#6B6A64] border-t border-[#D6D3CC]">
                      <div className="flex items-center gap-4">
                        {order.shippingAddress && (
                          <span>
                            Entrega em: {order.shippingAddress.city}/{order.shippingAddress.state}
                          </span>
                        )}
                        {order.trackingCode && (
                          <button
                            onClick={() => handleOpenTracking(order)}
                            className="text-[#004AAD] hover:underline font-medium flex items-center gap-1"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Rastrear ({order.trackingCode})</span>
                          </button>
                        )}
                      </div>

                      <a
                        href={getWhatsAppLink(order, "duvida")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#6B6A64] hover:text-[#272727] flex items-center gap-1"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Falar com atendente sobre este pedido</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. ABA DE MEUS DADOS */}
        {activeTab === "profile" && (
          <div className="max-w-xl bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-medium text-[#272727]">
                Dados Cadastrais
              </h2>
              <p className="text-xs text-[#6B6A64]">
                Mantenha suas informações de contato atualizadas para envio das notificações de pedidos.
              </p>
            </div>

            {profileSaved && (
              <div className="p-3 rounded-[6px] bg-[#0F7A4F]/10 border border-[#0F7A4F]/20 text-xs text-[#0F7A4F] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dados atualizados com sucesso!</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3 py-2 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#6B6A64] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="tel"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#004AAD] hover:bg-[#003c8c] text-white rounded-[6px] text-xs font-medium transition-colors"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 4. MODAL DE ZOOM DO MOCKUP */}
      {zoomMockupUrl && (
        <div
          className="fixed inset-0 z-50 bg-[#272727]/80 flex items-center justify-center p-4"
          onClick={() => setZoomMockupUrl(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727]">
                Visualização do Mockup da Arte
              </span>
              <button
                onClick={() => setZoomMockupUrl(null)}
                className="p-1 text-[#6B6A64] hover:text-[#272727] rounded-[4px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-[#EEEDE8]">
              <img
                src={zoomMockupUrl}
                alt="Mockup Ampliado"
                className="max-h-[70vh] object-contain rounded-[4px] border border-[#D6D3CC]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL DE RASTREAMENTO */}
      {trackingModalData && (
        <div
          className="fixed inset-0 z-50 bg-[#272727]/80 flex items-center justify-center p-4"
          onClick={() => setTrackingModalData(null)}
        >
          <div
            className="relative max-w-lg w-full bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden p-4 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D6D3CC] pb-3">
              <div>
                <h3 className="text-xs font-medium text-[#272727]">
                  Rastreamento do Pedido
                </h3>
                <span className="text-[11px] text-[#6B6A64] [font-variant-numeric:tabular-nums]">
                  Código: {trackingModalData.trackingCode} ({trackingModalData.carrier})
                </span>
              </div>
              <button
                onClick={() => setTrackingModalData(null)}
                className="p-1 text-[#6B6A64] hover:text-[#272727] rounded-[4px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {trackingModalData.checkpoints?.map((chk, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <div className="w-2 h-2 mt-1.5 rounded-full bg-[#004AAD] shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-medium text-[#272727] block">
                      {chk.title}
                    </span>
                    <p className="text-[#6B6A64] text-[11px]">
                      {chk.location} • {chk.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
