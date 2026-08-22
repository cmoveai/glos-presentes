import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Sparkles,
  Send,
  MessageCircle,
  Mail,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Gift,
  Copy,
  Check,
  Percent,
  Sliders,
  DollarSign,
  ArrowUpRight,
  User,
  Phone,
} from "lucide-react";
import { AbandonedCart } from "../../types";
import { BRAND_CONFIG } from "../../config/brand";

interface AbandonedCartsManagerProps {
  showToast: (message: string, type: "success" | "error" | "info") => void;
}

export const AbandonedCartsManager: React.FC<AbandonedCartsManagerProps> = ({ showToast }) => {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal / AI Generator State
  const [selectedCart, setSelectedCart] = useState<AbandonedCart | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTone, setAiTone] = useState<"friendly_urgent" | "high_urgency" | "vip_consultive">("friendly_urgent");
  const [couponCode, setCouponCode] = useState("VOLTA5");
  const [discountPercent, setDiscountPercent] = useState(5);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState<{
    whatsappMessage: string;
    emailSubject: string;
    emailBody: string;
    keyBenefit: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Load abandoned carts from API
  const fetchAbandonedCarts = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/abandoned-carts");
      if (res.ok) {
        const data = await res.json();
        if (data.carts) {
          setCarts(data.carts);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar carrinhos abandonados:", err);
      showToast("Não foi possível sincronizar carrinhos abandonados.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAbandonedCarts();
  }, []);

  // Filter carts
  const filteredCarts = carts.filter((c) => {
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "pending" && c.status === "abandoned") ||
      (statusFilter === "contacted" && c.status === "contacted") ||
      (statusFilter === "recovered" && c.status === "recovered");

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      (c.customerName || "").toLowerCase().includes(query) ||
      (c.customerEmail || "").toLowerCase().includes(query) ||
      (c.customerPhone || "").includes(query) ||
      c.id.toLowerCase().includes(query);

    return matchesStatus && matchesQuery;
  });

  // Calculate KPIs
  const totalAbandonedValue = carts
    .filter((c) => c.status !== "recovered")
    .reduce((sum, c) => sum + (c.total || 0), 0);

  const totalRecoveredValue = carts
    .filter((c) => c.status === "recovered")
    .reduce((sum, c) => sum + (c.total || 0), 0);

  const pendingCount = carts.filter((c) => c.status === "abandoned").length;
  const recoveredCount = carts.filter((c) => c.status === "recovered").length;
  const contactedCount = carts.filter((c) => c.status === "contacted").length;
  const recoveryRate = carts.length > 0 ? (recoveredCount / carts.length) * 100 : 0;

  // Open AI modal for a specific cart
  const handleOpenAiModal = (cart: AbandonedCart) => {
    setSelectedCart(cart);
    setCouponCode(cart.suggestedDiscountCode || "VOLTA5");
    setDiscountPercent(cart.suggestedDiscountCode === "PRESENTE10" ? 10 : 5);
    setGeneratedMessage(null);
    setIsAiModalOpen(true);
    // Auto trigger generation for convenience
    generateAiRecovery(cart, "friendly_urgent", cart.suggestedDiscountCode || "VOLTA5", 5);
  };

  // Trigger Gemini AI API call
  const generateAiRecovery = async (
    cart: AbandonedCart,
    tone: string,
    coupon: string,
    discPercent: number
  ) => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/ai/recovery-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          tone,
          couponCode: coupon,
          discountPercent: discPercent,
          storeName: BRAND_CONFIG.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedMessage({
          whatsappMessage: data.whatsappMessage,
          emailSubject: data.emailSubject,
          emailBody: data.emailBody,
          keyBenefit: data.keyBenefit,
        });
      } else {
        showToast("Erro ao contatar IA Gemini. Mensagem padrão gerada.", "info");
      }
    } catch (err) {
      console.error("Erro na geração da IA:", err);
      showToast("Falha ao comunicar com o servidor.", "error");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Update Cart Status
  const handleUpdateStatus = async (cartId: string, newStatus: "abandoned" | "contacted" | "recovered") => {
    try {
      const res = await fetch(`/api/abandoned-carts/${cartId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCarts((prev) =>
          prev.map((c) => (c.id === cartId ? { ...c, status: newStatus } : c))
        );
        showToast(
          newStatus === "recovered"
            ? "Parabéns! Carrinho marcado como RECUPERADO 🎉"
            : newStatus === "contacted"
            ? "Status atualizado para CONTATADO VIA IA."
            : "Status revertido para PENDENTE.",
          "success"
        );
      }
    } catch (err) {
      showToast("Erro ao atualizar status do carrinho.", "error");
    }
  };

  // Open WhatsApp Web with generated message
  const handleSendWhatsapp = () => {
    if (!selectedCart || !generatedMessage) return;

    let phone = (selectedCart.customerPhone || "").replace(/\D/g, "");
    if (phone && !phone.startsWith("55") && phone.length >= 10) {
      phone = "55" + phone;
    }

    const encodedText = encodeURIComponent(generatedMessage.whatsappMessage);
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodedText}`
      : `https://api.whatsapp.com/send?text=${encodedText}`;

    window.open(whatsappUrl, "_blank");

    // Automatically mark as contacted
    handleUpdateStatus(selectedCart.id, "contacted");
  };

  // Copy text to clipboard
  const handleCopyText = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast("Texto copiado para a área de transferência!", "success");
    setTimeout(() => setCopiedField(null), 2500);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const getTimeAgo = (isoDate: string) => {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 60) return `há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `há ${days} dia(s)`;
  };

  const getStepBadge = (step: string) => {
    switch (step) {
      case "payment":
        return <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">Desistiu no Pagamento</span>;
      case "shipping":
        return <span className="bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">No Cálculo de Frete</span>;
      case "address":
        return <span className="bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">No Endereço</span>;
      case "email":
        return <span className="bg-indigo-100 text-indigo-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">Digitou Contato</span>;
      default:
        return <span className="bg-stone-100 text-stone-700 text-[11px] px-2 py-0.5 rounded-md font-semibold">No Carrinho</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with AI badge and refresh button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white p-5 rounded-2xl shadow-md border border-stone-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> IA Gemini Ativa
            </span>
            <span className="text-stone-300 text-xs font-medium">Recuperação Automática & Inteligente</span>
          </div>
          <h2 className="text-xl font-extrabold text-white">Central de Carrinhos Abandonados</h2>
          <p className="text-xs text-stone-300 max-w-2xl mt-0.5">
            Identifique clientes que deixaram produtos na sacola e gere mensagens persuasivas hiperpersonalizadas com 1 clique para WhatsApp e E-mail.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchAbandonedCarts}
            disabled={refreshing}
            className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-stone-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
            Sincronizar
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total em Risco</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">{formatCurrency(totalAbandonedValue)}</div>
          <div className="text-xs text-stone-500 mt-1 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            {pendingCount} carrinho(s) aguardando resgate
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturamento Recuperado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">{formatCurrency(totalRecoveredValue)}</div>
          <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {recoveredCount} vendas salvas com sucesso
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Contatados via IA</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-900">{contactedCount}</div>
          <div className="text-xs text-stone-500 mt-1 font-medium">
            Abordagens enviadas pelo WhatsApp
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Taxa de Conversão</span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">{recoveryRate.toFixed(1)}%</div>
          <div className="text-xs text-stone-500 mt-1 font-medium">
            Média de mercado: 8% a 15%
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Todos ({carts.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter("contacted")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "contacted"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
            }`}
          >
            Contatados ({contactedCount})
          </button>
          <button
            onClick={() => setStatusFilter("recovered")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "recovered"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            Recuperados ({recoveredCount})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, e-mail, telefone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:border-stone-900 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Carts List Table / Cards */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-2" />
            <p className="text-xs font-medium">Carregando dados dos carrinhos...</p>
          </div>
        ) : filteredCarts.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-stone-900">Nenhum carrinho abandonado encontrado</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Todos os carrinhos recentes foram finalizados ou não correspondem ao filtro atual.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredCarts.map((cart) => (
              <div
                key={cart.id}
                className="p-4 sm:p-5 hover:bg-stone-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Left: Customer & Items details */}
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {cart.id}
                    </span>
                    {getStepBadge(cart.stepReached)}
                    {cart.status === "recovered" ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Recuperado
                      </span>
                    ) : cart.status === "contacted" ? (
                      <span className="bg-indigo-100 text-indigo-800 text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> Contatado
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pendente
                      </span>
                    )}
                    <span className="text-[11px] text-stone-400 font-medium">
                      {getTimeAgo(cart.createdAt)}
                    </span>
                  </div>

                  {/* Customer Info */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      {cart.customerName || "Visitante não identificado"}
                    </div>
                    {cart.customerEmail && (
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        {cart.customerEmail}
                      </div>
                    )}
                    {cart.customerPhone && (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        {cart.customerPhone}
                      </div>
                    )}
                  </div>

                  {/* Items Preview */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {cart.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-stone-100/80 border border-stone-200/80 rounded-lg p-1.5 pr-2.5"
                      >
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-7 h-7 rounded object-cover border border-stone-200"
                          />
                        )}
                        <div className="text-[11px] leading-tight">
                          <span className="font-semibold text-stone-800 line-clamp-1 max-w-[180px]">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-stone-500 font-mono text-[10px]">
                            {formatCurrency(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Value & Actions */}
                <div className="flex sm:items-center justify-between lg:justify-end gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                  <div className="text-left lg:text-right">
                    <div className="text-xs text-stone-400 font-medium">Valor do Carrinho</div>
                    <div className="text-lg font-black text-stone-950 font-mono">
                      {formatCurrency(cart.total)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAiModal(cart)}
                      className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                      Recuperar com IA
                    </button>

                    {cart.status !== "recovered" ? (
                      <button
                        onClick={() => handleUpdateStatus(cart.id, "recovered")}
                        title="Marcar como Recuperado"
                        className="p-2 text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(cart.id, "abandoned")}
                        title="Reverter para Pendente"
                        className="p-2 text-emerald-600 hover:text-stone-400 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5 fill-emerald-100" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Gerador de Abordagem com IA (Gemini) */}
      {isAiModalOpen && selectedCart && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div
            onClick={() => setIsAiModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-stone-200 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-amber-100 text-amber-900 text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Gemini 3.7 Flash Copywriter
                  </span>
                  <span className="text-stone-400 text-xs font-mono">{selectedCart.id}</span>
                </div>
                <h3 className="text-lg font-black text-stone-900">
                  Gerador de Recuperação Personalizada
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Cliente: <strong className="text-stone-800">{selectedCart.customerName}</strong> ({formatCurrency(selectedCart.total)})
                </p>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Strategy & Tone Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Tom de Voz da Abordagem
                </label>
                <select
                  value={aiTone}
                  onChange={(e) => {
                    const newTone = e.target.value as any;
                    setAiTone(newTone);
                    generateAiRecovery(selectedCart, newTone, couponCode, discountPercent);
                  }}
                  className="w-full bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-semibold text-stone-800 focus:outline-hidden focus:border-stone-900"
                >
                  <option value="friendly_urgent">💖 Amigável & Empático (Conversão Alta)</option>
                  <option value="high_urgency">⚡ Urgência Moderada (Estoque Reservado)</option>
                  <option value="vip_consultive">👑 Consultivo VIP (Suporte & Concierge)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5">
                  Cupom de Resgate Ofertado
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Ex: VOLTA5"
                    className="flex-1 bg-white border border-stone-300 rounded-lg px-3 py-2 text-xs font-bold font-mono uppercase text-stone-900 focus:outline-hidden focus:border-stone-900"
                  />
                  <select
                    value={discountPercent}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setDiscountPercent(d);
                      generateAiRecovery(selectedCart, aiTone, couponCode, d);
                    }}
                    className="w-24 bg-white border border-stone-300 rounded-lg px-2 py-2 text-xs font-bold text-stone-800"
                  >
                    <option value={5}>5% OFF</option>
                    <option value={10}>10% OFF</option>
                    <option value={15}>15% OFF</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading or Generated Preview */}
            {isGeneratingAi ? (
              <div className="p-8 text-center bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
                <h4 className="text-xs font-bold text-amber-900">
                  A IA Gemini está analisando os produtos do carrinho e escrevendo a mensagem...
                </h4>
                <p className="text-[11px] text-amber-700">
                  Criando copy personalizada para {selectedCart.customerName}
                </p>
              </div>
            ) : generatedMessage ? (
              <div className="space-y-4">
                {/* WhatsApp Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      Mensagem Pronta para WhatsApp
                    </div>
                    <button
                      onClick={() => handleCopyText(generatedMessage.whatsappMessage, "whatsapp")}
                      className="text-stone-500 hover:text-stone-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === "whatsapp" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Texto
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={generatedMessage.whatsappMessage}
                    onChange={(e) =>
                      setGeneratedMessage({
                        ...generatedMessage,
                        whatsappMessage: e.target.value,
                      })
                    }
                    className="w-full bg-emerald-50/40 border border-emerald-200 rounded-xl p-3.5 text-xs text-stone-800 focus:outline-hidden focus:border-emerald-500 leading-relaxed font-sans"
                  />
                </div>

                {/* Email Section (Accordion-like preview) */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-indigo-600" />
                      Opção para E-mail Marketing
                    </div>
                    <button
                      onClick={() =>
                        handleCopyText(
                          `Assunto: ${generatedMessage.emailSubject}\n\n${generatedMessage.emailBody}`,
                          "email"
                        )
                      }
                      className="text-stone-500 hover:text-stone-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === "email" ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar E-mail
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-xs bg-white p-2.5 rounded-lg border border-stone-200 space-y-1">
                    <div className="font-semibold text-stone-900">
                      <span className="text-stone-400 font-normal">Assunto:</span>{" "}
                      {generatedMessage.emailSubject}
                    </div>
                    <div className="text-stone-600 whitespace-pre-line text-[11px] pt-1">
                      {generatedMessage.emailBody}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-200">
              <button
                onClick={() =>
                  generateAiRecovery(selectedCart, aiTone, couponCode, discountPercent)
                }
                disabled={isGeneratingAi}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-stone-600 hover:text-stone-900 px-4 py-2 rounded-xl text-xs font-bold border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
                Reescrever com outra variação
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={handleSendWhatsapp}
                  disabled={!generatedMessage}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Abrir no WhatsApp Web
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
