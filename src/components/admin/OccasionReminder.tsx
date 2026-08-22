import React, { useState } from "react";
import { Calendar, Gift, Send, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { InsightBanner } from "./InsightBanner";

export interface OccasionReminderItem {
  id: string;
  customerName: string;
  phone: string;
  recipientRelationship: string; // Ex: "Amiga Camila", "Mãe", "Cônjuge"
  occasionName: string; // Ex: "Aniversário de Casamento", "Dia das Mães"
  originalPurchaseDate: string;
  reminderTriggerDate: string;
  suggestedGiftKit: string;
  status: "agendado" | "disparado" | "convertido";
}

export interface OccasionReminderProps {
  onShowNotification?: (type: "success" | "error", msg: string) => void;
}

export const OccasionReminder: React.FC<OccasionReminderProps> = ({ onShowNotification }) => {
  const [reminders, setReminders] = useState<OccasionReminderItem[]>([
    {
      id: "rem-1",
      customerName: "Lucas Mendonça Ferreira",
      phone: "(11) 97722-4411",
      recipientRelationship: "Esposa (Mariana)",
      occasionName: "Aniversário de Casamento",
      originalPurchaseDate: "15 set, 25",
      reminderTriggerDate: "Hoje (15 ago, 26 - D-30)",
      suggestedGiftKit: "Kit Presente Luxo Chá & Bem-Estar",
      status: "agendado",
    },
    {
      id: "rem-2",
      customerName: "Camila Guimarães Rocha",
      phone: "(11) 98844-2109",
      recipientRelationship: "Melhor Amiga",
      occasionName: "Aniversário",
      originalPurchaseDate: "28 set, 25",
      reminderTriggerDate: "28 ago, 26 (D-30)",
      suggestedGiftKit: "Vela Aromática Vanilla & Planner",
      status: "agendado",
    },
  ]);

  const handleSendNow = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "disparado" } : r))
    );
    onShowNotification?.(
      "success",
      "Lembrete de ocasião afetivo enviado via WhatsApp com sugestão de presente!"
    );
  };

  return (
    <div id="occasion-reminder-root" className="space-y-6">
      <InsightBanner
        title="Motor de Lembretes de Ocasião (~11 meses)"
        insight="Presentes são recorrentes anualmente. O sistema memoriza para quem e em qual época o cliente comprou, enviando uma sugestão personalizada 30 dias antes da data se repetir."
        badge="Recompra Previsível"
        type="growth"
      />

      <div className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-5 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF1]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#2E5BFF]" />
            <h3 className="font-bold text-[#1A1F27]">Próximas Ocasiões Memorizadas</h3>
          </div>
          <span className="text-[11px] text-[#5B6270]">Automação #11</span>
        </div>

        <div className="space-y-3">
          {reminders.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-lg border border-[#E3E5E9] bg-[#F1F3F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1A1F27]">{r.customerName}</span>
                  <span className="text-[11px] font-semibold text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                    {r.occasionName} ({r.recipientRelationship})
                  </span>
                </div>
                <div className="text-[11px] text-[#5B6270] space-y-0.5">
                  <div>Compra original: {r.originalPurchaseDate} • Disparo previsto: <strong className="text-[#1A1F27]">{r.reminderTriggerDate}</strong></div>
                  <div>Sugestão IA: <strong className="text-[#2E5BFF]">{r.suggestedGiftKit}</strong></div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {r.status === "disparado" ? (
                  <span className="text-[11px] font-semibold text-[#047857] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enviado via WhatsApp
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSendNow(r.id)}
                    className="px-3 py-1.5 bg-[#2E5BFF] hover:bg-[#1E45D6] text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Disparar WhatsApp</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
