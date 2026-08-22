import React, { useState } from "react";
import {
  ArrowLeft,
  Printer,
  FileText,
  Truck,
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  User,
  MapPin,
  CreditCard,
  QrCode,
  Gift,
  Plus,
  Send,
} from "lucide-react";
import { Order, OrderStep, ItemPersonalization, InternalOrderNote, ArtApprovalSession } from "../../types";
import { Card } from "./Card";
import { OrderTimeline } from "./OrderTimeline";
import { PersonalizationBlock } from "./PersonalizationBlock";
import { ConversationThread } from "./ConversationThread";
import {
  getApprovalSessionsFromStorage,
  simulateIncomingCustomerMessage,
  sendCrisManualMessage,
} from "../../services/whatsappAIService";

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  onUpdateOrder: (updatedOrder: Order) => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({
  order,
  onBack,
  onUpdateOrder,
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order>(order);
  const [newNoteText, setNewNoteText] = useState("");
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isEmittingNfe, setIsEmittingNfe] = useState(false);
  const [showNfeSuccess, setShowNfeSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"geral" | "conversa_ia">("geral");

  // Sessões de aprovação de arte vinculadas a este pedido
  const [approvalSessions, setApprovalSessions] = useState<ArtApprovalSession[]>(() => {
    const all = getApprovalSessionsFromStorage();
    return all.filter(
      (s) =>
        s.orderId === order.id ||
        s.orderNumber === order.orderNumber ||
        s.orderNumber === `#${order.id.replace(/\D/g, "")}`
    );
  });

  const matchedSession = approvalSessions[0] || null;

  const handleSimulateReply = (text: string, mediaUrl?: string) => {
    if (!matchedSession) return;
    const updated = simulateIncomingCustomerMessage(matchedSession.id, text, mediaUrl);
    if (updated) {
      setApprovalSessions([updated]);
    }
  };

  const handleSendCrisMsg = (text: string) => {
    if (!matchedSession) return;
    const updated = sendCrisManualMessage(matchedSession.id, text);
    if (updated) {
      setApprovalSessions([updated]);
    }
  };

  // Avançar etapa da linha do tempo
  const handleAdvanceStep = (nextStep: OrderStep) => {
    const stepLabelMap: Record<string, string> = {
      pago: "Pagamento Confirmado",
      aguardando_arquivo: "Arquivos recebidos",
      arte_aprovacao: "Arte enviada para validação",
      em_producao: "Entrou na produção / ateliê",
      pronto: "Pronto e embalado com afeto",
      separar: "Separado no estoque",
      despachar: "Despachado para transporte",
      entregue: "Entregue ao cliente",
    };

    const newHistoryEvent = {
      step: nextStep,
      label: stepLabelMap[nextStep] || nextStep,
      date: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      updatedBy: "Lojista (Painel)",
    };

    const updated: Order = {
      ...currentOrder,
      currentStep: nextStep,
      stepHistory: [...(currentOrder.stepHistory || []), newHistoryEvent],
      actionRequired:
        nextStep === "pronto" || nextStep === "despachar" || nextStep === "entregue"
          ? { needed: false, reason: "", urgency: "baixa" }
          : currentOrder.actionRequired,
    };

    setCurrentOrder(updated);
    onUpdateOrder(updated);
  };

  // Atualizar personalização de um item específico
  const handleUpdateItemPersonalization = (
    itemIndex: number,
    updatedPersonalization: ItemPersonalization
  ) => {
    const updatedItems = [...currentOrder.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      personalization: updatedPersonalization,
    };

    const updated: Order = {
      ...currentOrder,
      items: updatedItems,
    };

    setCurrentOrder(updated);
    onUpdateOrder(updated);
  };

  // Adicionar nota interna
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote: InternalOrderNote = {
      id: `note-${Date.now()}`,
      text: newNoteText.trim(),
      date: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      author: "Lojista Glos",
    };

    const updated: Order = {
      ...currentOrder,
      internalNotes: [...(currentOrder.internalNotes || []), newNote],
    };

    setCurrentOrder(updated);
    onUpdateOrder(updated);
    setNewNoteText("");
  };

  // Emissão de NF-e placeholder funcional
  const handleEmitNfe = () => {
    setIsEmittingNfe(true);
    setTimeout(() => {
      const updated: Order = {
        ...currentOrder,
        nfeStatus: "emitida",
        nfeNumber: `000.014.${Math.floor(100 + Math.random() * 900)}`,
        nfeKey: `3526054819201900019455001000014${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      };
      setIsEmittingNfe(false);
      setShowNfeSuccess(true);
      setCurrentOrder(updated);
      onUpdateOrder(updated);
      setTimeout(() => setShowNfeSuccess(false), 4000);
    }, 1200);
  };

  // Copiar código de rastreio
  const handleCopyTracking = () => {
    if (!currentOrder.trackingCode) return;
    navigator.clipboard.writeText(currentOrder.trackingCode);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  // Link para WhatsApp com mensagem afetiva de acompanhamento
  const getWhatsAppLink = () => {
    const rawPhone = currentOrder.customer.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá ${currentOrder.customer.name}! Aqui é da Glos Presentes com uma atualização sobre seu pedido ${currentOrder.orderNumber || currentOrder.id}. Estamos cuidando de cada detalhe com muito carinho!`
    );
    return `https://wa.me/55${rawPhone}?text=${message}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header do Pedido */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D6D3CC]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
            title="Voltar para a lista de pedidos"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-medium text-[#272727]">
                Pedido {currentOrder.orderNumber || currentOrder.id}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#004AAD] font-medium">
                {currentOrder.orderType === "personalizado"
                  ? "Fluxo B (Personalizado)"
                  : "Fluxo A (Revenda)"}
              </span>
            </div>
            <p className="text-xs text-[#6B6A64] mt-0.5 tabular-nums">
              Realizado em {currentOrder.createdAt} • ID: {currentOrder.id}
            </p>
          </div>
        </div>

        {/* Ações de Topo */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Botão de WhatsApp */}
          <a
            href={getWhatsAppLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#272727] hover:bg-[#EEEDE8] transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#004AAD]" />
            <span>Falar no WhatsApp</span>
          </a>

          {/* Imprimir Etiqueta / Declaração */}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#272727] hover:bg-[#EEEDE8] transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#6B6A64]" />
            <span>Imprimir Etiqueta</span>
          </button>

          {/* Emitir NF-e */}
          {currentOrder.nfeStatus === "emitida" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs font-medium text-[#0F7A4F]">
              <Check className="w-3.5 h-3.5" />
              <span>NF-e {currentOrder.nfeNumber}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleEmitNfe}
              disabled={isEmittingNfe}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isEmittingNfe ? "Transmitindo à SEFAZ..." : "Emitir NF-e"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerta de NF-e emitida com sucesso */}
      {showNfeSuccess && (
        <div className="p-3 rounded-[8px] bg-[#F4F3EF] border border-[#D6D3CC] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#0F7A4F]">
            <Check className="w-4 h-4" />
            <span className="font-medium">
              Nota Fiscal Eletrônica emitida e autorizada com sucesso na SEFAZ!
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#6B6A64]">
            Chave: {currentOrder.nfeKey}
          </span>
        </div>
      )}

      {/* 2. Stepper / Linha do Tempo Visual */}
      <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC]">
        <OrderTimeline
          order={currentOrder}
          onAdvanceStep={handleAdvanceStep}
        />
      </Card>

      {/* Navegação de Abas do Pedido */}
      <div className="flex items-center gap-2 border-b border-[#D6D3CC] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("geral")}
          className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
            activeTab === "geral"
              ? "bg-[#004AAD] text-white"
              : "bg-[#F4F3EF] text-[#6B6A64] border border-[#D6D3CC] hover:bg-[#EEEDE8]"
          }`}
        >
          Visão Geral & Itens
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("conversa_ia")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
            activeTab === "conversa_ia"
              ? "bg-[#004AAD] text-white"
              : "bg-[#F4F3EF] text-[#6B6A64] border border-[#D6D3CC] hover:bg-[#EEEDE8]"
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Conversa WhatsApp & IA Glos</span>
          {matchedSession && (
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                matchedSession.requiresCrisAction ? "bg-[#9B2C2C]" : "bg-[#0F7A4F]"
              }`}
            />
          )}
        </button>
      </div>

      {activeTab === "conversa_ia" ? (
        <div className="space-y-4">
          {matchedSession ? (
            <ConversationThread
              session={matchedSession}
              onSimulateCustomerReply={handleSimulateReply}
              onSendCrisMessage={handleSendCrisMsg}
            />
          ) : (
            <div className="p-8 text-center bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] space-y-2">
              <MessageCircle className="w-8 h-8 text-[#9B998F] mx-auto" />
              <span className="text-xs font-medium text-[#272727] block">
                Nenhuma sessão ativa de aprovação de arte para este pedido
              </span>
              <p className="text-[11px] text-[#6B6A64] max-w-sm mx-auto">
                Este pedido é composto por itens de pronta-entrega / revenda ou a automação ainda não foi iniciada.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* 3. Grid Principal: Itens & Personalização (Esquerda) vs Resumo, Cliente & Entrega (Direita) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda: Itens e Blocos de Personalização (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Itens do Pedido */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727]">
                Itens do Pedido ({currentOrder.items.length})
              </span>
              <span className="text-[11px] text-[#6B6A64]">
                Subtotal: R$ {currentOrder.subtotal.toFixed(2).replace(".", ",")}
              </span>
            </div>

            <div className="space-y-6">
              {currentOrder.items.map((item, index) => (
                <div key={item.id || index} className="space-y-3">
                  {/* Linha do Produto */}
                  <div className="flex items-start gap-3 p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-[4px] object-cover bg-white border border-[#D6D3CC] shrink-0"
                    />

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-[#272727]">
                          {item.name}
                        </span>
                        <span className="text-xs font-medium text-[#272727] tabular-nums">
                          R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      {item.variantName && (
                        <p className="text-[11px] text-[#6B6A64]">
                          {item.variantName}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-1 text-[11px] text-[#9B998F]">
                        <span>SKU: {item.sku}</span>
                        <span className="tabular-nums">
                          {item.quantity} un × R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco de Personalização (se o produto for personalizável) */}
                  {(item.productType === "personalizavel" || item.personalization) && (
                    <PersonalizationBlock
                      personalization={item.personalization}
                      productName={item.name}
                      onUpdatePersonalization={(updated) =>
                        handleUpdateItemPersonalization(index, updated)
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Embalagem & Cartão Afetivo de Presente */}
          {currentOrder.giftWrap && (
            <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[#D6D3CC]">
                <Gift className="w-4 h-4 text-[#004AAD]" />
                <span className="text-xs font-medium text-[#272727]">
                  Experiência de Presente Glos (Embalagem & Dedicatória)
                </span>
              </div>

              <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#272727]">
                    Embalagem especial para presente inclusa
                  </span>
                  <span className="text-[10px] text-[#004AAD] font-medium">
                    ● Separar no ateliê
                  </span>
                </div>

                {currentOrder.giftCardMessage && (
                  <div className="pt-2 border-t border-[#D6D3CC]">
                    <span className="text-[10px] uppercase text-[#9B998F] block mb-1">
                      Mensagem do Cartão Afetivo:
                    </span>
                    <p className="text-xs text-[#272727] italic bg-[#F4F3EF] p-2.5 rounded-[4px] border border-[#D6D3CC]">
                      "{currentOrder.giftCardMessage}"
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Notas Internas da Operação / Ateliê */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727]">
                Notas Internas do Ateliê & Atendimento
              </span>
              <span className="text-[10px] text-[#9B998F]">
                Visíveis apenas para a equipe
              </span>
            </div>

            {/* Lista de notas */}
            <div className="space-y-2">
              {currentOrder.internalNotes && currentOrder.internalNotes.length > 0 ? (
                currentOrder.internalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#6B6A64]">
                      <span className="font-medium text-[#272727]">{note.author}</span>
                      <span className="tabular-nums">{note.date}</span>
                    </div>
                    <p className="text-xs text-[#272727]">{note.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-[#9B998F] py-2">
                  Nenhuma nota registrada para este pedido.
                </p>
              )}
            </div>

            {/* Formulário para nova nota */}
            <form onSubmit={handleAddNote} className="flex gap-2 pt-2 border-t border-[#D6D3CC]">
              <input
                type="text"
                placeholder="Adicionar nota interna (ex: cliente solicitou entrega até sexta)..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
              >
                Salvar Nota
              </button>
            </form>
          </Card>
        </div>

        {/* Coluna Direita: Dados do Cliente, Envio & Resumo Financeiro (1 col) */}
        <div className="space-y-6">
          {/* Dados do Cliente */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>Dados do Comprador</span>
              </span>
              <span className="text-[10px] text-[#9B998F]">
                {currentOrder.customer.personType || "PF"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-[#9B998F] block">Nome:</span>
                <span className="font-medium text-[#272727]">{currentOrder.customer.name}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#9B998F] block">E-mail:</span>
                <span className="text-[#272727]">{currentOrder.customer.email}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#9B998F] block">WhatsApp / Telefone:</span>
                <span className="text-[#272727]">{currentOrder.customer.phone}</span>
              </div>

              <div>
                <span className="text-[10px] text-[#9B998F] block">CPF:</span>
                <span className="text-[#272727] tabular-nums">{currentOrder.customer.cpf}</span>
              </div>

              {currentOrder.customer.totalOrdersCount && (
                <div className="pt-2 border-t border-[#D6D3CC] flex items-center justify-between text-[11px]">
                  <span className="text-[#6B6A64]">Histórico de compras:</span>
                  <span className="font-medium text-[#004AAD] tabular-nums">
                    {currentOrder.customer.totalOrdersCount} pedidos realizados
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Endereço & Entrega */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>Endereço de Entrega</span>
              </span>
              <span className="text-[10px] text-[#6B6A64]">
                {currentOrder.shippingOption.name}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-[#272727]">
              <p className="font-medium">{currentOrder.shippingAddress.recipientName}</p>
              <p>
                {currentOrder.shippingAddress.street}, {currentOrder.shippingAddress.number}
                {currentOrder.shippingAddress.complement && ` - ${currentOrder.shippingAddress.complement}`}
              </p>
              <p className="text-[#6B6A64]">
                {currentOrder.shippingAddress.neighborhood} • {currentOrder.shippingAddress.city} - {currentOrder.shippingAddress.state}
              </p>
              <p className="text-[#9B998F] tabular-nums">
                CEP: {currentOrder.shippingAddress.zipCode}
              </p>
            </div>

            {/* Código de Rastreamento */}
            <div className="pt-2 border-t border-[#D6D3CC] space-y-1.5">
              <span className="text-[10px] uppercase text-[#9B998F] block">
                Rastreamento do Envio:
              </span>
              {currentOrder.trackingCode ? (
                <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC]">
                  <span className="font-mono text-xs text-[#004AAD] font-medium">
                    {currentOrder.trackingCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyTracking}
                    className="p-1 text-[#6B6A64] hover:text-[#272727]"
                    title="Copiar rastreio"
                  >
                    {copiedTracking ? <Check className="w-3.5 h-3.5 text-[#0F7A4F]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-xs text-[#9B998F] italic block">
                  Código de rastreio será gerado ao despachar.
                </span>
              )}
            </div>
          </Card>

          {/* Resumo Financeiro */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>Resumo Financeiro</span>
              </span>
              <span className="text-[10px] text-[#0F7A4F] font-medium">
                ● {currentOrder.paymentStatus === "pago" ? "Pago" : "Pendente"}
              </span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6B6A64]">
                <span>Subtotal dos Itens:</span>
                <span className="tabular-nums text-[#272727]">
                  R$ {currentOrder.subtotal.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div className="flex justify-between text-[#6B6A64]">
                <span>Frete ({currentOrder.shippingOption.name}):</span>
                <span className="tabular-nums text-[#272727]">
                  {currentOrder.shippingPrice === 0
                    ? "Grátis"
                    : `R$ ${currentOrder.shippingPrice.toFixed(2).replace(".", ",")}`}
                </span>
              </div>

              {currentOrder.discount > 0 && (
                <div className="flex justify-between text-[#0F7A4F]">
                  <span>Desconto ({currentOrder.couponCode || "Cupom"}):</span>
                  <span className="tabular-nums">
                    - R$ {currentOrder.discount.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#D6D3CC] flex justify-between font-medium text-[#272727] text-sm">
                <span>Total do Pedido:</span>
                <span className="text-[#004AAD] tabular-nums">
                  R$ {currentOrder.total.toFixed(2).replace(".", ",")}
                </span>
              </div>

              {/* Informações do Pagamento */}
              <div className="mt-2 p-2 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px] text-[#6B6A64] space-y-0.5">
                <div className="flex justify-between">
                  <span>Método:</span>
                  <span className="font-medium text-[#272727] uppercase">
                    {currentOrder.paymentMethod === "pix" ? "PIX Instantâneo" : "Cartão de Crédito"}
                  </span>
                </div>
                {currentOrder.paymentDetails.cardBrand && (
                  <div className="flex justify-between">
                    <span>Cartão:</span>
                    <span>
                      {currentOrder.paymentDetails.cardBrand} •••• {currentOrder.paymentDetails.cardLast4} (
                      {currentOrder.paymentDetails.installments || 1}x)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
      )}
    </div>
  );
};
