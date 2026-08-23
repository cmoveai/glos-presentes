import React, { useState } from "react";
import {
  Upload,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Layers,
  Send,
  X,
  QrCode,
  Link,
  Music,
  Video,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Card } from "./Card";
import { ArtApprovalSession } from "../../types";

interface MockupUploaderProps {
  session: ArtApprovalSession;
  onUploadMockupAndSend: (
    mockupUrl: string,
    qrLink?: string,
    qrApplied?: boolean
  ) => void;
  onClose: () => void;
}

const PRESET_MOCKUPS = [
  {
    name: "Caneca Branca Clássica (Prova Visual Sublima)",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
  },
  {
    name: "Quadro A4 Moldura Preta (Layout Spotify / Afeto)",
    url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80",
  },
  {
    name: "Chaveiro Espelhado & Foto Resina",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80",
  },
  {
    name: "Azulejo 20x20 com Suporte de Madeira",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&q=80",
  },
  {
    name: "Caixa Presente de Madeira com Gravação",
    url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80",
  },
];

export const MockupUploader: React.FC<MockupUploaderProps> = ({
  session,
  onUploadMockupAndSend,
  onClose,
}) => {
  const [selectedMockupUrl, setSelectedMockupUrl] = useState<string>(
    session.mockupUrl || PRESET_MOCKUPS[0].url
  );
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Sublima Play Interactive Fields (QR Link / Áudio / Vídeo)
  const isInteractiveProduct =
    session.isInteractiveProduct ||
    session.productName.toLowerCase().includes("spotify") ||
    session.productName.toLowerCase().includes("quadro") ||
    session.productName.toLowerCase().includes("interativ") ||
    session.productName.toLowerCase().includes("play") ||
    session.productName.toLowerCase().includes("vídeo") ||
    session.productName.toLowerCase().includes("áudio") ||
    Boolean(session.customerSongOrUrl);

  const [qrLink, setQrLink] = useState<string>(
    session.qrLink ||
      (session.customerSongOrUrl
        ? `https://glos.com.br/play/v/${session.orderNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`
        : "")
  );
  const [qrApplied, setQrApplied] = useState<boolean>(
    session.qrApplied !== undefined ? session.qrApplied : true
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error("Formato inválido. Selecione um arquivo de imagem (JPG, PNG, WEBP)."));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1600; // Alta resolução para mockups Glos

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
            resolve(dataUrl);
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setIsProcessingFile(true);
      try {
        const dataUrl = await processImageFile(e.dataTransfer.files[0]);
        setSelectedMockupUrl(dataUrl);
      } catch (err) {
        console.error("Erro ao ler arquivo:", err);
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingFile(true);
      try {
        const dataUrl = await processImageFile(e.target.files[0]);
        setSelectedMockupUrl(dataUrl);
      } catch (err) {
        console.error("Erro ao ler arquivo:", err);
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMockupUrl) return;
    onUploadMockupAndSend(
      selectedMockupUrl,
      isInteractiveProduct ? qrLink : undefined,
      isInteractiveProduct ? qrApplied : undefined
    );
  };

  const adjustmentReason = session.comentarioAjuste || session.rejectionReason;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-3.5 bg-[#EEEDE8] border-b border-[#D6D3CC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#004AAD]" />
            <div>
              <h2 className="text-xs font-medium text-[#272727]">
                Anexar Mockup da Arte • Pedido {session.orderNumber}
              </h2>
              <p className="text-[10px] text-[#6B6A64]">
                Cliente: {session.customerName} • {session.productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#E4E2DD]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Lembrete de Regra de Ouro da Glos */}
          <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px] text-[#6B6A64] space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[#272727]">
              <Sparkles className="w-3.5 h-3.5 text-[#004AAD]" />
              <span>Regra do Ateliê Glos:</span>
            </div>
            <p>
              A Cris monta a prova visual com cuidado no <strong>Sublima / software de design</strong>. Ao anexar o arquivo e clicar em <strong>"Enviar para aprovação"</strong>, o pedido vai para o status <strong>aguardando_aprovacao</strong>, a Área do Cliente passa a exibir a imagem para aprovação e a notificação é disparada.
            </p>
          </div>

          {/* Destaque do Ajuste Solicitado (se houver) */}
          {adjustmentReason && (
            <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#9B2C2C]/50 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-[#9B2C2C]">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ajuste Solicitado pelo Cliente (Atenção ao Montar):</span>
              </div>
              <p className="text-xs text-[#272727] italic pl-5">
                "{adjustmentReason}"
              </p>
              <p className="text-[10px] text-[#6B6A64] pl-5 pt-0.5">
                Subir um novo mockup abaixo substituirá a versão anterior e liberará uma nova rodada de aprovação para o cliente.
              </p>
            </div>
          )}

          {/* 1. Materiais e Referências Recebidos do Cliente */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-[#272727] block">
              Materiais & Arquivos de Referência do Cliente:
            </span>

            {session.customerUploadedFiles && session.customerUploadedFiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {session.customerUploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2.5 p-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]"
                  >
                    {file.type === "imagem" ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-[4px] object-cover bg-white border border-[#D6D3CC] shrink-0"
                      />
                    ) : file.type === "audio" ? (
                      <div className="w-10 h-10 rounded-[4px] bg-[#E4E2DD] border border-[#D6D3CC] flex items-center justify-center text-[#004AAD] shrink-0">
                        <Music className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-[4px] bg-[#E4E2DD] border border-[#D6D3CC] flex items-center justify-center text-[#004AAD] shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-medium text-[#272727] truncate block">
                        {file.name}
                      </span>
                      <span className="text-[10px] text-[#9B998F] block tabular-nums">
                        {file.size || "Enviado no WhatsApp / Site"}
                      </span>
                    </div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#004AAD] hover:underline shrink-0"
                    >
                      Ver original
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px] text-[#6B6A64]">
                Arquivos enviados pelo WhatsApp vinculados a este pedido.
              </div>
            )}

            {session.customerTextDeclaration && (
              <div className="p-2.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px]">
                <span className="text-[10px] uppercase text-[#9B998F] block mb-0.5 font-medium">
                  Frase / Dedicatória Solicitada pelo Cliente:
                </span>
                <span className="text-[#272727] italic">
                  "{session.customerTextDeclaration}"
                </span>
              </div>
            )}

            {session.customerSongOrUrl && (
              <div className="p-2.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px]">
                <span className="text-[10px] uppercase text-[#9B998F] block mb-0.5 font-medium">
                  Música / Link para QR Interativo:
                </span>
                <span className="text-[#004AAD] font-mono text-[10px]">
                  {session.customerSongOrUrl}
                </span>
              </div>
            )}
          </div>

          {/* 2. Campo Interativo Sublima Play (quando aplicável) */}
          {isInteractiveProduct && (
            <div className="space-y-2 pt-2 border-t border-[#D6D3CC]">
              <div className="flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#004AAD]" />
                <span className="text-[11px] font-medium text-[#272727]">
                  Sublima Play • QR Code de Áudio/Vídeo
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EEEDE8] text-[#004AAD] border border-[#D6D3CC]">
                  Produto Interativo
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-8">
                  <label className="text-[10px] text-[#6B6A64] block mb-0.5">
                    Link de destino do QR gerado no Sublima Play:
                  </label>
                  <input
                    type="url"
                    value={qrLink}
                    onChange={(e) => setQrLink(e.target.value)}
                    placeholder="https://glos.com.br/play/v/musica-especial"
                    className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[4px] text-xs font-mono text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-2 pt-3 sm:pt-4">
                  <label className="text-[11px] text-[#272727] font-medium cursor-pointer">
                    QR Aplicado na Matriz:
                  </label>
                  <input
                    type="checkbox"
                    checked={qrApplied}
                    onChange={(e) => setQrApplied(e.target.checked)}
                    className="w-4 h-4 accent-[#004AAD] rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Área de Upload do Mockup Montado */}
          <div className="space-y-2 pt-2 border-t border-[#D6D3CC]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#272727] block">
                Arquivo do Mockup Pronto (Arte Final Sublima):
              </span>
              {session.mockupUrl && (
                <span className="text-[10px] text-[#6B6A64]">
                  Subir novo arquivo substituirá a versão anterior
                </span>
              )}
            </div>

            {/* Zona de Drop & Upload */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-5 border-2 border-dashed rounded-[8px] text-center transition-colors ${
                dragActive
                  ? "border-[#004AAD] bg-[#EEEDE8]"
                  : "border-[#D6D3CC] bg-[#EEEDE8]/50 hover:bg-[#EEEDE8]"
              }`}
            >
              {isProcessingFile ? (
                <div className="py-2 flex flex-col items-center gap-1.5 text-[#004AAD]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-xs">Otimizando e preparando imagem da arte...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-[#6B6A64] mx-auto mb-1.5" />
                  <p className="text-xs text-[#272727] font-medium">
                    Arraste o arquivo do mockup montado aqui ou clique para selecionar
                  </p>
                  <p className="text-[10px] text-[#9B998F] mt-0.5">
                    Formatos: JPG, PNG, WEBP (exportado da matriz de gravação/estamparia)
                  </p>
                  <input
                    type="file"
                    id="mockup-file-input"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="mockup-file-input"
                    className="inline-block mt-2.5 px-3 py-1.5 rounded-[4px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#272727] cursor-pointer hover:bg-[#E4E2DD] transition-colors"
                  >
                    Procurar no computador
                  </label>
                </>
              )}
            </div>

            {/* Modelos de Matriz Rápidos para Teste */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-[#6B6A64] block">
                Ou selecione uma matriz de demonstração:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                {PRESET_MOCKUPS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedMockupUrl(preset.url)}
                    className={`p-1.5 rounded-[6px] border text-left flex flex-col gap-1 transition-all ${
                      selectedMockupUrl === preset.url
                        ? "bg-[#EEEDE8] border-[#004AAD] ring-1 ring-[#004AAD]"
                        : "bg-[#EEEDE8] border-[#D6D3CC] hover:border-[#6B6A64]"
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-12 object-cover rounded-[3px] bg-white border border-[#D6D3CC]"
                    />
                    <span className="text-[9px] text-[#272727] font-medium truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prévia Ativa do Mockup Anexado */}
            {selectedMockupUrl && (
              <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center gap-3">
                <img
                  src={selectedMockupUrl}
                  alt="Mockup Selecionado"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-[4px] object-cover bg-white border border-[#D6D3CC] shrink-0"
                />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#272727]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F7A4F]" />
                    <span>Mockup pronto para envio de aprovação</span>
                  </div>
                  <span className="text-[10px] text-[#6B6A64] block">
                    Ao confirmar, o status será alterado para <strong>aguardando_aprovacao</strong> e ficará visível na Área do Cliente.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer com Ações */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D6D3CC]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-[6px] bg-[#EEEDE8] text-[#6B6A64] text-xs hover:text-[#272727]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!selectedMockupUrl || isProcessingFile}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar para Aprovação do Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

