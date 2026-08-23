import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Music,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Download,
  ExternalLink,
  Plus,
  Sparkles,
  Paperclip,
  Check,
} from "lucide-react";
import { CustomerFile, Order } from "../../types";
import { uploadCustomerFileOriginal } from "../../lib/firebase";
import { enviarArquivosClientePedido } from "../../services/api";

interface CustomerFileUploadCardProps {
  order: Order;
  clienteId?: string;
  onFilesUploaded: (updatedFiles: CustomerFile[], newStatus: string) => void;
}

interface QueuedFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  errorMsg?: string;
  uploadedCustomerFile?: CustomerFile;
}

export const CustomerFileUploadCard: React.FC<CustomerFileUploadCardProps> = ({
  order,
  clienteId,
  onFilesUploaded,
}) => {
  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [comentario, setComentario] = useState<string>(order.comentarioCliente || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [showAddMore, setShowAddMore] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const existingFiles = order.arquivosCliente || [];
  const hasFiles = existingFiles.length > 0;
  const isAwaitingFiles = order.statusPedido === "aguardando_arquivo" || order.currentStep === "aguardando_arquivo";

  // Identifica se há produtos do tipo Sublima Play (música/áudio)
  const isMusicProduct = order.items?.some(
    (it) =>
      it.name?.toLowerCase().includes("play") ||
      it.name?.toLowerCase().includes("música") ||
      it.name?.toLowerCase().includes("spotify") ||
      it.name?.toLowerCase().includes("som") ||
      it.personalization?.qrLink
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    addFilesToQueue(Array.from(e.target.files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const addFilesToQueue = (files: File[]) => {
    setGlobalError(null);
    const newItems: QueuedFile[] = files.map((file) => {
      let previewUrl = "";
      if (file.type.startsWith("image/")) {
        previewUrl = URL.createObjectURL(file);
      }
      return {
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        progress: 0,
        status: "pending",
      };
    });

    setQueuedFiles((prev) => [...prev, ...newItems]);
  };

  const removeQueuedFile = (id: string) => {
    setQueuedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleSubmit = async () => {
    if (queuedFiles.length === 0) {
      setGlobalError("Por favor, selecione ao menos um arquivo para enviar.");
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);

    const uploadedResults: CustomerFile[] = [];

    try {
      for (let i = 0; i < queuedFiles.length; i++) {
        const item = queuedFiles[i];

        // Atualiza status do item atual para uploading
        setQueuedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 5 } : f))
        );

        try {
          // UPLOAD DIRETO PARA FIREBASE STORAGE PRESERVANDO ARQUIVO ORIGINAL SEM COMPRESSÃO
          const uploadedFile = await uploadCustomerFileOriginal(
            order.id,
            "geral",
            item.file,
            (progress) => {
              setQueuedFiles((prev) =>
                prev.map((f) => (f.id === item.id ? { ...f, progress } : f))
              );
            }
          );

          uploadedResults.push(uploadedFile);

          setQueuedFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: "done", progress: 100, uploadedCustomerFile: uploadedFile }
                : f
            )
          );
        } catch (uploadErr) {
          console.error("Erro no upload do arquivo:", uploadErr);
          setQueuedFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: "error", errorMsg: "Falha ao enviar arquivo. Tente novamente." }
                : f
            )
          );
          throw new Error(`Falha no upload de "${item.file.name}"`);
        }
      }

      // Salva no backend / Firestore e atualiza status para 'arquivo_recebido'
      const response = await enviarArquivosClientePedido(
        order.id,
        uploadedResults,
        comentario,
        clienteId || order.clienteId
      );

      const allFiles = [...existingFiles, ...uploadedResults];
      onFilesUploaded(allFiles, "arquivo_recebido");
      setQueuedFiles([]);
      setShowAddMore(false);
    } catch (err: any) {
      setGlobalError(err.message || "Ocorreu um erro ao enviar os arquivos. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden">
      {/* CABEÇALHO DO CARD */}
      <div className="p-4 sm:p-5 border-b border-[#D6D3CC] bg-[#F4F3EF] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[6px] bg-[#004AAD]/10 text-[#004AAD] flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-medium text-[#272727]">
              {hasFiles
                ? "Arquivos Enviados para Produção"
                : "Envio de Fotos e Áudios em Alta Resolução"}
            </h3>
            <p className="text-[11px] text-[#6B6A64]">
              {hasFiles
                ? "Preservamos seus arquivos em qualidade original para a máxima nitidez na impressão."
                : "Envie seus arquivos originais direto por aqui sem compressão."}
            </p>
          </div>
        </div>

        {hasFiles && !showAddMore && (
          <button
            type="button"
            onClick={() => setShowAddMore(true)}
            className="text-[11px] font-medium text-[#004AAD] hover:underline flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC]"
          >
            <Plus className="w-3 h-3" />
            <span>Enviar mais arquivos</span>
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {/* LISTA DE ARQUIVOS JÁ ENVIADOS (SE HOUVER) */}
        {hasFiles && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#272727]">
                Arquivos recebidos pelo ateliê ({existingFiles.length})
              </span>
              <span className="text-[10px] text-[#0F7A4F] flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Qualidade Original Preservada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {existingFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]"
                >
                  {file.type === "imagem" ? (
                    <div className="w-12 h-12 rounded-[4px] overflow-hidden bg-white border border-[#D6D3CC] shrink-0">
                      <img
                        src={file.url}
                        alt={file.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : file.type === "audio" ? (
                    <div className="w-12 h-12 rounded-[4px] bg-[#E4E2DD] flex items-center justify-center text-[#004AAD] shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                  ) : file.type === "video" ? (
                    <div className="w-12 h-12 rounded-[4px] bg-[#E4E2DD] flex items-center justify-center text-[#004AAD] shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-[4px] bg-[#E4E2DD] flex items-center justify-center text-[#6B6A64] shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-xs font-medium text-[#272727] truncate block">
                      {file.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-[#6B6A64] [font-variant-numeric:tabular-nums]">
                      <span>{file.size || "Original"}</span>
                      {file.type && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{file.type}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-[#6B6A64] hover:text-[#004AAD] hover:bg-[#E4E2DD] rounded-[4px] transition-colors shrink-0"
                    title="Ver arquivo original"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>

            {order.comentarioCliente && (
              <div className="p-3 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] space-y-1">
                <span className="text-[10px] text-[#6B6A64] block font-medium">
                  Sua observação / dedicatória para a Cris:
                </span>
                <p className="italic">"{order.comentarioCliente}"</p>
              </div>
            )}
          </div>
        )}

        {/* ÁREA DE UPLOAD (EXIBIDA SE AINDA NÃO HOUVER ARQUIVOS OU SE CLICAR EM ADICIONAR MAIS) */}
        {(!hasFiles || showAddMore) && (
          <div className="space-y-4 pt-2">
            {/* Aviso informativo de Qualidade Original */}
            <div className="p-3 bg-[#004AAD]/5 border border-[#004AAD]/15 rounded-[6px] text-xs text-[#272727] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#004AAD] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-medium text-[#004AAD] block">
                  Preservação de Resolução Original
                </span>
                <p className="text-[11px] text-[#6B6A64] leading-relaxed">
                  Diferente do WhatsApp (que reduz o tamanho das fotos para caber na conversa),
                  aqui seu arquivo é enviado exatamente como na sua câmera ou galeria, garantindo
                  nitidez perfeita na gravação e estamparia do presente.
                </p>
              </div>
            </div>

            {/* DROPZONE */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[8px] p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-[#004AAD] bg-[#004AAD]/5"
                  : "border-[#D6D3CC] hover:border-[#004AAD]/50 bg-[#EEEDE8]/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,audio/*,.heic,.heif,.mp3,.m4a,.wav,.ogg"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-2">
                <div className="w-10 h-10 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-[#004AAD] flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" strokeWidth={1.5} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium text-[#272727]">
                    Clique para selecionar ou arraste seus arquivos aqui
                  </p>
                  <p className="text-[11px] text-[#6B6A64]">
                    Fotos (JPG, PNG, HEIC), Áudios (MP3, M4A, WAV) ou Vídeos (MP4, MOV)
                  </p>
                </div>
              </div>
            </div>

            {/* ARQUIVOS NA FILA DE ENVIO */}
            {queuedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#272727]">
                    Arquivos selecionados ({queuedFiles.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setQueuedFiles([])}
                    className="text-[10px] text-[#9B2C2C] hover:underline"
                    disabled={isSubmitting}
                  >
                    Limpar todos
                  </button>
                </div>

                <div className="space-y-2">
                  {queuedFiles.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.previewUrl ? (
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="w-9 h-9 rounded-[4px] object-cover border border-[#D6D3CC] shrink-0"
                            />
                          ) : item.file.type.startsWith("audio/") ? (
                            <div className="w-9 h-9 rounded-[4px] bg-[#E4E2DD] flex items-center justify-center text-[#004AAD] shrink-0">
                              <Music className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-[4px] bg-[#E4E2DD] flex items-center justify-center text-[#6B6A64] shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <span className="text-xs font-medium text-[#272727] truncate block">
                              {item.file.name}
                            </span>
                            <span className="text-[10px] text-[#6B6A64] [font-variant-numeric:tabular-nums]">
                              {formatSize(item.file.size)}
                            </span>
                          </div>
                        </div>

                        {item.status === "pending" && !isSubmitting && (
                          <button
                            type="button"
                            onClick={() => removeQueuedFile(item.id)}
                            className="p-1 text-[#6B6A64] hover:text-[#9B2C2C] rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}

                        {item.status === "uploading" && (
                          <div className="flex items-center gap-1 text-[11px] text-[#004AAD] font-medium [font-variant-numeric:tabular-nums]">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{item.progress}%</span>
                          </div>
                        )}

                        {item.status === "done" && (
                          <div className="flex items-center gap-1 text-[11px] text-[#0F7A4F] font-medium">
                            <Check className="w-3.5 h-3.5" />
                            <span>Pronto</span>
                          </div>
                        )}

                        {item.status === "error" && (
                          <div className="flex items-center gap-1 text-[11px] text-[#9B2C2C] font-medium">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Erro</span>
                          </div>
                        )}
                      </div>

                      {/* Barra de Progresso */}
                      {item.status === "uploading" && (
                        <div className="w-full h-1 bg-[#D6D3CC] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#004AAD] transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CAMPO DE DEDICATÓRIA / FRASE / OBSERVAÇÃO */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#272727]">
                Frase, nomes, datas ou observação para a Cris (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Ex: 'Colocar os nomes Ana & Lucas na parte inferior', 'Data: 12/06/2023'..."
                rows={2}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] placeholder:text-[#9B998F] focus:outline-none focus:border-[#004AAD] resize-none"
              />
            </div>

            {/* MENSAGEM DE ERRO GLOBAL */}
            {globalError && (
              <div className="p-3 rounded-[6px] bg-[#9B2C2C]/10 border border-[#9B2C2C]/20 text-xs text-[#9B2C2C] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{globalError}</span>
              </div>
            )}

            {/* BOTÃO DE CONFIRMAR ENVIO */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {showAddMore && hasFiles && (
                <button
                  type="button"
                  onClick={() => {
                    setShowAddMore(false);
                    setQueuedFiles([]);
                  }}
                  disabled={isSubmitting}
                  className="px-3.5 py-2 bg-[#F4F3EF] border border-[#D6D3CC] text-[#6B6A64] rounded-[6px] text-xs font-medium hover:text-[#272727] transition-colors"
                >
                  Cancelar
                </button>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || queuedFiles.length === 0}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-medium text-white transition-colors ${
                  isSubmitting || queuedFiles.length === 0
                    ? "bg-[#004AAD]/50 cursor-not-allowed"
                    : "bg-[#004AAD] hover:bg-[#003c8c]"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enviando em Alta Resolução...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Enviar Arquivos para o Ateliê</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
