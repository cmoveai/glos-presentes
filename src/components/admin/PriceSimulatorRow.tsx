import React from "react";
import { MarginBadge } from "./MarginBadge";
import { Sparkles } from "lucide-react";

export interface SimulationMethodData {
  methodName: string;
  feePercent: number;
  fixedFee: number;
  finalPrice: number;
  grossMarginReal: number;
  grossMarginPercent: number;
  netProfit: number;
}

export interface PriceSimulatorRowProps {
  methodName: string;
  badgeLabel: string;
  feeDescription: string;
  costPrice: number;
  sellingPrice: number;
  taxPercent: number;
  mpFeePercent: number;
  variableExpensesPercent: number;
  targetMarginPercent: number;
}

export const PriceSimulatorRow: React.FC<PriceSimulatorRowProps> = ({
  methodName,
  badgeLabel,
  feeDescription,
  costPrice,
  sellingPrice,
  taxPercent,
  mpFeePercent,
  variableExpensesPercent,
  targetMarginPercent,
}) => {
  // Gross-up calculation:
  // Preço = Custo / [ 1 - (%imposto + %taxa MP + %despesas variáveis + %margem desejada) ]
  const totalDeductionsPercent = (taxPercent + mpFeePercent + variableExpensesPercent) / 100;
  const taxReal = sellingPrice * (taxPercent / 100);
  const mpFeeReal = sellingPrice * (mpFeePercent / 100);
  const variableExpensesReal = sellingPrice * (variableExpensesPercent / 100);
  
  const totalCosts = costPrice + taxReal + mpFeeReal + variableExpensesReal;
  const netProfit = sellingPrice - totalCosts;
  const netMarginPercent = sellingPrice > 0 ? (netProfit / sellingPrice) * 100 : 0;

  return (
    <div className="p-3.5 rounded-lg bg-[#FFFFFF] border border-[#E3E5E9] hover:border-[#CBD0D8] transition-all grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
      {/* Método */}
      <div className="md:col-span-3">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[#1A1F27]">{methodName}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#F1F3F6] text-[#5B6270] border border-[#E3E5E9]">
            {badgeLabel}
          </span>
        </div>
        <p className="text-[11px] text-[#8A8F98] mt-0.5">{feeDescription}</p>
      </div>

      {/* Preço de Venda */}
      <div className="md:col-span-2">
        <span className="text-[10px] text-[#8A8F98] uppercase block md:hidden">Preço Praticado</span>
        <span className="text-sm font-bold text-[#1A1F27] tabular-nums font-sans">
          R$ {sellingPrice.toFixed(2)}
        </span>
      </div>

      {/* Taxas + Impostos */}
      <div className="md:col-span-3">
        <span className="text-[10px] text-[#8A8F98] uppercase block md:hidden">Taxas & Impostos</span>
        <div className="space-y-0.5 text-[11px] text-[#5B6270]">
          <div>Taxa MP: R$ {mpFeeReal.toFixed(2)} ({mpFeePercent}%)</div>
          <div>Imposto: R$ {taxReal.toFixed(2)} ({taxPercent}%)</div>
        </div>
      </div>

      {/* Lucro Líquido */}
      <div className="md:col-span-2">
        <span className="text-[10px] text-[#8A8F98] uppercase block md:hidden">Lucro Líquido</span>
        <span className="text-xs font-bold text-[#1A1F27] tabular-nums">
          R$ {netProfit.toFixed(2)}
        </span>
      </div>

      {/* Margem Final */}
      <div className="md:col-span-2 flex justify-start md:justify-end">
        <MarginBadge marginPercent={netMarginPercent} targetMargin={targetMarginPercent} />
      </div>
    </div>
  );
};
