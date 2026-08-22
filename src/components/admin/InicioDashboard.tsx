import React, { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "./Card";
import { BriefingHero } from "./BriefingHero";
import { KpiCard } from "./KpiCard";
import { BestSellerRow } from "./BestSellerRow";
import { NextActionCard } from "./NextActionCard";
import { RecentOrdersPreview } from "./RecentOrdersPreview";
import {
  getBriefing,
  BriefingData,
} from "../../services/briefingService";

interface InicioDashboardProps {
  onNavigateSection?: (sectionId: string, subId?: string) => void;
  onOpenCopilot?: () => void;
}

/**
 * TELA INÍCIO — Briefing Executivo de IA · Painel Glos Presentes
 * Estrutura 100% full-bleed e editorial com 5 blocos sequenciais:
 * 1) Hero de Briefing IA
 * 2) Linha de KPIs (4 cartões flat)
 * 3) Mais vendidos (ranking Top 5 / Top 10)
 * 4) Próximas ações recomendadas (Next Best Action)
 * 5) Pedidos recentes (prévia)
 */
export const InicioDashboard: React.FC<InicioDashboardProps> = ({
  onNavigateSection,
  onOpenCopilot,
}) => {
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [topRankingLimit, setTopRankingLimit] = useState<5 | 10>(5);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getBriefing().then((data) => {
      if (isMounted) {
        setBriefing(data);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading || !briefing) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px]" />
          ))}
        </div>
      </div>
    );
  }

  const displayedProducts = briefing.bestSellers.slice(0, topRankingLimit);

  return (
    <div className="space-y-8 w-full">
      {/* 1) HERO DE BRIEFING EXECUTIVO DE IA */}
      <section aria-label="Briefing Executivo de IA">
        <BriefingHero
          updatedAt={briefing.updatedAt}
          summary={briefing.summaryParagraph}
          anchorMetric={briefing.anchorMetric}
          onOpenCopilot={onOpenCopilot}
        />
      </section>

      {/* 2) LINHA DE KPIS (4 CARTÕES FLAT) */}
      <section aria-label="Indicadores Principais">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {briefing.kpis.map((kpi) => (
            <KpiCard
              key={kpi.id}
              label={kpi.label}
              value={kpi.value}
              variationPercent={kpi.variationPercent}
              isPositive={kpi.isPositive}
              periodLabel={kpi.periodLabel}
              sparkline={kpi.sparkline}
            />
          ))}
        </div>
      </section>

      {/* 3) MAIS VENDIDOS (RANKING) */}
      <section aria-label="Produtos Mais Vendidos">
        <Card padding="md" className="w-full">
          {/* Cabeçalho do Bloco */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D6D3CC]">
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#004AAD] block">
                Curva de vendas · últimos 30 dias
              </span>
              <h3 className="text-base font-medium text-[#272727]">
                Mais vendidos
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Alternador Segmented Top 5 / Top 10 */}
              <div className="flex items-center p-0.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs">
                <button
                  onClick={() => setTopRankingLimit(5)}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors ${
                    topRankingLimit === 5
                      ? "bg-[#004AAD] text-white"
                      : "text-[#6B6A64] hover:text-[#272727]"
                  }`}
                >
                  Top 5
                </button>
                <button
                  onClick={() => setTopRankingLimit(10)}
                  className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors ${
                    topRankingLimit === 10
                      ? "bg-[#004AAD] text-white"
                      : "text-[#6B6A64] hover:text-[#272727]"
                  }`}
                >
                  Top 10
                </button>
              </div>

              {/* Link Ver Catálogo */}
              <button
                onClick={() => onNavigateSection && onNavigateSection("produtos", "listar")}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#004AAD] hover:underline"
              >
                <span>Ver catálogo</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Grid de Produtos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mt-4">
            {displayedProducts.map((prod) => (
              <BestSellerRow
                key={prod.id}
                rank={prod.rank}
                id={prod.id}
                name={prod.name}
                category={prod.category}
                price={prod.price}
                salesCount={prod.salesCount}
                revenue={prod.revenue}
                imageUrl={prod.imageUrl}
                sparkline={prod.sparkline}
                onClick={() =>
                  onNavigateSection && onNavigateSection("produtos", "listar")
                }
              />
            ))}
          </div>
        </Card>
      </section>

      {/* 4) PRÓXIMAS AÇÕES RECOMENDADAS (NEXT BEST ACTION) */}
      <section aria-label="Próximas Ações Recomendadas">
        <div className="mb-3">
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#004AAD] block">
            Prioridades do dia
          </span>
          <h3 className="text-base font-medium text-[#272727]">
            Próximas ações recomendadas
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {briefing.nextActions.map((action) => (
            <NextActionCard
              key={action.id}
              diagnosis={action.diagnosis}
              category={action.category}
              actionLabel={action.actionLabel}
              actionType={action.actionType}
              onAction={() => {
                if (action.actionType === "whatsapp" && onNavigateSection) {
                  onNavigateSection("carrinhos-abandonados");
                } else if (action.actionType === "estoque" && onNavigateSection) {
                  onNavigateSection("produtos", "listar");
                } else if (action.actionType === "cupom" && onNavigateSection) {
                  onNavigateSection("cupons");
                }
              }}
            />
          ))}
        </div>
      </section>

      {/* 5) PEDIDOS RECENTES (PRÉVIA) */}
      <section aria-label="Pedidos Recentes">
        <RecentOrdersPreview
          orders={briefing.recentOrders}
          onViewAll={() => onNavigateSection && onNavigateSection("vendas", "listar")}
          onSelectOrder={(orderId) => {
            if (onNavigateSection) {
              onNavigateSection("vendas", "listar");
            }
          }}
        />
      </section>
    </div>
  );
};
