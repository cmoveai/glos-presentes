import React, { useState } from "react";
import {
  Sparkles,
  QrCode,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Upload,
  AlertCircle,
  Eye,
  Edit2,
  Check,
} from "lucide-react";
import { ItemPersonalization, CustomerFile } from "../../types";
import { Card } from "./Card";

interface PersonalizationBlockProps {
  personalization?: ItemPersonalization;
  productName: string;
  onUpdatePersonalization?: (updated: ItemPersonalization) => void;
  readOnly?: boolean;
}

/**
 * 4.3 Bloco de Personalização & Aprovação de Arte (PersonalizationBlock) — glos.
 * Mostra arquivos do cliente, mockup, QR Sublima Play e status de aprovação de arte.
 */
export const PersonalizationBlock: React.FC<PersonalizationBlockProps> = ({
  personalization,
  productName,
  onUpdatePersonalization,
  readOnly = false,
}) => {
  const [data, setData] = useState<ItemPersonalization>(
    personalization || {
      customerFiles: [],
      customText: "",
      mockupUrl: "",
      qrLink: "",
      qrApplied: false,
      approvalStatus: "aguardando_envio",
      interactivePlayType: "musica_spotify",
    }
  );

  const [isEditingQr, setIsEditingQr] = useState(false);
  const [tempQrLink, setTempQrLink] = useState(data.qrLink || "");
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState(
    data.rejectionReason || ""
  );

  const handleStatusChange = (
    newStatus: ItemPersonalization["approvalStatus"]
  ) => {
    if (newStatus === "reprovado") {
      setShowRejectionModal(true);
      return;
    }

    const updated: ItemPersonalization = {
      ...data,
      approvalStatus: newStatus,
      approvalDate:
        newStatus === "aprovado"
          ? new Date().toLocaleDateString("pt-BR")
          : undefined,
      rejectionReason: undefined,
    };
    setData(updated);
    if (onUpdatePersonalization) onUpdatePersonalization(updated);
  };

  const handleConfirmRejection = () => {
    const updated: ItemPersonalization = {
      ...data,
      approvalStatus: "reprovado",
      rejectionReason:
        rejectionReasonText || "Necessário ajuste no alinhamento/cores da arte.",
    };
    setData(updated);
    setShowRejectionModal(false);
    if (onUpdatePersonalization) onUpdatePersonalization(updated);
  };

  const handleToggleQrApplied = () => {
    if (readOnly) return;
    const updated: ItemPersonalization = {
      ...data,
      qrApplied: !data.qrApplied,
    };
    setData(updated);
    if (onUpdatePersonalization) onUpdatePersonalization(updated);
  };

  const handleSaveQrLink = () => {
    const updated: ItemPersonalization = {
      ...data,
      qrLink: tempQrLink,
    };
    setData(updated);
    setIsEditingQr(false);
    if (onUpdatePersonalization) onUpdatePersonalization(updated);
  };

  const getStatusLabelAndDot = () => {
    switch (data.approvalStatus) {
      case "aprovado":
        return {
          label: "Arte Aprovada pelo Cliente",
          dotColor: "bg-[#0F7A4F]",
          textColor: "text-[#272727]",
        };
      case "reprovado":
        return {
          label: "Arte Reprovada (Requer Ajuste)",
          dotColor: "bg-[#9B2C2C]",
          textColor: "text-[#9B2C2C]",
        };
      case "aguardando_aprovacao":
        return {
          label: "Aguardando Aprovação do Cliente",
          dotColor: "bg-[#004AAD]",
          textColor: "text-[#004AAD]",
        };
      case "aguardando_envio":
      default:
        return {
          label: "Aguardando Envio de Arquivos",
          dotColor: "bg-[#9B998F]",
          textColor: "text-[#6B6A64]",
        };
    }
  };

  const statusInfo = getStatusLabelAndDot();

  return (
    <div className="w-full bg-[#EEEDE8] border border-[#D6D3CC] rounded-[8px] p-4 space-y-4 text-xs">
      {/* Topo do Bloco: Título + Status da Aprovação (Rótulo + Ponto) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D6D3CC]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#004AAD]" />
          <span className="font-medium text-[#272727]">
            Personalização & Matriz de Produção
          </span>
          <span className="text-[11px] text-[#6B6A64]">({productName})</span>
        </div>

        {/* Status da aprovação (Rótulo + Ponto) */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#F4F3EF] border border-[#D6D3CC]">
            <span className={`w-2 h-2 rounded-full ${statusInfo.dotColor}`} />
            <span className={`font-medium text-[11px] ${statusInfo.textColor}`}>
              {statusInfo.label}
            </span>
          </span>

          {!readOnly && (
            <div className="flex items-center gap-1">
              {data.approvalStatus !== "aprovado" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("aprovado")}
                  className="px-2.5 py-1 rounded-[4px] bg-[#004AAD] text-white text-[11px] font-medium hover:bg-[#003884] transition-colors"
                  title="Marcar arte como aprovada"
                >
                  Aprovar
                </button>
              )}

              {data.approvalStatus !== "reprovado" && (
                <button
                  type="button"
                  onClick={() => handleStatusChange("reprovado")}
                  className="px-2.5 py-1 rounded-[4px] bg-[#F4F3EF] border border-[#D6D3CC] text-[#9B2C2C] text-[11px] font-medium hover:bg-[#EEEDE8] transition-colors"
                  title="Marcar como reprovada com motivo"
                >
                  Reprovar
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Alerta se houver reprovação */}
      {data.approvalStatus === "reprovado" && data.rejectionReason && (
        <div className="p-3 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] flex items-start gap-2">
          <span className="w-2 h-2 rounded-full bg-[#9B2C2C] mt-1 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-medium text-[#9B2C2C] block">
              Motivo do Ajuste Solicitado pelo Cliente:
            </span>
            <p className="text-[11px] text-[#272727]">
              "{data.rejectionReason}"
            </p>
          </div>
        </div>
      )}

      {/* Grid de 3 Colunas: Arquivos do Cliente | Mockup Prévia | QR Interativo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Arquivos do Cliente */}
        <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#272727]">
              Arquivo(s) Enviados pelo Cliente
            </span>
            <span className="text-[10px] text-[#9B998F] tabular-nums">
              {data.customerFiles.length} item(ns)
            </span>
          </div>

          {data.customerFiles.length > 0 ? (
            <div className="space-y-2 pt-1">
              {data.customerFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-2 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC]"
                >
                  {file.type === "imagem" ? (
                    <div className="w-10 h-10 rounded-[3px] overflow-hidden bg-white border border-[#D6D3CC] shrink-0">
                      <img
                        src={file.url}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : file.type === "audio" ? (
                    <div className="w-10 h-10 rounded-[3px] bg-[#E4E2DD] flex items-center justify-center text-[#004AAD] shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-[3px] bg-[#E4E2DD] flex items-center justify-center text-[#004AAD] shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-medium text-[#004AAD] hover:underline truncate block"
                    >
                      {file.name}
                    </a>
                    <span className="text-[10px] text-[#6B6A64] block">
                      {file.size || "Original"} {file.uploadedAt && `• ${file.uploadedAt}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center rounded-[4px] bg-[#EEEDE8] border border-dashed border-[#D6D3CC] space-y-1">
              <Clock className="w-4 h-4 text-[#9B998F] mx-auto" />
              <span className="text-[11px] text-[#6B6A64] block">
                Nenhum arquivo enviado ainda.
              </span>
              <span className="text-[10px] text-[#9B998F] block">
                Aguardando cliente enviar via WhatsApp/Site
              </span>
            </div>
          )}

          {/* Texto / Frase gravada */}
          {data.customText && (
            <div className="pt-2 border-t border-[#D6D3CC]">
              <span className="text-[10px] uppercase tracking-wider text-[#9B998F] block mb-0.5">
                Frase / Gravação Solicitada:
              </span>
              <p className="text-[11px] text-[#272727] italic bg-[#EEEDE8] p-2 rounded-[4px] border border-[#D6D3CC]">
                "{data.customText}"
              </p>
            </div>
          )}
        </div>

        {/* 2. Mockup Prévia Gerado */}
        <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#272727]">
              Mockup de Aplicação / Prova Visual
            </span>
            {data.mockupUrl && (
              <a
                href={data.mockupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#004AAD] hover:underline flex items-center gap-1"
              >
                <span>Ampliar</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {data.mockupUrl ? (
            <div className="w-full h-32 rounded-[4px] overflow-hidden bg-[#E4E2DD] border border-[#D6D3CC] relative group">
              <img
                src={data.mockupUrl}
                alt="Mockup da peça"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a
                  href={data.mockupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-[4px] bg-[#F4F3EF] text-[#272727] text-[11px] font-medium"
                >
                  Ver imagem full-res
                </a>
              </div>
            </div>
          ) : (
            <div className="h-32 rounded-[4px] bg-[#EEEDE8] border border-dashed border-[#D6D3CC] flex flex-col items-center justify-center p-3 text-center space-y-1">
              <ImageIcon className="w-5 h-5 text-[#9B998F]" />
              <span className="text-[11px] text-[#6B6A64]">
                Mockup ainda não gerado
              </span>
              <span className="text-[10px] text-[#9B998F]">
                Geração automática conectada à esteira de IA
              </span>
            </div>
          )}
        </div>

        {/* 3. QR Code Interativo (Sublima Play) */}
        <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#272727] flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-[#004AAD]" />
              <span>QR Interativo (Sublima Play)</span>
            </span>
          </div>

          <div className="space-y-2">
            {/* Toggle de QR Aplicado */}
            <div className="flex items-center justify-between p-2 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC]">
              <div>
                <span className="text-[11px] text-[#272727] font-medium block">
                  QR Aplicado na Peça
                </span>
                <span className="text-[10px] text-[#6B6A64]">
                  {data.qrApplied
                    ? "Incluso na matriz de gravação"
                    : "Pendente de inserção na arte"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleQrApplied}
                disabled={readOnly}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  data.qrApplied ? "bg-[#004AAD]" : "bg-[#D6D3CC]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                    data.qrApplied ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Link do QR Code */}
            {isEditingQr ? (
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  value={tempQrLink}
                  onChange={(e) => setTempQrLink(e.target.value)}
                  placeholder="https://glos.com.br/play/v/exemplo"
                  className="w-full px-2 py-1 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[4px] font-mono text-[11px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingQr(false)}
                    className="px-2 py-0.5 rounded text-[10px] text-[#6B6A64]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveQrLink}
                    className="px-2.5 py-0.5 rounded bg-[#004AAD] text-white text-[10px] font-medium"
                  >
                    Salvar Link
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase text-[#9B998F] block">
                    Link de Destino do QR:
                  </span>
                  <span className="text-[11px] font-mono text-[#004AAD] truncate block">
                    {data.qrLink || "Nenhum link configurado"}
                  </span>
                </div>

                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setTempQrLink(data.qrLink || "");
                      setIsEditingQr(true);
                    }}
                    className="p-1 rounded text-[#6B6A64] hover:text-[#004AAD]"
                    title="Editar link do QR"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Reprovação com Motivo */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden">
            <div className="p-3 border-b border-[#D6D3CC] flex items-center justify-between bg-[#EEEDE8]">
              <span className="font-medium text-[#272727] text-xs">
                Registrar Reprovação / Ajuste Solicitado
              </span>
              <button
                onClick={() => setShowRejectionModal(false)}
                className="text-[#6B6A64] hover:text-[#272727]"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3">
              <label className="block text-[11px] text-[#6B6A64]">
                Descreva o motivo informado pelo cliente ou identificado pelo designer:
              </label>
              <textarea
                rows={3}
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="Ex: Cliente solicitou alteração na cor do texto para marrom escuro."
                className="w-full p-2 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
              />

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D6D3CC]">
                <button
                  type="button"
                  onClick={() => setShowRejectionModal(false)}
                  className="px-3 py-1 rounded-[4px] bg-[#EEEDE8] text-[#6B6A64]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  className="px-3.5 py-1 rounded-[4px] bg-[#9B2C2C] text-white font-medium hover:bg-[#802222]"
                >
                  Confirmar Reprovação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
