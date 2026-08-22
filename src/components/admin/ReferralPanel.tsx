import React, { useState } from "react";
import { Share2, Users, Gift, TrendingUp, CheckCircle2, Copy } from "lucide-react";
import { InsightBanner } from "./InsightBanner";

export interface ReferralStat {
  customerName: string;
  referralCode: string;
  totalInvited: number;
  totalConverted: number;
  totalRevenueGenerated: number;
  creditsEarned: number;
}

export interface ReferralPanelProps {
  onShowNotification?: (type: "success" | "error", msg: string) => void;
}

export const ReferralPanel: React.FC<ReferralPanelProps> = ({ onShowNotification }) => {
  const [partnerStats] = useState<ReferralStat[]>([
    {
      customerName: "Camila Guimarães Rocha",
      referralCode: "CAMILA-VIP",
      totalInvited: 12,
      totalConverted: 4,
      totalRevenueGenerated: 1140.0,
      creditsEarned: 80.0,
    },
    {
      customerName: "Mariana Albuquerque",
      referralCode: "MARI-PRESENTES",
      totalInvited: 8,
      totalConverted: 3,
      totalRevenueGenerated: 850.0,
      creditsEarned: 60.0,
    },
  ]);

  const handleCopyLink = (code: string) => {
    navigator.clipboard?.writeText(`https://sualoja.com.br/?ref=${code}`);
    onShowNotification?.("success", `Link do Embaixador (${code}) copiado!`);
  };

  return (
    <div id="referral-panel-root" className="space-y-6">
      <InsightBanner
        title="Programa Indique & Ganhe (MGM - Member-Get-Member)"
        insight="O programa recompensa bilateralmente com trava de margem: quem indica ganha R$ 20 em créditos e o amigo recebe R$ 20 OFF na 1ª compra acima de R$ 150."
        badge="Crescimento Orgânico"
        type="growth"
      />

      <div className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-5 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF1]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2E5BFF]" />
            <h3 className="font-bold text-[#1A1F27]">Embaixadores Ativos do Programa</h3>
          </div>
          <span className="text-[11px] text-[#047857] font-semibold bg-[#D1FAE5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
            Crédito Bilateral Ativo
          </span>
        </div>

        <div className="space-y-3">
          {partnerStats.map((p) => (
            <div
              key={p.referralCode}
              className="p-3.5 rounded-lg border border-[#E3E5E9] bg-[#F1F3F6] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1A1F27] text-xs">{p.customerName}</span>
                  <span className="font-mono text-[11px] font-bold text-[#2E5BFF] bg-white px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {p.referralCode}
                  </span>
                </div>
                <div className="text-[11px] text-[#5B6270] flex flex-wrap gap-3">
                  <span>Convidados: <strong className="text-[#1A1F27]">{p.totalInvited}</strong></span>
                  <span>Convertidos: <strong className="text-[#047857]">{p.totalConverted}</strong></span>
                  <span>Receita Gerada: <strong className="text-[#1A1F27]">R$ {p.totalRevenueGenerated.toFixed(2)}</strong></span>
                  <span>Vouchers Acumulados: <strong className="text-[#047857]">R$ {p.creditsEarned.toFixed(2)}</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCopyLink(p.referralCode)}
                className="px-3 py-1.5 bg-white hover:bg-stone-50 text-[#1A1F27] border border-[#E3E5E9] rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-[#5B6270]" />
                <span>Copiar Link</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
