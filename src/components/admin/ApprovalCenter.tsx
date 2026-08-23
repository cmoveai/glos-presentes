import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Layers,
  MessageCircle,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  RefreshCw,
  Info,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { ArtApprovalSession, ArtApprovalState, Order } from "../../types";
import {
  getApprovalSessionsFromStorage,
  saveApprovalSessionsToStorage,
  uploadMockupAndTriggerAI,
  simulateIncomingCustomerMessage,
  sendCrisManualMessage,
  getZApiStatus,
} from "../../services/whatsappAIService";
import { attachOrderMockupFirestore, fetchAllOrdersAdmin } from "../../lib/firebase";
import { ApprovalCard } from "./ApprovalCard";
import { MockupUploader } from "./MockupUploader";
import { ConversationThread } from "./ConversationThread";
import { Card } from "./Card";
import { InsightBanner } from "./InsightBanner";

interface ApprovalCenterProps {
  onViewOrderDetails?: (orderId: string) => void;
}

export const ApprovalCenter: React.FC<ApprovalCenterProps> = ({
  onViewOrderDetails,
}) => {
  const [sessions, setSessions] = useState<ArtApprovalSession[]>(
    getApprovalSessionsFromStorage
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("acao_cris");

  // Modais
  const [activeMockupSession, setActiveMockupSession] = useState<ArtApprovalSession | null>(null);
  const [activeConversationSession, setActiveConversationSession] = useState<ArtApprovalSession | null>(null);

  // Sync with real orders from database/API on mount
  useEffect(() => {
    async function syncWithRealOrders() {
      try {
        const res = await fetch("/api/orders");
        if (res.ok) {
          const data = await res.json();
          const apiOrders: Order[] = data.orders || [];
          mergeOrdersIntoSessions(apiOrders);
        }
      } catch (err) {
        console.warn("Could not fetch orders from API, trying Firestore:", err);
        try {
          const fsOrders = await fetchAllOrdersAdmin();
          if (fsOrders.length > 0) {
            mergeOrdersIntoSessions(fsOrders);
          }
        } catch (e) {
          console.warn("Firestore sync fallback:", e);
        }
      }
    }

    function mergeOrdersIntoSessions(ordersList: Order[]) {
      const currentSessions = getApprovalSessionsFromStorage();
      let hasChanges = false;
      const updatedList = [...currentSessions];

      for (const ord of ordersList) {
        // Se for pedido com item personalizavel
        const hasPersonalized =
          ord.orderType === "personalizado" ||
          ord.items?.some((it) => it.requerArquivo || it.natureza === "personalizavel" || it.personalization);

        if (!hasPersonalized) continue;

        const existingIdx = updatedList.findIndex(
          (s) => s.orderId === ord.id || s.orderNumber === ord.id || s.orderNumber === ord.orderNumber
        );

        if (existingIdx >= 0) {
          // Atualiza estado se mudou no pedido (ex: cliente aprovou no site)
          const current = updatedList[existingIdx];
          let updatedState: ArtApprovalState = current.state;
          if (ord.aprovacaoMockup === "aprovado" || ord.statusPedido === "em_producao") {
            updatedState = "aprovado";
          } else if (ord.aprovacaoMockup === "ajuste_solicitado") {
            updatedState = "ajuste_solicitado";
          } else if (ord.aprovacaoMockup === "aguardando_aprovacao" || ord.statusPedido === "aguardando_aprovacao") {
            updatedState = "aguardando_aprovacao";
          }

          if (
            updatedState !== current.state ||
            (ord.mockupUrl && ord.mockupUrl !== current.mockupUrl) ||
            (ord.comentarioAjuste && ord.comentarioAjuste !== current.comentarioAjuste)
          ) {
            updatedList[existingIdx] = {
              ...current,
              state: updatedState,
              mockupUrl: ord.mockupUrl || current.mockupUrl,
              comentarioAjuste: ord.comentarioAjuste || current.comentarioAjuste,
              rejectionReason: ord.comentarioAjuste || current.rejectionReason,
              qrLink: ord.qrLink || current.qrLink,
              qrApplied: ord.qrAplicado ?? ord.qrApplied ?? current.qrApplied,
              requiresCrisAction: updatedState === "arquivo_recebido" || updatedState === "ajuste_solicitado",
            };
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        setSessions(updatedList);
        saveApprovalSessionsToStorage(updatedList);
      }
    }

    syncWithRealOrders();
  }, []);

  // Recalcular métricas
  const crisActionCount = sessions.filter((s) => s.requiresCrisAction).length;
  const aguardandoArquivoCount = sessions.filter((s) => s.state === "aguardando_arquivo").length;
  const arquivoRecebidoCount = sessions.filter((s) => s.state === "arquivo_recebido").length;
  const aguardandoAprovacaoCount = sessions.filter((s) => s.state === "aguardando_aprovacao").length;
  const ajusteSolicitadoCount = sessions.filter((s) => s.state === "ajuste_solicitado").length;
  const aprovadoCount = sessions.filter((s) => s.state === "aprovado").length;

  // Filtragem
  const filteredSessions = sessions.filter((session) => {
    // Filtro por busca
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        session.customerName.toLowerCase().includes(q) ||
        session.orderNumber.toLowerCase().includes(q) ||
        session.productName.toLowerCase().includes(q) ||
        session.customerPhone.toLowerCase().includes(q);
      if (!matchQuery) return false;
    }

    // Filtro por estado
    if (selectedFilter === "todos") return true;
    if (selectedFilter === "acao_cris") return session.requiresCrisAction;
    return session.state === selectedFilter;
  });

  // Handlers de Upload de Mockup
  const handleUploadMockupAndSend = async (
    mockupUrl: string,
    qrLink?: string,
    qrApplied?: boolean
  ) => {
    if (!activeMockupSession) return;

    // 1. Atualizar sessão local do WhatsApp
    const updated = uploadMockupAndTriggerAI(
      activeMockupSession.id,
      mockupUrl,
      qrLink,
      qrApplied
    );

    // 2. Sincronizar com a API REST de Pedidos
    const targetOrderId = activeMockupSession.orderId || activeMockupSession.orderNumber.replace("#", "");
    try {
      await fetch(`/api/orders/${targetOrderId}/anexar-mockup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "anexar",
          mockupUrl,
          qrLink,
          qrAplicado: qrApplied,
          qrApplied,
        }),
      });
    } catch (apiErr) {
      console.warn("Sync com API de pedidos fallback:", apiErr);
    }

    // 3. Sincronizar com o Firestore
    try {
      await attachOrderMockupFirestore(
        targetOrderId,
        mockupUrl,
        qrLink,
        qrApplied
      );
    } catch (fsErr) {
      console.warn("Sync com Firestore fallback:", fsErr);
    }

    if (updated) {
      const nextSessions = sessions.map((s) => (s.id === updated.id ? updated : s));
      setSessions(nextSessions);
      setActiveMockupSession(null);
      // Abrir thread para o lojista ver a mensagem enviada
      setActiveConversationSession(updated);
    }
  };

  // Handlers de Simulação de Resposta do Cliente
  const handleSimulateCustomerReply = (text: string, mediaUrl?: string) => {
    if (!activeConversationSession) return;
    const updated = simulateIncomingCustomerMessage(
      activeConversationSession.id,
      text,
      mediaUrl
    );
    if (updated) {
      const nextSessions = sessions.map((s) => (s.id === updated.id ? updated : s));
      setSessions(nextSessions);
      setActiveConversationSession(updated);
    }
  };

  // Handler de Envio Manual da Cris
  const handleSendCrisMessage = (text: string) => {
    if (!activeConversationSession) return;
    const updated = sendCrisManualMessage(activeConversationSession.id, text);
    if (updated) {
      const nextSessions = sessions.map((s) => (s.id === updated.id ? updated : s));
      setSessions(nextSessions);
      setActiveConversationSession(updated);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D6D3CC]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-[#272727]">
              Central de Aprovações de Arte (IA Glos)
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#004AAD] font-medium tabular-nums">
              {crisActionCount} aguardando a Cris
            </span>
          </div>
          <p className="text-xs text-[#6B6A64] mt-0.5">
            A IA conduz o diálogo no WhatsApp com tom afetivo. A Cris monta os mockups e resolve os ajustes solicitados.
          </p>
        </div>

        {/* Status da Conexão Z-API */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs text-[#6B6A64]">
          <span className="w-2 h-2 rounded-full bg-[#0F7A4F]" />
          <span>WhatsApp Z-API Conectada</span>
        </div>
      </div>

      {/* 2. Banner Editorial de Inteligência Operacional */}
      <InsightBanner
        type="opportunity"
        title="Esteira Automatizada de Arte & Prova Visual"
        description="A IA da Glos solicita os arquivos e envia os mockups prontos para validação no WhatsApp. Quando o cliente aprova, o pedido avança sozinho para a esteira de confecção. Em caso de ajuste, a IA registra o pedido exato do cliente para a Cris."
        metricLabel="Taxa de Aprovação em 1º Envio"
        metricValue="84%"
        dismissible={false}
      />

      {/* 3. Cards de Resumo & Máquina de Estados */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Card Destaque: Ação da Cris */}
        <button
          type="button"
          onClick={() => setSelectedFilter("acao_cris")}
          className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
            selectedFilter === "acao_cris"
              ? "bg-[#EEEDE8] border-[#004AAD] ring-1 ring-[#004AAD]"
              : "bg-[#F4F3EF] border-[#D6D3CC] hover:bg-[#EEEDE8]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#004AAD] uppercase font-medium">
              Ação da Cris
            </span>
            <span className="w-2 h-2 rounded-full bg-[#004AAD]" />
          </div>
          <span className="text-xl font-medium text-[#004AAD] tabular-nums mt-1 block">
            {crisActionCount}
          </span>
          <span className="text-[10px] text-[#6B6A64] block mt-0.5">
            Mockup / Ajuste
          </span>
        </button>

        {/* 1. Aguardando Arquivo */}
        <button
          type="button"
          onClick={() => setSelectedFilter("aguardando_arquivo")}
          className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
            selectedFilter === "aguardando_arquivo"
              ? "bg-[#EEEDE8] border-[#004AAD] ring-1 ring-[#004AAD]"
              : "bg-[#F4F3EF] border-[#D6D3CC] hover:bg-[#EEEDE8]"
          }`}
        >
          <span className="text-[10px] text-[#6B6A64] uppercase block">
            1. Aguardando
          </span>
          <span className="text-xl font-medium text-[#272727] tabular-nums mt-1 block">
            {aguardandoArquivoCount}
          </span>
          <span className="text-[10px] text-[#9B998F] block mt-0.5">
            IA cobrando foto
          </span>
        </button>

        {/* 2. Arquivo Recebido */}
        <button
          type="button"
          onClick={() => setSelectedFilter("arquivo_recebido")}
          className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
            selectedFilter === "arquivo_recebido"
              ? "bg-[#EEEDE8] border-[#004AAD] ring-1 ring-[#004AAD]"
              : "bg-[#F4F3EF] border-[#D6D3CC] hover:bg-[#EEEDE8]"
          }`}
        >
          <span className="text-[10px] text-[#004AAD] uppercase font-medium block">
            2. Recebido
          </span>
          <span className="text-xl font-medium text-[#272727] tabular-nums mt-1 block">
            {arquivoRecebidoCount}
          </span>
          <span className="text-[10px] text-[#6B6A64] block mt-0.5">
            Montar Mockup
          </span>
        </button>

        {/* 3. Aguardando Aprovação */}
        <button
          type="button"
          onClick={() => setSelectedFilter("aguardando_aprovacao")}
          className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
            selectedFilter === "aguardando_aprovacao"
              ? "bg-[#EEEDE8] border-[#004AAD] ring-1 ring-[#004AAD]"
              : "bg-[#F4F3EF] border-[#D6D3CC] hover:bg-[#EEEDE8]"
          }`}
        >
          <span className="text-[10px] text-[#6B6A64] uppercase block">
            3. Em Aprovação
          </span>
          <span className="text-xl font-medium text-[#272727] tabular-nums mt-1 block">
            {aguardandoAprovacaoCount}
          </span>
          <span className="text-[10px] text-[#9B998F] block mt-0.5">
            No WhatsApp / Site
          </span>
        </button>

        {/* 4. Ajuste Solicitado */}
        <button
          type="button"
          onClick={() => setSelectedFilter("ajuste_solicitado")}
          className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
            selectedFilter === "ajuste_solicitado"
              ? "bg-[#EEEDE8] border-[#004AAD] ring-1 ring-[#004AAD]"
              : "bg-[#F4F3EF] border-[#D6D3CC] hover:bg-[#EEEDE8]"
          }`}
        >
          <span className="text-[10px] text-[#9B2C2C] uppercase font-medium block">
            4. Ajuste
          </span>
          <span className="text-xl font-medium text-[#9B2C2C] tabular-nums mt-1 block">
            {ajusteSolicitadoCount}
          </span>
          <span className="text-[10px] text-[#6B6A64] block mt-0.5">
            Revisar Arte
          </span>
        </button>

        {/* 5. Aprovados */}
        <button
          type="button"
          onClick={() => setSelectedFilter("aprovado")}
          className={`p-3 rounded-[8px] border text-left transition-all cursor-pointer ${
            selectedFilter === "aprovado"
              ? "bg-[#EEEDE8] border-[#004AAD] ring-1 ring-[#004AAD]"
              : "bg-[#F4F3EF] border-[#D6D3CC] hover:bg-[#EEEDE8]"
          }`}
        >
          <span className="text-[10px] text-[#0F7A4F] uppercase font-medium block">
            5. Aprovados
          </span>
          <span className="text-xl font-medium text-[#0F7A4F] tabular-nums mt-1 block">
            {aprovadoCount}
          </span>
          <span className="text-[10px] text-[#6B6A64] block mt-0.5">
            Em Produção
          </span>
        </button>
      </div>

      {/* 4. Barra de Busca & Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9B998F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, pedido #, produto ou WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD]"
          />
        </div>

        {/* Botão Ver Todos */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedFilter("todos")}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors cursor-pointer ${
              selectedFilter === "todos"
                ? "bg-[#004AAD] text-white border-[#004AAD]"
                : "bg-[#F4F3EF] text-[#6B6A64] border-[#D6D3CC] hover:bg-[#EEEDE8]"
            }`}
          >
            Ver Todos ({sessions.length})
          </button>
        </div>
      </div>

      {/* 5. Lista de Cards de Aprovação */}
      <div className="space-y-3">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <ApprovalCard
              key={session.id}
              session={session}
              onOpenMockupUploader={(s) => setActiveMockupSession(s)}
              onOpenConversation={(s) => setActiveConversationSession(s)}
              onViewOrderDetails={onViewOrderDetails}
            />
          ))
        ) : (
          <div className="p-8 text-center bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-[#004AAD] mx-auto opacity-70" />
            <span className="text-xs font-medium text-[#272727] block">
              Nenhum pedido encontrado nesta etapa
            </span>
            <p className="text-[11px] text-[#6B6A64] max-w-sm mx-auto">
              Todos os pedidos com este filtro foram atendidos ou não há pendências na esteira de aprovação.
            </p>
          </div>
        )}
      </div>

      {/* 6. Modal de Mockup Uploader (Cris) */}
      {activeMockupSession && (
        <MockupUploader
          session={activeMockupSession}
          onUploadMockupAndSend={handleUploadMockupAndSend}
          onClose={() => setActiveMockupSession(null)}
        />
      )}

      {/* 7. Modal de Conversa WhatsApp Auditável */}
      {activeConversationSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-3xl bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-3 bg-[#EEEDE8] border-b border-[#D6D3CC] flex items-center justify-between">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#004AAD]" />
                <span>
                  Histórico da Conversa WhatsApp • Pedido {activeConversationSession.orderNumber} ({activeConversationSession.customerName})
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActiveConversationSession(null)}
                className="text-[#6B6A64] hover:text-[#272727] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto">
              <ConversationThread
                session={activeConversationSession}
                onSimulateCustomerReply={handleSimulateCustomerReply}
                onSendCrisMessage={handleSendCrisMessage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
