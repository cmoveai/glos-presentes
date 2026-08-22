import React, { useState } from "react";
import { Sparkles, X, Send, Bot, ArrowRight } from "lucide-react";
import { BRAND_CONFIG } from "../../config/brand";

interface CopilotFabProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

/**
 * Copiloto IA (FAB) do Painel do Lojista glos.
 * Botão flutuante no canto inferior direito que abre o painel lateral de assistência de varejo.
 */
export const CopilotFab: React.FC<CopilotFabProps> = ({
  isOpen: controlledIsOpen,
  onOpenChange,
  className = "",
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");

  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(open);
    }
    if (onOpenChange) {
      onOpenChange(open);
    }
  };

  const suggestionPrompts = [
    "Resumir vendas e carrinhos abandonados de hoje",
    "Sugerir kit de presentes para o Dia das Mães",
    "Verificar margem líquida dos produtos mais vendidos",
    "Criar cupom de desconto com margem de segurança",
  ];

  return (
    <>
      {/* Botão Flutuante (FAB) */}
      <div className={`fixed bottom-6 right-6 z-40 ${className}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#004AAD] text-white text-xs sm:text-sm font-medium hover:bg-[#003884] transition-all duration-200 border border-[#004AAD] select-none group shadow-sm"
          title="Abrir Copiloto IA"
          aria-label="Abrir Copiloto IA"
        >
          <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline">Copiloto IA</span>
        </button>
      </div>

      {/* Painel Lateral (Slide-over) do Copiloto */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop suave */}
          <div
            className="absolute inset-0 bg-black/20 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#F4F3EF] border-l border-[#D6D3CC] flex flex-col justify-between text-[#272727]">
              {/* Header do Copiloto */}
              <div className="h-16 px-6 bg-[#E4E2DD] border-b border-[#D6D3CC] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-[6px] bg-[rgba(0,74,173,0.08)] text-[#004AAD]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[#272727]">
                      Copiloto IA · {BRAND_CONFIG.shortName}
                    </h3>
                    <p className="text-[11px] text-[#6B6A64]">
                      Assistente de gestão, precificação e insights
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
                  aria-label="Fechar painel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Conteúdo / Placeholder do Copiloto */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="p-4 rounded-[8px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs text-[#6B6A64] leading-relaxed">
                  <p className="text-[#272727] font-medium mb-1">
                    Olá! Sou o assistente do {BRAND_CONFIG.adminLabel}.
                  </p>
                  Estou pronto para ajudar você a analisar pedidos de presentes, simular markup, criar kits criativos e gerar mensagens afetivas de pós-venda.
                </div>

                {/* Sugestões de Ação Rápida */}
                <div>
                  <h4 className="text-[11px] font-medium uppercase tracking-wider text-[#9B998F] mb-2.5">
                    Sugestões rápidas
                  </h4>
                  <div className="space-y-1.5">
                    {suggestionPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInputQuery(prompt)}
                        className="w-full text-left p-2.5 rounded-[6px] bg-[#F4F3EF] hover:bg-[#EEEDE8] border border-[#D6D3CC] text-xs text-[#272727] flex items-center justify-between group transition-colors"
                      >
                        <span className="truncate mr-2">{prompt}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#9B998F] group-hover:text-[#004AAD] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input Box do Copiloto */}
              <div className="p-4 bg-[#E4E2DD] border-t border-[#D6D3CC] shrink-0">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!inputQuery.trim()) return;
                    setInputQuery("");
                  }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Pergunte ao Copiloto IA..."
                    className="w-full pl-3.5 pr-10 py-2.5 text-xs bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD]"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim()}
                    className="absolute right-1.5 p-1.5 rounded-[4px] bg-[#004AAD] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#003884] transition-colors"
                    title="Enviar"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
