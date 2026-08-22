import React from "react";
import { Sparkles, X, ArrowUpRight } from "lucide-react";

interface InsightBannerProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Banner de insight inteligente do Painel glos.
 * Cartão flat editorial com destaque cobalt discreto.
 */
export const InsightBanner: React.FC<InsightBannerProps> = ({
  title = "Insight de Varejo Afetivo",
  description = "Aproximadamente 42% dos pedidos deste mês foram destinados para presente com cartão personalizado. Aumente as opções de personalização de embalagem.",
  actionText = "Ver detalhes",
  onAction,
  onDismiss,
  className = "",
}) => {
  return (
    <div className={`bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-4 sm:p-5 text-[#272727] flex items-start gap-3.5 ${className}`}>
      <div className="p-1.5 rounded-[6px] bg-[rgba(0,74,173,0.08)] text-[#004AAD] shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-medium text-[#272727]">{title}</h4>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-[#9B998F] hover:text-[#272727] p-0.5 rounded transition-colors"
              title="Dispensar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs sm:text-sm font-normal text-[#6B6A64] mt-1 leading-relaxed">
          {description}
        </p>

        {actionText && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#004AAD] hover:underline mt-2.5"
          >
            <span>{actionText}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
