import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export interface KpiCardProps {
  id?: string;
  label: string;
  value: string;
  variation?: string;
  isPositive?: boolean;
  subtext?: string;
  icon?: React.ReactNode;
  sparkline?: number[];
}

export const KpiCard: React.FC<KpiCardProps> = ({
  id,
  label,
  value,
  variation,
  isPositive = true,
  subtext,
  icon,
  sparkline,
}) => {
  return (
    <div
      id={id || `kpi-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-4 shadow-xs flex flex-col justify-between hover:border-[#CBD0D8] transition-all"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8F98]">
          {label}
        </span>
        {icon && <div className="text-[#8A8F98]">{icon}</div>}
      </div>

      <div className="mt-2 space-y-1">
        <div className="text-2xl font-bold text-[#1A1F27] tracking-tight tabular-nums font-sans">
          {value}
        </div>

        {(variation || subtext) && (
          <div className="flex items-center gap-2 pt-0.5">
            {variation && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isPositive
                    ? "bg-[#D1FAE5] text-[#059669] border border-[#A7F3D0]"
                    : "bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3 text-[#059669]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#B91C1C]" />
                )}
                {variation}
              </span>
            )}
            {subtext && <span className="text-xs text-[#5B6270]">{subtext}</span>}
          </div>
        )}
      </div>

      {sparkline && sparkline.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-[#ECEEF1] flex items-center justify-between text-[10px] text-[#8A8F98]">
          <span>Tendência 7d</span>
          <svg className="w-16 h-4" viewBox="0 0 64 16" fill="none">
            <path
              d={isPositive ? "M 2 13 Q 18 14, 32 8 T 58 3 L 62 4" : "M 2 3 Q 18 4, 32 10 T 58 14 L 62 13"}
              stroke={isPositive ? "#059669" : "#B91C1C"}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      )}
    </div>
  );
};
