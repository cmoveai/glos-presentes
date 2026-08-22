import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Card } from "./Card";

interface BriefingHeroProps {
  updatedAt: string;
  summary: string;
  anchorMetric: {
    label: string;
    value: string;
    sublabel: string;
  };
  onOpenCopilot?: () => void;
  className?: string;
}

/**
 * 1) Hero de Briefing Executivo de IA — glos.
 * Cartão editorial largo (full-bleed) com resumo em linguagem natural afetiva, número-âncora e link discreto para o Copiloto.
 */
export const BriefingHero: React.FC<BriefingHeroProps> = ({
  updatedAt,
  summary,
  anchorMetric,
  onOpenCopilot,
  className = "",
}) => {
  return (
    <Card padding="lg" className={`w-full ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
        {/* Lado Esquerdo: Chip + Texto Editorial de IA */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] bg-[rgba(0,74,173,0.08)] text-[#004AAD] text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004AAD] animate-pulse" />
              {updatedAt}
            </span>
            <span className="text-xs text-[#9B998F]">
              Síntese Executiva · IA
            </span>
          </div>

          <p className="text-sm sm:text-base font-normal text-[#272727] leading-relaxed max-w-3xl">
            {summary}
          </p>

          <div>
            <button
              onClick={onOpenCopilot}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#004AAD] hover:underline pt-1 group"
            >
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span>Abrir Copiloto IA para detalhar</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Lado Direito: Número-Âncora grande em Montserrat 500 tabular */}
        <div className="lg:border-l lg:border-[#D6D3CC] lg:pl-8 flex flex-col justify-center shrink-0 min-w-[200px]">
          <span className="text-xs font-normal text-[#6B6A64]">
            {anchorMetric.label}
          </span>
          <div className="text-2xl sm:text-3xl font-medium text-[#272727] tabular-nums tracking-tight mt-1">
            {anchorMetric.value}
          </div>
          <span className="text-xs font-normal text-[#0F7A4F] tabular-nums mt-1">
            {anchorMetric.sublabel}
          </span>
        </div>
      </div>
    </Card>
  );
};
