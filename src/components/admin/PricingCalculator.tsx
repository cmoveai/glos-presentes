import React, { useState, useEffect } from "react";
import { Calculator, AlertTriangle, CheckCircle2, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import { Card } from "./Card";
import {
  calculateGrossUpMarkup,
  MarkupGrossUpInput,
  MarkupGrossUpResult,
} from "../../services/productService";

interface PricingCalculatorProps {
  initialCost?: number;
  initialPrice?: number;
  onApplyPrice?: (suggestedPrice: number, costPrice: number) => void;
  className?: string;
  isCompact?: boolean;
}

/**
 * Calculadora de Precificação Assistida (Markup Gross-up) — glos.
 * Fórmula Gross-up: Preço = Custo ÷ [ 1 − (%imposto + %taxa MP + %despesas + %margem) ]
 */
export const PricingCalculator: React.FC<PricingCalculatorProps> = ({
  initialCost = 45,
  initialPrice,
  onApplyPrice,
  className = "",
  isCompact = false,
}) => {
  const [cost, setCost] = useState<number>(initialCost);
  const [taxPercent, setTaxPercent] = useState<number>(6.0); // Simples Nacional padrão e-commerce
  const [paymentFeePercent, setPaymentFeePercent] = useState<number>(3.99); // Taxa média meio de pagamento
  const [expensePercent, setExpensePercent] = useState<number>(4.0); // Embalagem rígida + tags
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(30.0); // Margem líquida alvo 30%

  const [result, setResult] = useState<MarkupGrossUpResult>(() =>
    calculateGrossUpMarkup({
      cost: initialCost,
      taxPercent: 6.0,
      paymentFeePercent: 3.99,
      expensePercent: 4.0,
      targetMarginPercent: 30.0,
    })
  );

  useEffect(() => {
    const res = calculateGrossUpMarkup({
      cost,
      taxPercent,
      paymentFeePercent,
      expensePercent,
      targetMarginPercent,
    });
    setResult(res);
  }, [cost, taxPercent, paymentFeePercent, expensePercent, targetMarginPercent]);

  return (
    <Card padding={isCompact ? "sm" : "md"} className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#D6D3CC]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-[4px] bg-[rgba(0,74,173,0.08)] text-[#004AAD]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-medium text-[#272727]">
              Precificação Assistida (Markup Gross-up)
            </h4>
            <p className="text-[11px] text-[#6B6A64]">
              Cálculo reverso garantindo impostos, taxas e margem líquida real
            </p>
          </div>
        </div>

        <div className="text-[10px] text-[#9B998F] tabular-nums">
          Fórmula: Custo ÷ [1 − Σ%]
        </div>
      </div>

      {/* Grid de Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div>
          <label className="block text-[11px] text-[#6B6A64] mb-1">
            Custo Total (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={cost}
            onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
          />
        </div>

        <div>
          <label className="block text-[11px] text-[#6B6A64] mb-1">
            Impostos (% Simples)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="40"
            value={taxPercent}
            onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
          />
        </div>

        <div>
          <label className="block text-[11px] text-[#6B6A64] mb-1">
            Taxa Pagamento (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="20"
            value={paymentFeePercent}
            onChange={(e) => setPaymentFeePercent(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
          />
        </div>

        <div>
          <label className="block text-[11px] text-[#6B6A64] mb-1">
            Despesas/Embalagem (%)
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="30"
            value={expensePercent}
            onChange={(e) => setExpensePercent(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="block text-[11px] text-[#6B6A64] mb-1">
            Margem Líquida Alvo (%)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            max="70"
            value={targetMarginPercent}
            onChange={(e) => setTargetMarginPercent(parseFloat(e.target.value) || 0)}
            className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#004AAD] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
          />
        </div>
      </div>

      {/* Alerta de Dedução excessiva */}
      {result.totalDeductionsPercent >= 100 && (
        <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#9B2C2C] text-xs text-[#9B2C2C] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            A soma das deduções ({result.totalDeductionsPercent.toFixed(1)}%) atingiu 100%. Reduza os percentuais para calcular o preço sugerido.
          </span>
        </div>
      )}

      {/* Resumo do Cálculo */}
      <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] text-[#6B6A64] block">
            Preço de Venda Sugerido
          </span>
          <div className="text-xl sm:text-2xl font-medium text-[#004AAD] tabular-nums">
            R$ {result.suggestedPrice.toFixed(2).replace(".", ",")}
          </div>
          <div className="text-[11px] text-[#6B6A64] mt-0.5">
            Margem Líquida:{" "}
            <span
              className={`font-medium tabular-nums ${
                result.isNegativeMargin ? "text-[#9B2C2C]" : "text-[#0F7A4F]"
              }`}
            >
              R$ {result.marginAmount.toFixed(2).replace(".", ",")} ({result.marginPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Detalhamento em linha */}
        <div className="grid grid-cols-3 gap-2 text-[11px] text-[#6B6A64] border-t sm:border-t-0 sm:border-l border-[#D6D3CC] pt-2 sm:pt-0 sm:pl-4">
          <div>
            <span className="block text-[#9B998F]">Impostos:</span>
            <span className="font-medium text-[#272727] tabular-nums">
              R$ {result.breakdown.taxes.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div>
            <span className="block text-[#9B998F]">Taxa Gateway:</span>
            <span className="font-medium text-[#272727] tabular-nums">
              R$ {result.breakdown.paymentFee.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div>
            <span className="block text-[#9B998F]">Despesas:</span>
            <span className="font-medium text-[#272727] tabular-nums">
              R$ {result.breakdown.expenses.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* Botão de Aplicar Preço */}
        {onApplyPrice && (
          <div className="shrink-0 flex items-center">
            <button
              type="button"
              onClick={() => onApplyPrice(result.suggestedPrice, cost)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
            >
              <span>Aplicar no Produto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};
