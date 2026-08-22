import React from "react";
import { Sparkles, ArrowRight, Lightbulb } from "lucide-react";

export interface InsightBannerProps {
  icon?: React.ReactNode;
  text?: string;
  insight?: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "emerald" | "amber" | "blue" | "stone" | "growth" | "alert" | "neutral";
  type?: "growth" | "alert" | "neutral";
  chipText?: string;
  badge?: string;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({
  icon,
  text,
  insight,
  title,
  actionLabel,
  onAction,
  variant,
  type,
  chipText,
  badge,
}) => {
  const content = insight || text || "";
  const displayBadge = badge || chipText || "IA Insight";
  const finalType = type || (variant === "alert" ? "alert" : variant === "growth" ? "growth" : "neutral");

  let badgeStyle = "bg-[#EDF1FF] text-[#2E5BFF] border-[#BFDBFE]";
  let iconBg = "bg-[#EDF1FF] text-[#2E5BFF]";

  if (finalType === "alert") {
    badgeStyle = "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
    iconBg = "bg-[#FEF3C7] text-[#B45309]";
  } else if (finalType === "growth") {
    badgeStyle = "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]";
    iconBg = "bg-[#D1FAE5] text-[#047857]";
  }

  return (
    <div
      id="insight-banner-root"
      className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
    >
      <div className="flex items-start sm:items-center gap-3">
        <div className={`w-7 h-7 rounded-md ${iconBg} flex items-center justify-center shrink-0`}>
          {icon || <Lightbulb className="w-4 h-4" />}
        </div>
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${badgeStyle}`}
            >
              {displayBadge}
            </span>
            {title && <span className="font-bold text-[#1A1F27]">{title}</span>}
          </div>
          <p className="text-[#5B6270] font-medium leading-relaxed">{content}</p>
        </div>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EDF1FF] hover:bg-[#DBEAFE] text-[#2E5BFF] rounded-md font-semibold text-xs transition-colors shrink-0 self-start sm:self-center cursor-pointer"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
