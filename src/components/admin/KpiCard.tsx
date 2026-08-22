import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Card } from "./Card";
import { KpiSparkline } from "./KpiSparkline";

export interface KpiCardProps {
  id?: string;
  label: string;
  value: string;
  variationPercent?: number;
  isPositive?: boolean;
  periodLabel?: string;
  sparkline?: number[];
  className?: string;
}

/**
 * 2) Cartão de KPI Flat — glos.
 * Superfície #F4F3EF, borda #D6D3CC, raio 8px, flat (sem sombra).
 * Rótulo secundário, valor em Montserrat 500 tabular, variação discreta (#0F7A4F / #9B2C2C) e sparkline cobalt.
 */
export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  label,
  value,
  variationPercent,
  isPositive = true,
  periodLabel = "vs. anterior",
  sparkline,
  className = "",
}) => {
  return (
    <Card
      id={id || `kpi-card-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
      padding="md"
      className={`flex flex-col justify-between ${className}`}
    >
      <div>
        <span className="text-xs font-normal text-[#6B6A64]">
          {label}
        </span>
        <div className="text-xl sm:text-2xl font-medium text-[#272727] tabular-nums tracking-tight mt-1.5">
          {value}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#D6D3CC] flex items-center justify-between gap-2">
        {variationPercent !== undefined ? (
          <div className="flex items-center gap-1 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 font-normal tabular-nums ${
                isPositive ? "text-[#0F7A4F]" : "text-[#9B2C2C]"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {isPositive ? "+" : ""}
              {Math.abs(variationPercent).toFixed(1)}%
            </span>
            <span className="text-[11px] text-[#9B998F] truncate">
              {periodLabel}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-[#9B998F]">{periodLabel}</span>
        )}

        {sparkline && sparkline.length > 1 && (
          <KpiSparkline data={sparkline} width={56} height={18} />
        )}
      </div>
    </Card>
  );
};
