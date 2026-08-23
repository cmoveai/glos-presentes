import React from "react";
import {
  Sparkles,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  ExternalLink,
  Layers,
  Send,
  User,
  ArrowRight,
  RefreshCw,
  Eye,
  Music,
  Video,
  FileText,
  Download,
} from "lucide-react";
import { ArtApprovalSession, ArtApprovalState } from "../../types";
import { Card } from "./Card";

interface ApprovalCardProps {
  session: ArtApprovalSession;
  onOpenMockupUploader: (session: ArtApprovalSession) => void;
  onOpenConversation: (session: ArtApprovalSession) => void;
  onViewOrderDetails?: (orderId: string) => void;
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
  session,
  onOpenMockupUploader,
  onOpenConversation,
  onViewOrderDetails,
}) => {
  const getStatusBadge = (state: ArtApprovalState) => {
    switch (state) {
      case "aguardando_arquivo":
        return {
          label: "Aguardando Arquivo do Cliente",
          dotColor: "bg-[#9B998F]",
          textColor: "text-[#6B6A64]",
          borderTone: "border-[#D6D3CC]",
        };
      case "arquivo_recebido":
        return {
          label: "Arquivo Recebido • Montar Mockup",
          dotColor: "bg-[#004AAD]",
          textColor: "text-[#004AAD]",
          borderTone: "border-[#004AAD]/40",
          actionRequired: true,
        };
      case "mockup_pronto":
      case "aguardando_aprovacao":
        return {
          label: "Aguardando Aprovação no WhatsApp",
          dotColor: "bg-[#004AAD]",
          textColor: "text-[#272727]",
          borderTone: "border-[#D6D3CC]",
        };
      case "ajuste_solicitado":
        return {
          label: "Ajuste Solicitado pelo Cliente",
          dotColor: "bg-[#9B2C2C]",
          textColor: "text-[#9B2C2C]",
          borderTone: "border-[#9B2C2C]/40",
          actionRequired: true,
        };
      case "aprovado":
        return {
          label: "Arte Aprovada • Em Produção",
          dotColor: "bg-[#0F7A4F]",
          textColor: "text-[#0F7A4F]",
          borderTone: "border-[#0F7A4F]/40",
        };
      default:
        return {
          label: state,
          dotColor: "bg-[#9B998F]",
          textColor: "text-[#272727]",
          borderTone: "border-[#D6D3CC]",
        };
    }
  };

  const statusInfo = getStatusBadge(session.state);
  const lastMessage = session.conversationThread[session.conversationThread.length - 1];

  return (
    <Card
      className={`p-4 bg-[#F4F3EF] border rounded-[8px] space-y-3.5 transition-all ${
        session.requiresCrisAction ? "border-[#004AAD]/50 bg-[#F4F3EF]" : "border-[#D6D3CC]"
      }`}
    >
      {/* 1. Header do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#D6D3CC]">
        <div className="flex items-center gap-2">
          {session.requiresCrisAction && (
            <span className="w-2 h-2 rounded-full bg-[#004AAD] shrink-0" title="Ação da Cris necessária" />
          )}
          <span className="text-xs font-medium text-[#272727]">
            Pedido {session.orderNumber}
          </span>
          <span className="text-[11px] text-[#6B6A64]">
            • {session.customerName}
          </span>
          <span className="text-[10px] text-[#9B998F] tabular-nums">
            ({session.customerPhone})
          </span>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border text-[11px] font-medium ${statusInfo.borderTone}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
            <span className={statusInfo.textColor}>{statusInfo.label}</span>
          </span>
        </div>
      </div>

      {/* 2. Conteúdo Principal: Produto e Mídias */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Coluna do Produto (4 cols) */}
        <div className="md:col-span-4 flex items-center gap-2.5 p-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]">
          <img
            src={session.productImage}
            alt={session.productName}
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-[4px] object-cover bg-white border border-[#D6D3CC] shrink-0"
          />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-[#272727] truncate block">
              {session.productName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] text-[#6B6A64]">
                Ateliê Glos
              </span>
              {session.qrLink && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-[#F4F3EF] border border-[#D6D3CC] text-[#004AAD] font-medium font-mono">
                  QR Play
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Arquivos do Cliente (4 cols) */}
        <div className="md:col-span-4 p-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-[#9B998F] block font-medium">
              Arquivo do Cliente ({session.customerUploadedFiles?.length || 0})
            </span>
            {session.customerUploadedFiles && session.customerUploadedFiles.length > 0 && (
              <span className="text-[9px] text-[#0F7A4F] font-medium">Alta Resolução</span>
            )}
          </div>

          {session.customerUploadedFiles && session.customerUploadedFiles.length > 0 ? (
            <div className="space-y-1.5">
              {session.customerUploadedFiles.slice(0, 2).map((file, idx) => (
                <div key={file.id || idx} className="flex items-center gap-2">
                  {file.type === "imagem" ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-[4px] object-cover bg-white border border-[#D6D3CC] shrink-0"
                    />
                  ) : file.type === "audio" ? (
                    <div className="w-8 h-8 rounded-[4px] bg-[#E4E2DD] border border-[#D6D3CC] flex items-center justify-center text-[#004AAD] shrink-0">
                      <Music className="w-4 h-4" />
                    </div>
                  ) : file.type === "video" ? (
                    <div className="w-8 h-8 rounded-[4px] bg-[#E4E2DD] border border-[#D6D3CC] flex items-center justify-center text-[#004AAD] shrink-0">
                      <Video className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-[4px] bg-[#E4E2DD] border border-[#D6D3CC] flex items-center justify-center text-[#6B6A64] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#004AAD] hover:underline font-medium truncate block"
                      title={file.name}
                    >
                      {file.name}
                    </a>
                    <span className="text-[10px] text-[#6B6A64] block tabular-nums">
                      {file.size || "Original (Site)"}
                    </span>
                  </div>
                </div>
              ))}
              {session.customerUploadedFiles.length > 2 && (
                <span className="text-[10px] text-[#6B6A64] block">
                  + {session.customerUploadedFiles.length - 2} outro(s) arquivo(s)
                </span>
              )}
            </div>
          ) : session.customerTextDeclaration ? (
            <span className="text-[11px] text-[#272727] italic truncate block">
              "{session.customerTextDeclaration}"
            </span>
          ) : (
            <span className="text-[11px] text-[#9B998F] italic block">
              Aguardando envio do cliente
            </span>
          )}
        </div>

        {/* Coluna Mockup da Cris (4 cols) */}
        <div className="md:col-span-4 p-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase text-[#9B998F] block font-medium">
              Prova Visual / Mockup
            </span>
            {session.mockupUrl && (
              <button
                type="button"
                onClick={() => onOpenMockupUploader(session)}
                className="text-[9px] text-[#004AAD] hover:underline"
              >
                Trocar
              </button>
            )}
          </div>

          {session.mockupUrl ? (
            <div className="flex items-center gap-2">
              <img
                src={session.mockupUrl}
                alt="Mockup Prova"
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-[4px] object-cover bg-white border border-[#D6D3CC] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] text-[#272727] font-medium truncate block">
                  Mockup Anexado
                </span>
                <span className="text-[10px] text-[#004AAD] block tabular-nums">
                  {session.mockupGeneratedAt || "Pronto"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#9B998F] italic">
                Pendente de anexo
              </span>
              <button
                type="button"
                onClick={() => onOpenMockupUploader(session)}
                className="text-[10px] text-[#004AAD] font-medium hover:underline"
              >
                + Anexar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Destaque Editorial se houver Ajuste Solicitado */}
      {(session.state === "ajuste_solicitado" || session.rejectionReason || session.comentarioAjuste) && (
        <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#9B2C2C]/40 space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#9B2C2C]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Ajuste Solicitado pelo Cliente:</span>
          </div>
          <p className="text-xs text-[#272727] italic pl-5">
            "{session.comentarioAjuste || session.rejectionReason}"
          </p>
        </div>
      )}

      {/* 4. Última Interação no WhatsApp */}
      {lastMessage && (
        <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-start gap-2 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#004AAD] mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-[10px] text-[#6B6A64]">
              <span className="font-medium text-[#272727]">{lastMessage.senderName}</span>
              <span className="tabular-nums">{lastMessage.timestamp}</span>
            </div>
            <p className="text-[11px] text-[#6B6A64] truncate mt-0.5">
              {lastMessage.text}
            </p>
          </div>
        </div>
      )}

      {/* 5. Barra de Ações Contextuais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#D6D3CC] text-xs">
        <button
          type="button"
          onClick={() => onOpenConversation(session)}
          className="inline-flex items-center gap-1 text-[#004AAD] font-medium hover:underline self-start"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Ver Conversa no WhatsApp ({session.conversationThread.length} msgs)</span>
        </button>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {session.state === "arquivo_recebido" && (
            <button
              type="button"
              onClick={() => onOpenMockupUploader(session)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Montar Mockup & Enviar</span>
            </button>
          )}

          {session.state === "ajuste_solicitado" && (
            <button
              type="button"
              onClick={() => onOpenMockupUploader(session)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Subir Novo Mockup (Ajuste)</span>
            </button>
          )}

          {session.state === "aguardando_aprovacao" && (
            <button
              type="button"
              onClick={() => onOpenConversation(session)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs text-[#272727] font-medium hover:bg-[#E4E2DD]"
            >
              <Eye className="w-3.5 h-3.5 text-[#6B6A64]" />
              <span>Acompanhar Aprovação</span>
            </button>
          )}

          {session.state === "aprovado" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[#0F7A4F] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aprovado & Em Produção</span>
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
