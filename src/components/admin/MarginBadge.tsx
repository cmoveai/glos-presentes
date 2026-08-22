import React from "react";
import { AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";

export interface MarginBadgeProps {
  marginPercent: number;
  marginReal?: number;
  targetMargin?: number;
}

export const MarginBadge: React.FC<MarginBadgeProps> = ({
  marginPercent,
  marginReal,
  targetMargin = 25,
}) => {
  const isHealthy = marginPercent >= targetMargin;
  const isWarning = marginPercent > 0 && marginPercent < targetMargin;
  const isNegative = marginPercent <= 0;

  if (isNegative) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
        <AlertTriangle className="w-3 h-3 text-[#B91C1C]" />
        <span>Prejuízo ({marginPercent.toFixed(1)}%)</span>
      </span>
    );
  }

  if (isWarning) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
        <AlertTriangle className="w-3 h-3 text-[#B45309]" />
        <span>Abaixo da meta ({marginPercent.toFixed(1)}%)</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]">
      <CheckCircle className="w-3 h-3 text-[#047857]" />
      <span>
        {marginPercent.toFixed(1)}% {marginReal !== undefined && `(R$ ${marginReal.toFixed(2)})`}
      </span>
    </span>
  );
};
