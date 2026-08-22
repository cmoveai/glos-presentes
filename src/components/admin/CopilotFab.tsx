import React from "react";
import { Bot, Sparkles, X } from "lucide-react";

export interface CopilotFabProps {
  isOpen: boolean;
  onToggle: () => void;
  unreadCount?: number;
}

export const CopilotFab: React.FC<CopilotFabProps> = ({
  isOpen,
  onToggle,
  unreadCount,
}) => {
  return (
    <button
      id="copilot-fab-btn"
      type="button"
      onClick={onToggle}
      className={`fixed bottom-6 right-6 z-50 p-3.5 sm:p-4 rounded-2xl shadow-2xl transition-all duration-300 flex items-center gap-2.5 cursor-pointer border ${
        isOpen
          ? "bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800 scale-95"
          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-stone-950 font-bold border-emerald-400/40 shadow-emerald-600/30 hover:scale-105"
      }`}
      title="Abrir Copiloto de Inteligência Artificial"
    >
      {isOpen ? (
        <>
          <X className="w-5 h-5" />
          <span className="text-xs font-semibold hidden sm:inline">Fechar Copiloto</span>
        </>
      ) : (
        <>
          <div className="relative">
            <Bot className="w-5 h-5 text-stone-950 fill-stone-950" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white animate-ping" />
          </div>
          <span className="text-xs font-extrabold text-stone-950 tracking-tight">
            Copiloto IA
          </span>
          <span className="text-[10px] bg-stone-950/20 px-1.5 py-0.5 rounded-full text-stone-950 font-bold uppercase">
            Gemini
          </span>
        </>
      )}
    </button>
  );
};
