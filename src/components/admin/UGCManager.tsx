import React, { useState } from "react";
import { Camera, Check, X, Star, ShieldCheck, Heart, Sparkles } from "lucide-react";
import { InsightBanner } from "./InsightBanner";

export interface UGCEntry {
  id: string;
  customerName: string;
  productName: string;
  mediaUrl: string;
  caption: string;
  rating: number;
  submittedAt: string;
  approvedForHome: boolean;
  approvedForPdp: boolean;
  approvedForAds: boolean;
  lgpdGranted: boolean;
  rewardVoucherSent: boolean;
}

export interface UGCManagerProps {
  onShowNotification?: (type: "success" | "error", msg: string) => void;
}

export const UGCManager: React.FC<UGCManagerProps> = ({ onShowNotification }) => {
  const [entries, setEntries] = useState<UGCEntry[]>([
    {
      id: "ugc-1",
      customerName: "Camila Guimarães",
      productName: "Kit Presente Chá & Bem-Estar",
      mediaUrl: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80",
      caption: "A embalagem é simplesmente impecável! Minha amiga ficou emocionada com a cartinha e a qualidade das louças.",
      rating: 5,
      submittedAt: "Hoje, 10:30",
      approvedForHome: true,
      approvedForPdp: true,
      approvedForAds: false,
      lgpdGranted: true,
      rewardVoucherSent: true,
    },
    {
      id: "ugc-2",
      customerName: "Mariana Albuquerque",
      productName: "Vela Aromática Vanilla & Amber",
      mediaUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
      caption: "O aroma tomou conta da casa toda. Chegou super rápido e muito bem embalado.",
      rating: 5,
      submittedAt: "Ontem, 16:40",
      approvedForHome: false,
      approvedForPdp: true,
      approvedForAds: false,
      lgpdGranted: true,
      rewardVoucherSent: false,
    },
  ]);

  const handleToggle = (id: string, field: "approvedForHome" | "approvedForPdp" | "approvedForAds") => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: !e[field] } : e))
    );
    onShowNotification?.("success", "Permissões de exibição do UGC atualizadas!");
  };

  const handleSendReward = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, rewardVoucherSent: true } : e))
    );
    onShowNotification?.("success", "Voucher de recompensa enviado via WhatsApp para a cliente!");
  };

  return (
    <div id="ugc-manager-root" className="space-y-6">
      <InsightBanner
        title="Curadoria de Prova Social & Conteúdo de Clientes (UGC)"
        insight="A automação D+5 dispara o pedido de foto/vídeo após a entrega. Cada envio com autorização LGPD concede um voucher de recompensa, aumentando a conversão da Home e das PDPs em até 28%."
        badge="Prova Social Viva"
        type="growth"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {entries.map((item) => (
          <div
            key={item.id}
            className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-4 shadow-xs space-y-3 text-xs"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#ECEEF1]">
              <div>
                <h4 className="font-bold text-[#1A1F27]">{item.customerName}</h4>
                <p className="text-[11px] text-[#5B6270]">{item.productName}</p>
              </div>
              <div className="flex text-amber-400">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <img
                src={item.mediaUrl}
                alt={item.customerName}
                className="w-24 h-24 object-cover rounded-md border border-[#E3E5E9] shrink-0"
              />
              <div className="space-y-1.5 flex-1">
                <p className="text-[#1A1F27] italic text-[11px] leading-relaxed">
                  "{item.caption}"
                </p>
                <div className="flex items-center gap-1 text-[10px] text-[#047857] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Autorização LGPD assinada digitalmente</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECEEF1] space-y-2">
              <span className="text-[10px] uppercase font-bold text-[#8A8F98] block">
                Onde Exibir este Depoimento:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(item.id, "approvedForHome")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                    item.approvedForHome
                      ? "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]"
                      : "bg-[#F1F3F6] text-[#5B6270] border-[#E3E5E9]"
                  }`}
                >
                  {item.approvedForHome ? "✓ Exibir na Home" : "+ Home"}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggle(item.id, "approvedForPdp")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                    item.approvedForPdp
                      ? "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]"
                      : "bg-[#F1F3F6] text-[#5B6270] border-[#E3E5E9]"
                  }`}
                >
                  {item.approvedForPdp ? "✓ Exibir na Página do Produto (PDP)" : "+ PDP"}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggle(item.id, "approvedForAds")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer ${
                    item.approvedForAds
                      ? "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]"
                      : "bg-[#F1F3F6] text-[#5B6270] border-[#E3E5E9]"
                  }`}
                >
                  {item.approvedForAds ? "✓ Anúncios Pagos (Ads)" : "+ Ads"}
                </button>
              </div>
            </div>

            {!item.rewardVoucherSent && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSendReward(item.id)}
                  className="px-3 py-1.5 bg-[#2E5BFF] hover:bg-[#1E45D6] text-white rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enviar Voucher de Recompensa (R$ 25 OFF)</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
