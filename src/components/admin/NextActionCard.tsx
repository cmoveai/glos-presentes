import React from "react";
import { MessageSquare, RefreshCw, Ticket, ArrowRight, Sparkles } from "lucide-react";
import { Card } from "./Card";

export interface NextActionCardProps {
  diagnosis: string;
  category: "carrinho" | "estoque" | "relacionamento" | "precificacao";
  actionLabel: string;
  actionType: "whatsapp" | "estoque" | "cupom" | "cliente";
  onAction?: () => void;
  className?: string;
}

/**
 * 4) Próximas Ações Recomendadas (Next Best Action) — glos.
 * Cartões curtos gerados pela IA com frase de diagnóstico + 1 botão de ação primário em cobalt (#004AAD).
 */
export const NextActionCard: React.FC<NextActionCardProps> = ({
  diagnosis,
  category,
  actionLabel,
  actionType,
  onAction,
  className = "",
}) => {
  const getCategoryIcon = () => {
    switch (actionType) {
      case "whatsapp":
        return <MessageSquare className="w-3.5 h-3.5 text-[#004AAD]" />;
      case "estoque":
        return <RefreshCw className="w-3.5 h-3.5 text-[#004AAD]" />;
      case "cupom":
      case "cliente":
        return <Ticket className="w-3.5 h-3.5 text-[#004AAD]" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#004AAD]" />;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case "carrinho":
        return "Recuperação de Vendas";
      case "estoque":
        return "Alerta de Estoque";
      case "relacionamento":
        return "Reativação Afetiva";
      case "precificacao":
        return "Margem & Precificação";
      default:
        return "Ação Recomendada";
    }
  };

  return (
    <Card padding="md" className={`flex flex-col justify-between ${className}`}>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] text-[#6B6A64]">
          <span className="p-1 rounded-[4px] bg-[rgba(0,74,173,0.08)]">
            {getCategoryIcon()}
          </span>
          <span className="uppercase tracking-wider text-[10px] text-[#9B998F]">
            {getCategoryLabel()}
          </span>
        </div>

        <p className="text-xs sm:text-sm font-normal text-[#272727] leading-relaxed">
          {diagnosis}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-[#D6D3CC]">
        <button
          onClick={onAction}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </Card>
  );
};
