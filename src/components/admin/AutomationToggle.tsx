import React from "react";
import { Sparkles, Clock } from "lucide-react";

export interface AutomationToggleProps {
  id: string;
  title: string;
  description: string;
  triggerDescription: string;
  enabled: boolean;
  onToggle: (id: string, newState: boolean) => void;
  icon?: React.ReactNode;
  tag?: string;
  lastRun?: string;
  numberBadge?: number;
}

export const AutomationToggle: React.FC<AutomationToggleProps> = ({
  id,
  title,
  description,
  triggerDescription,
  enabled,
  onToggle,
  icon,
  tag,
  lastRun,
  numberBadge,
}) => {
  return (
    <div
      id={`automation-${id}`}
      className="p-4 sm:p-5 rounded-lg bg-[#FFFFFF] border border-[#E3E5E9] hover:border-[#CBD0D8] transition-all flex flex-col justify-between space-y-3 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
              enabled
                ? "bg-[#EDF1FF] border-[#BFDBFE] text-[#2E5BFF]"
                : "bg-[#F1F3F6] border-[#E3E5E9] text-[#8A8F98]"
            }`}
          >
            {icon || <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {numberBadge !== undefined && (
                <span className="w-5 h-5 rounded-full bg-[#1A1F27] text-white text-[10px] font-bold flex items-center justify-center">
                  {numberBadge}
                </span>
              )}
              <h4 className="text-xs font-bold text-[#1A1F27]">{title}</h4>
              {tag && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]">
                  {tag}
                </span>
              )}
            </div>
            <p className="text-xs text-[#5B6270] leading-relaxed">{description}</p>
          </div>
        </div>

        {/* Switch toggle button */}
        <button
          type="button"
          onClick={() => onToggle(id, !enabled)}
          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer focus:outline-hidden p-0.5 ${
            enabled ? "bg-[#2E5BFF]" : "bg-[#E3E5E9]"
          }`}
          title={enabled ? "Desativar automação" : "Ativar automação"}
        >
          <span
            className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      <div className="pt-2.5 border-t border-[#ECEEF1] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#8A8F98]">
        <span className="flex items-center gap-1.5 font-medium">
          <Clock className="w-3.5 h-3.5 text-[#8A8F98]" />
          <span>Gatilho: <strong className="text-[#1A1F27] font-semibold">{triggerDescription}</strong></span>
        </span>

        {lastRun && (
          <span className="text-[#5B6270] font-medium">
            Último disparo: {lastRun}
          </span>
        )}
      </div>
    </div>
  );
};
