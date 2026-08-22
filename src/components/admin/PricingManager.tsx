import React, { useState } from "react";
import { Product } from "../../types";
import { PriceSimulatorRow } from "./PriceSimulatorRow";
import { InsightBanner } from "./InsightBanner";
import {
  Calculator,
  Percent,
  TrendingUp,
  Settings,
  Sparkles,
  AlertTriangle,
  HelpCircle,
  Save,
  CheckCircle2,
  Package,
  Layers,
} from "lucide-react";

export interface PricingManagerProps {
  products: Product[];
  onUpdateProductPrice?: (productId: string, newPrice: number) => void;
  onShowNotification?: (type: "success" | "error", message: string) => void;
}

export const PricingManager: React.FC<PricingManagerProps> = ({
  products,
  onUpdateProductPrice,
  onShowNotification,
}) => {
  // Configuração global de precificação
  const [taxPercent, setTaxPercent] = useState<number>(6.0); // Simples Nacional padrão e-commerce
  const [variableExpensesPercent, setVariableExpensesPercent] = useState<number>(3.5); // Embalagens, frete embutido
  const [targetMarginPercent, setTargetMarginPercent] = useState<number>(30.0); // 30% de margem líquida alvo

  // Taxas Mercado Pago
  const [pixFee, setPixFee] = useState<number>(0.99); // 0.99% no Pix
  const [creditVistaFee, setCreditVistaFee] = useState<number>(3.99); // 3.99% Cartão à vista
  const [creditInstallmentsFee, setCreditInstallmentsFee] = useState<number>(8.99); // 8.99% em até 10x sem juros

  // Seleção de produto para simulação detalhada
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || "");
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Componentes de custo do produto selecionado
  const [baseCost, setBaseCost] = useState<number>(45.0);
  const [customizationCost, setCustomizationCost] = useState<number>(10.0);
  const [packagingCost, setPackagingCost] = useState<number>(8.0);
  const totalCost = baseCost + customizationCost + packagingCost;

  // Preço de venda praticado
  const currentSellingPrice = selectedProduct?.price || 189.9;
  const [simulatedPrice, setSimulatedPrice] = useState<number>(currentSellingPrice);

  // Cálculo do Preço Sugerido pela Fórmula Gross-up:
  // Preço = Custo / [ 1 - (%imposto + %taxa MP + %despesas + %margem) ]
  const totalDeductions = (taxPercent + creditVistaFee + variableExpensesPercent + targetMarginPercent) / 100;
  const suggestedPriceRaw = totalDeductions < 1 ? totalCost / (1 - totalDeductions) : totalCost * 2;
  // Arredondamento psicológico para .90
  const suggestedPricePsychological = Math.ceil(suggestedPriceRaw) - 0.1;

  const handleApplySuggestedPrice = () => {
    setSimulatedPrice(suggestedPricePsychological);
    if (selectedProduct && onUpdateProductPrice) {
      onUpdateProductPrice(selectedProduct.id, suggestedPricePsychological);
    }
    onShowNotification?.(
      "success",
      `Preço sugerido de R$ ${suggestedPricePsychological.toFixed(2)} aplicado com sucesso!`
    );
  };

  return (
    <div id="pricing-manager-root" className="space-y-6">
      {/* Faixa de Insight IA */}
      <InsightBanner
        title="IA Precificação: Otimização de Margens & Markup Divisor"
        insight="A fórmula Gross-Up garante que sua margem seja calculada sobre o preço de venda e não sobre o custo. Cuidado com vendas em 10x sem juros: a taxa do Mercado Pago sobe para 8.99%, reduzindo sua margem líquida."
        actionLabel="Simular Todas as Taxas"
        onAction={() => window.scrollTo({ top: 400, behavior: "smooth" })}
        badge="Margem Blindada"
        type="growth"
      />

      {/* Grid Superior: Configurações Globais + Fórmula Gross-Up */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Taxas e Impostos Globais (7 cols) */}
        <div className="lg:col-span-7 bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF1]">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#2E5BFF]" />
              <h3 className="text-sm font-bold text-[#1A1F27]">
                Parâmetros Globais de Custos & Taxas
              </h3>
            </div>
            <span className="text-[11px] text-[#5B6270]">Simples Nacional / Mercado Pago</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1F27] block">
                Alíquota de Imposto (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-semibold text-xs focus:border-[#2E5BFF] focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-[#8A8F98] font-bold">%</span>
              </div>
              <span className="text-[10px] text-[#8A8F98]">DAS (Simples Nacional)</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1F27] block">
                Despesas Variáveis (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={variableExpensesPercent}
                  onChange={(e) => setVariableExpensesPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-semibold text-xs focus:border-[#2E5BFF] focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-[#8A8F98] font-bold">%</span>
              </div>
              <span className="text-[10px] text-[#8A8F98]">Embalagem, frete subsidiado</span>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-[#1A1F27] block">
                Margem Alvo Líquida (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={targetMarginPercent}
                  onChange={(e) => setTargetMarginPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#047857] font-bold text-xs focus:border-[#2E5BFF] focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-[#8A8F98] font-bold">%</span>
              </div>
              <span className="text-[10px] text-[#047857] font-medium">Meta mínima de lucro</span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#ECEEF1]">
            <h4 className="text-xs font-semibold text-[#1A1F27] mb-2.5">
              Taxas de Intermediação Mercado Pago
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-md bg-[#F1F3F6] border border-[#E3E5E9]">
                <span className="text-[11px] text-[#5B6270] block">Pix Instantâneo</span>
                <span className="font-bold text-[#1A1F27] text-sm tabular-nums">{pixFee}%</span>
              </div>
              <div className="p-2.5 rounded-md bg-[#F1F3F6] border border-[#E3E5E9]">
                <span className="text-[11px] text-[#5B6270] block">Cartão à Vista</span>
                <span className="font-bold text-[#1A1F27] text-sm tabular-nums">{creditVistaFee}%</span>
              </div>
              <div className="p-2.5 rounded-md bg-[#F1F3F6] border border-[#E3E5E9]">
                <span className="text-[11px] text-[#5B6270] block">Cartão Parcelado (10x)</span>
                <span className="font-bold text-[#1A1F27] text-sm tabular-nums">{creditInstallmentsFee}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Explicativo: Fórmula Gross-up (5 cols) */}
        <div className="lg:col-span-5 bg-[#EDF1FF] border border-[#BFDBFE] rounded-lg p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 text-xs">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[#2E5BFF]">
              <Calculator className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Markup Divisor (Gross-Up)
              </span>
            </div>
            <h4 className="text-base font-bold text-[#1A1F27]">
              Por que nunca usar Margem sobre o Custo?
            </h4>
            <p className="text-[#5B6270] leading-relaxed">
              Ao aplicar taxas e impostos sobre o preço final de venda, a margem de custo ilusória (mark-on) gera prejuízo oculto. O Gross-Up protege o lucro real:
            </p>
          </div>

          <div className="p-3 bg-white rounded-md border border-[#BFDBFE] font-mono text-[11px] text-[#1A1F27] space-y-1">
            <div className="text-[#2E5BFF] font-bold">Preço = Custo ÷ [ 1 − Σ(Deduções + Margem) ]</div>
            <div className="text-[#8A8F98] text-[10px]">
              Deduções = Imposto ({taxPercent}%) + Taxa MP ({creditVistaFee}%) + Despesas ({variableExpensesPercent}%) + Margem ({targetMarginPercent}%)
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-[#2E5BFF]">
            <span>Divisor Atual: [1 − {(totalDeductions).toFixed(2)}] = {(1 - totalDeductions).toFixed(2)}</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Seletor do Produto e Simulador Lado a Lado */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#ECEEF1]">
          <div>
            <h3 className="text-base font-bold text-[#1A1F27]">
              Simulador por Produto & Canais de Pagamento
            </h3>
            <p className="text-xs text-[#5B6270]">
              Selecione um produto do catálogo para decompor os custos e simular a rentabilidade em cada método.
            </p>
          </div>

          {/* Select de Produto */}
          <div className="w-full sm:w-72">
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p) setSimulatedPrice(p.price);
              }}
              className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] text-xs font-semibold focus:border-[#2E5BFF] focus:outline-hidden"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — R$ {p.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Decomposição do Custo do Produto */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-[#F1F3F6] border border-[#E3E5E9] text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[#1A1F27]">Custo de Insumo / Fabricação</label>
            <input
              type="number"
              step="1"
              value={baseCost}
              onChange={(e) => setBaseCost(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#1A1F27]">Personalização / Gravação</label>
            <input
              type="number"
              step="1"
              value={customizationCost}
              onChange={(e) => setCustomizationCost(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-[#1A1F27]">Embalagem Especial / Caixa</label>
            <input
              type="number"
              step="1"
              value={packagingCost}
              onChange={(e) => setPackagingCost(Number(e.target.value))}
              className="w-full px-3 py-1.5 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-semibold"
            />
          </div>

          <div className="space-y-1 flex flex-col justify-end">
            <span className="text-[11px] text-[#5B6270] font-semibold">Custo Total do Produto</span>
            <div className="text-base font-bold text-[#1A1F27] tabular-nums">
              R$ {totalCost.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Preço Praticado vs. Preço Sugerido IA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-[#D1FAE5]/40 border border-[#A7F3D0]">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#047857] block">
              Recomendação de Preço Sugerido (Gross-Up)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-[#047857] tabular-nums">
                R$ {suggestedPricePsychological.toFixed(2)}
              </span>
              <span className="text-xs text-[#5B6270]">
                (Garante {targetMarginPercent}% de margem líquida à vista)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplySuggestedPrice}
            className="px-4 py-2 rounded-md bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-center"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aplicar Preço no Catálogo</span>
          </button>
        </div>

        {/* Tabela de Simulação por Método de Pagamento */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-[#1A1F27] uppercase tracking-wider">
            Simulação de Margem por Canal de Pagamento
          </h4>

          <div className="hidden md:grid grid-cols-12 gap-3 px-3 py-1.5 text-[11px] font-semibold text-[#8A8F98] uppercase">
            <div className="col-span-3">Forma de Pagamento</div>
            <div className="col-span-2">Preço Praticado</div>
            <div className="col-span-3">Deduções (Imposto + MP)</div>
            <div className="col-span-2">Lucro Líquido</div>
            <div className="col-span-2 text-right">Margem Líquida</div>
          </div>

          <PriceSimulatorRow
            methodName="Pix Instantâneo"
            badgeLabel="Menor Taxa"
            feeDescription="Recebimento imediato na conta"
            costPrice={totalCost}
            sellingPrice={simulatedPrice}
            taxPercent={taxPercent}
            mpFeePercent={pixFee}
            variableExpensesPercent={variableExpensesPercent}
            targetMarginPercent={targetMarginPercent}
          />

          <PriceSimulatorRow
            methodName="Cartão de Crédito à Vista"
            badgeLabel="D+14 ou D+30"
            feeDescription="Recebimento padrão Mercado Pago"
            costPrice={totalCost}
            sellingPrice={simulatedPrice}
            taxPercent={taxPercent}
            mpFeePercent={creditVistaFee}
            variableExpensesPercent={variableExpensesPercent}
            targetMarginPercent={targetMarginPercent}
          />

          <PriceSimulatorRow
            methodName="Cartão em até 10x Sem Juros"
            badgeLabel="Maior Absorção"
            feeDescription="Loja assume o custo do parcelamento"
            costPrice={totalCost}
            sellingPrice={simulatedPrice}
            taxPercent={taxPercent}
            mpFeePercent={creditInstallmentsFee}
            variableExpensesPercent={variableExpensesPercent}
            targetMarginPercent={targetMarginPercent}
          />
        </div>
      </div>
    </div>
  );
};
