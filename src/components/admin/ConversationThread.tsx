import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Sparkles,
  Send,
  User,
  CheckCheck,
  Check,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  Bot,
  UserCheck,
  AlertCircle,
  CornerDownRight,
  ExternalLink,
} from "lucide-react";
import { WhatsAppMessage, ArtApprovalSession } from "../../types";
import { Card } from "./Card";

interface ConversationThreadProps {
  session: ArtApprovalSession;
  onSimulateCustomerReply?: (text: string, mediaUrl?: string) => void;
  onSendCrisMessage?: (text: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export const ConversationThread: React.FC<ConversationThreadProps> = ({
  session,
  onSimulateCustomerReply,
  onSendCrisMessage,
  readOnly = false,
  compact = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [actingAs, setActingAs] = useState<"cliente" | "cris">("cliente");
  const [selectedSimulatedPhoto, setSelectedSimulatedPhoto] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.conversationThread]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    if (actingAs === "cliente" && onSimulateCustomerReply) {
      onSimulateCustomerReply(inputText.trim(), selectedSimulatedPhoto || undefined);
      setSelectedSimulatedPhoto("");
    } else if (actingAs === "cris" && onSendCrisMessage) {
      onSendCrisMessage(inputText.trim());
    }

    setInputText("");
  };

  const handleQuickCustomerAction = (text: string, mediaUrl?: string) => {
    if (onSimulateCustomerReply) {
      onSimulateCustomerReply(text, mediaUrl);
    }
  };

  return (
    <div className={`w-full flex flex-col ${compact ? "h-[450px]" : "h-[620px]"} bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden`}>
      {/* Header do Chat WhatsApp */}
      <div className="p-3 bg-[#EEEDE8] border-b border-[#D6D3CC] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#E4E2DD] border border-[#D6D3CC] flex items-center justify-center text-[#004AAD]">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#272727]">
                {session.customerName}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[3px] bg-[#F4F3EF] border border-[#D6D3CC] text-[#6B6A64] tabular-nums">
                {session.customerPhone}
              </span>
            </div>
            <p className="text-[11px] text-[#6B6A64] flex items-center gap-1">
              <span>IA Glos Ativa</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A4F]" />
              <span className="text-[10px] text-[#9B998F] ml-1">Pedido {session.orderNumber}</span>
            </p>
          </div>
        </div>

        {/* Status da Z-API */}
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#6B6A64] bg-[#F4F3EF] px-2 py-1 rounded-[4px] border border-[#D6D3CC]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#004AAD]" />
          <span>Z-API Conectada (Ambiente Servidor)</span>
        </div>
      </div>

      {/* Área de Mensagens (Thread) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#E4E2DD]/40">
        {/* Aviso de Início e Tom Glos */}
        <div className="text-center my-2">
          <span className="text-[10px] text-[#6B6A64] bg-[#EEEDE8] px-3 py-1 rounded-[12px] border border-[#D6D3CC] inline-block">
            Início do atendimento afetivo Glos • Tom acolhedor e seguro
          </span>
        </div>

        {session.conversationThread.map((msg) => {
          const isIA = msg.sender === "ia";
          const isCris = msg.sender === "lojista";
          const isCustomer = msg.sender === "cliente";

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${
                isCustomer ? "items-start" : "items-end"
              } max-w-[85%] ${isCustomer ? "mr-auto" : "ml-auto"}`}
            >
              {/* Balão */}
              <div
                className={`p-3 rounded-[8px] border space-y-1.5 text-xs shadow-none ${
                  isIA
                    ? "bg-[#F4F3EF] border-[#D6D3CC] text-[#272727]"
                    : isCris
                    ? "bg-[#EEEDE8] border-[#004AAD]/30 text-[#272727]"
                    : "bg-white border-[#D6D3CC] text-[#272727]"
                }`}
              >
                {/* Remetente & Badge */}
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-[#D6D3CC]/60 text-[10px]">
                  <div className="flex items-center gap-1">
                    {isIA && (
                      <>
                        <Sparkles className="w-3 h-3 text-[#004AAD]" />
                        <span className="font-medium text-[#004AAD]">IA Glos Presentes</span>
                      </>
                    )}
                    {isCris && (
                      <>
                        <UserCheck className="w-3 h-3 text-[#272727]" />
                        <span className="font-medium text-[#272727]">Cris (Ateliê Glos)</span>
                      </>
                    )}
                    {isCustomer && (
                      <>
                        <User className="w-3 h-3 text-[#6B6A64]" />
                        <span className="font-medium text-[#272727]">{session.customerName}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[#9B998F] tabular-nums">{msg.timestamp}</span>
                </div>

                {/* Mídia Anexada (se houver) */}
                {msg.mediaUrl && (
                  <div className="pt-1">
                    <div className="relative group rounded-[6px] overflow-hidden border border-[#D6D3CC] bg-[#EEEDE8]">
                      <img
                        src={msg.mediaUrl}
                        alt="Anexo WhatsApp"
                        referrerPolicy="no-referrer"
                        className="w-full max-h-48 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => window.open(msg.mediaUrl, "_blank")}
                      />
                      <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-[3px] flex items-center gap-1">
                        <ImageIcon className="w-2.5 h-2.5" />
                        <span>Clique para ampliar</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Texto da Mensagem */}
                <p className="text-xs leading-relaxed text-[#272727] whitespace-pre-wrap">
                  {msg.text}
                </p>

                {/* Tag de Intenção Detectada pela IA (Auditável) */}
                {msg.intentDetected && (
                  <div className="pt-1 flex items-center gap-1 text-[10px] text-[#6B6A64]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#004AAD]" />
                    <span className="italic">
                      Intenção detectada:{" "}
                      <strong className="font-medium text-[#272727]">
                        {msg.intentDetected === "aprovacao"
                          ? "Aprovação Imediata"
                          : msg.intentDetected === "solicitacao_ajuste"
                          ? "Pedido de Ajuste de Arte"
                          : msg.intentDetected === "envio_arquivo"
                          ? "Envio de Foto/Arquivo"
                          : msg.intentDetected}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Status de Envio */}
              <div className="flex items-center gap-1 px-1 mt-0.5 text-[10px] text-[#9B998F]">
                {msg.status === "read" ? (
                  <CheckCheck className="w-3 h-3 text-[#004AAD]" />
                ) : (
                  <Check className="w-3 h-3 text-[#9B998F]" />
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Caixa de Interação / Simulação */}
      {!readOnly && (
        <div className="p-3 bg-[#EEEDE8] border-t border-[#D6D3CC] space-y-2.5">
          {/* Ações Rápidas de Simulação para Testes da Lógica */}
          <div className="flex items-center justify-between text-[11px] gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[#6B6A64]">Simular como:</span>
              <button
                type="button"
                onClick={() => setActingAs("cliente")}
                className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium transition-colors ${
                  actingAs === "cliente"
                    ? "bg-[#004AAD] text-white border-[#004AAD]"
                    : "bg-[#F4F3EF] text-[#6B6A64] border-[#D6D3CC]"
                }`}
              >
                Cliente (WhatsApp)
              </button>
              <button
                type="button"
                onClick={() => setActingAs("cris")}
                className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-medium transition-colors ${
                  actingAs === "cris"
                    ? "bg-[#272727] text-white border-[#272727]"
                    : "bg-[#F4F3EF] text-[#6B6A64] border-[#D6D3CC]"
                }`}
              >
                Cris (Intervenção Manual)
              </button>
            </div>

            {actingAs === "cliente" && (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickCustomerAction("Amei demais! Ficou perfeita, está 100% aprovada!")}
                  className="px-2 py-0.5 rounded-[4px] bg-[#F4F3EF] border border-[#D6D3CC] text-[10px] text-[#0F7A4F] font-medium hover:bg-[#E4E2DD]"
                >
                  ⚡ "Aprovado!"
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickCustomerAction("Gostaria de pedir um ajuste: trocar a foto por outra mais nítida.")}
                  className="px-2 py-0.5 rounded-[4px] bg-[#F4F3EF] border border-[#D6D3CC] text-[10px] text-[#004AAD] font-medium hover:bg-[#E4E2DD]"
                >
                  ⚡ "Pedir Ajuste"
                </button>
              </div>
            )}
          </div>

          {/* Form de Envio */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                actingAs === "cliente"
                  ? "Digite como cliente (ex: 'Ficou linda, pode produzir!' ou 'Pode clarear a foto?')"
                  : "Digite como Cris para intervir manualmente no WhatsApp..."
              }
              className="flex-1 px-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD]"
            />

            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3.5 py-2 bg-[#004AAD] text-white rounded-[6px] text-xs font-medium hover:bg-[#003884] disabled:opacity-50 transition-colors inline-flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
