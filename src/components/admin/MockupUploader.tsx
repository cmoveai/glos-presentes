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
} from "lucide-react";
import { Card } from "./Card";
import { ArtApprovalSession } from "../../types";

interface MockupUploaderProps {
  session: ArtApprovalSession;
  onUploadMockupAndSend: (mockupUrl: string) => void;
  onClose: () => void;
}

const PRESET_MOCKUPS = [
  {
    name: "Caneca Branca Clássica (Prova Visual Sublima)",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&q=80",
  },
  {
    name: "Quadro A4 Moldura Preta (Layout Spotify)",
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
];

export const MockupUploader: React.FC<MockupUploaderProps> = ({
  session,
  onUploadMockupAndSend,
  onClose,
}) => {
  const [selectedMockupUrl, setSelectedMockupUrl] = useState<string>(
    session.mockupUrl || PRESET_MOCKUPS[0].url
  );
  const [isCustomUpload, setIsCustomUpload] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedMockupUrl(uploadEvent.target.result as string);
          setIsCustomUpload(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setSelectedMockupUrl(uploadEvent.target.result as string);
          setIsCustomUpload(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMockupUrl) return;
    onUploadMockupAndSend(selectedMockupUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="p-3.5 bg-[#EEEDE8] border-b border-[#D6D3CC] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#004AAD]" />
            <div>
              <h2 className="text-xs font-medium text-[#272727]">
                Montar & Subir Mockup da Arte • Pedido {session.orderNumber}
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
          {/* Lembrete de Regra de Ouro */}
          <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px] text-[#6B6A64] space-y-1">
            <div className="flex items-center gap-1.5 font-medium text-[#272727]">
              <Sparkles className="w-3.5 h-3.5 text-[#004AAD]" />
              <span>Regra do Ateliê Glos:</span>
            </div>
            <p>
              A Cris monta a prova visual com cuidado no Sublima/Design. Ao clicar em "Salvar & Enviar", a <strong>IA Glos envia automaticamente</strong> a imagem do mockup para o cliente no WhatsApp com mensagem afetiva de aprovação.
            </p>
          </div>

          {/* Arquivos que o cliente enviou para referência da Cris */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-[#272727] block">
              Materiais Enviados pelo Cliente:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {session.customerUploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2.5 p-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]"
                >
                  <img
                    src={file.url}
                    alt={file.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-[4px] object-cover bg-white border border-[#D6D3CC] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-medium text-[#272727] truncate block">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[#9B998F] block tabular-nums">
                      {file.size || "Enviado no WhatsApp"}
                    </span>
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-[#004AAD] hover:underline"
                  >
                    Ver original
                  </a>
                </div>
              ))}
            </div>

            {session.customerTextDeclaration && (
              <div className="p-2.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px]">
                <span className="text-[10px] uppercase text-[#9B998F] block mb-0.5">
                  Dedicatória Solicitada:
                </span>
                <span className="text-[#272727] italic">
                  "{session.customerTextDeclaration}"
                </span>
              </div>
            )}

            {session.rejectionReason && (
              <div className="p-2.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px]">
                <span className="text-[10px] font-medium text-[#004AAD] block mb-0.5">
                  ● Ajuste solicitado pelo cliente capturado pela IA:
                </span>
                <span className="text-[#272727]">
                  "{session.rejectionReason}"
                </span>
              </div>
            )}
          </div>

          {/* Área de Upload do Mockup Montado */}
          <div className="space-y-2 pt-2 border-t border-[#D6D3CC]">
            <span className="text-[11px] font-medium text-[#272727] block">
              Subir Prova Visual / Mockup Finalizado:
            </span>

            {/* Zona de Drop */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`p-6 border-2 border-dashed rounded-[8px] text-center transition-colors ${
                dragActive
                  ? "border-[#004AAD] bg-[#EEEDE8]"
                  : "border-[#D6D3CC] bg-[#EEEDE8]/50 hover:bg-[#EEEDE8]"
              }`}
            >
              <Upload className="w-6 h-6 text-[#6B6A64] mx-auto mb-2" />
              <p className="text-xs text-[#272727] font-medium">
                Arraste o arquivo do mockup montado aqui ou clique para selecionar
              </p>
              <p className="text-[10px] text-[#9B998F] mt-1">
                Formatos aceitos: JPG, PNG, WEBP (exportado em alta resolução)
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
                className="inline-block mt-3 px-3 py-1.5 rounded-[4px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#272727] cursor-pointer hover:bg-[#E4E2DD]"
              >
                Procurar no computador
              </label>
            </div>

            {/* Prévia de Modelos Rápidos para Demonstração */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-[#6B6A64] block">
                Ou selecione um modelo de matriz pronto para teste:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PRESET_MOCKUPS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedMockupUrl(preset.url);
                      setIsCustomUpload(false);
                    }}
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
                      className="w-full h-16 object-cover rounded-[3px] bg-white border border-[#D6D3CC]"
                    />
                    <span className="text-[9px] text-[#272727] font-medium truncate">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prévia Ativa do Mockup Selecionado */}
            {selectedMockupUrl && (
              <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center gap-3">
                <img
                  src={selectedMockupUrl}
                  alt="Mockup Selecionado"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-[4px] object-cover bg-white border border-[#D6D3CC]"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-[#272727] block">
                    Mockup pronto para disparo no WhatsApp
                  </span>
                  <span className="text-[10px] text-[#6B6A64] block">
                    A IA Glos anexará esta imagem com a mensagem de validação.
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
              disabled={!selectedMockupUrl}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Salvar Mockup & Enviar ao Cliente via IA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
