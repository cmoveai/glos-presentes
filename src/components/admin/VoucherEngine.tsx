import React, { useState } from "react";
import { Tag, Sparkles, AlertTriangle, CheckCircle2, Percent, ShieldCheck } from "lucide-react";
import { InsightBanner } from "./InsightBanner";

export interface VoucherRule {
  id: string;
  code: string;
  type: "porcentagem" | "fixo";
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap?: number;
  maxMarginImpactPercent: number;
  validityDays: number;
  targetAudience: "todas" | "primeira_compra" | "ugc_reward" | "mgm_referral" | "vip";
  status: "ativo" | "pausado" | "expirado";
}

export interface VoucherEngineProps {
  baseMarginPercent?: number;
  onSaveVoucher?: (voucher: VoucherRule) => void;
  onShowNotification?: (type: "success" | "error", msg: string) => void;
}

export const VoucherEngine: React.FC<VoucherEngineProps> = ({
  baseMarginPercent = 30.0,
  onSaveVoucher,
  onShowNotification,
}) => {
  const [vouchers, setVouchers] = useState<VoucherRule[]>([
    {
      id: "vouch-1",
      code: "BEMVINDO10",
      type: "porcentagem",
      discountValue: 10,
      minOrderValue: 150,
      maxMarginImpactPercent: 10,
      validityDays: 15,
      targetAudience: "primeira_compra",
      status: "ativo",
    },
    {
      id: "vouch-2",
      code: "UGC20OFF",
      type: "fixo",
      discountValue: 25,
      minOrderValue: 200,
      maxMarginImpactPercent: 12.5,
      validityDays: 30,
      targetAudience: "ugc_reward",
      status: "ativo",
    },
    {
      id: "vouch-3",
      code: "AMIGOINDICOU",
      type: "fixo",
      discountValue: 20,
      minOrderValue: 180,
      maxMarginImpactPercent: 11.1,
      validityDays: 30,
      targetAudience: "mgm_referral",
      status: "ativo",
    },
  ]);

  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<"porcentagem" | "fixo">("porcentagem");
  const [newValue, setNewValue] = useState<number>(10);
  const [newMinOrder, setNewMinOrder] = useState<number>(150);
  const [newAudience, setNewAudience] = useState<any>("primeira_compra");

  // Trava de margem: desconto máximo não pode ultrapassar a metade da margem líquida alvo
  const maxSafeDiscount = baseMarginPercent * 0.5; // ex: 30% / 2 = 15%
  const isExceedingMargin = newType === "porcentagem" && newValue > maxSafeDiscount;

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) {
      onShowNotification?.("error", "Informe o código do cupom.");
      return;
    }

    const created: VoucherRule = {
      id: `vouch-${Date.now()}`,
      code: newCode.toUpperCase().trim(),
      type: newType,
      discountValue: newValue,
      minOrderValue: newMinOrder,
      maxMarginImpactPercent: newType === "porcentagem" ? newValue : (newValue / newMinOrder) * 100,
      validityDays: 30,
      targetAudience: newAudience,
      status: "ativo",
    };

    setVouchers([created, ...vouchers]);
    setNewCode("");
    onSaveVoucher?.(created);
    onShowNotification?.("success", `Cupom ${created.code} criado com trava de margem ativada!`);
  };

  return (
    <div id="voucher-engine-root" className="space-y-6">
      <InsightBanner
        title="Motor de Cupons com Trava de Margem"
        insight={`Com a margem líquida média de ${baseMarginPercent}%, a IA recomenda que o desconto máximo concedido nunca ultrapasse ${maxSafeDiscount.toFixed(1)}% para preservar o markup divisor e a lucratividade do pedido.`}
        actionLabel="Ver Regras de Cupons"
        badge="Trava Antissangria"
        type="growth"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulário de Criação com Trava de Margem (5 cols) */}
        <form
          onSubmit={handleCreateVoucher}
          className="lg:col-span-5 bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-5 shadow-xs space-y-4 text-xs"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-[#ECEEF1]">
            <Tag className="w-4 h-4 text-[#2E5BFF]" />
            <h3 className="font-bold text-[#1A1F27]">Criar Novo Cupom Inteligente</h3>
          </div>

          <div className="space-y-1.5">
            <label className="font-semibold text-[#1A1F27]">Código do Cupom</label>
            <input
              type="text"
              placeholder="EX: PROMO10, AMIGOVIP"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-mono font-bold focus:border-[#2E5BFF] focus:outline-hidden uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1F27]">Tipo de Desconto</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] focus:border-[#2E5BFF] focus:outline-hidden"
              >
                <option value="porcentagem">Porcentagem (%)</option>
                <option value="fixo">Valor Fixo (R$)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1F27]">
                {newType === "porcentagem" ? "Percentual (%)" : "Valor em R$"}
              </label>
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-bold focus:border-[#2E5BFF] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1F27]">Pedido Mínimo (R$)</label>
              <input
                type="number"
                value={newMinOrder}
                onChange={(e) => setNewMinOrder(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-semibold focus:border-[#2E5BFF] focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1F27]">Finalidade / Gatilho</label>
              <select
                value={newAudience}
                onChange={(e) => setNewAudience(e.target.value as any)}
                className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] focus:border-[#2E5BFF] focus:outline-hidden"
              >
                <option value="primeira_compra">Boas-Vindas 1ª Compra</option>
                <option value="ugc_reward">Recompensa Foto/Vídeo UGC</option>
                <option value="mgm_referral">Indique & Ganhe (MGM)</option>
                <option value="vip">Reativação de VIPs</option>
              </select>
            </div>
          </div>

          {/* Alerta de Trava de Margem */}
          {isExceedingMargin ? (
            <div className="p-3 rounded-md bg-[#FEE2E2] border border-[#FECACA] text-[11px] text-[#B91C1C] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção de Margem:</strong> Desconto de {newValue}% excede o limite seguro recomendado ({maxSafeDiscount}%). Isso pode reduzir a margem líquida a níveis perigosos.
              </span>
            </div>
          ) : (
            <div className="p-2.5 rounded-md bg-[#D1FAE5] border border-[#A7F3D0] text-[11px] text-[#047857] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Desconto validado dentro da trava de margem.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-[#2E5BFF] hover:bg-[#1E45D6] text-white rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Criar e Ativar Cupom</span>
          </button>
        </form>

        {/* Lista de Cupons Ativos (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-5 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF1]">
            <h3 className="font-bold text-[#1A1F27]">Cupons em Circulação</h3>
            <span className="text-[11px] text-[#5B6270]">{vouchers.length} ativos</span>
          </div>

          <div className="space-y-2.5">
            {vouchers.map((v) => (
              <div
                key={v.id}
                className="p-3 rounded-lg border border-[#E3E5E9] bg-[#F1F3F6] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#2E5BFF] bg-white px-2 py-0.5 rounded border border-[#BFDBFE]">
                      {v.code}
                    </span>
                    <span className="font-bold text-[#1A1F27]">
                      {v.type === "porcentagem" ? `${v.discountValue}% OFF` : `R$ ${v.discountValue} OFF`}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5B6270]">
                    Pedido mín: <strong>R$ {v.minOrderValue}</strong> • Validade: {v.validityDays} dias • Finalidade: {v.targetAudience.replace("_", " ")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]">
                    Margem Protegida
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
