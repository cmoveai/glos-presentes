import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Percent,
  Download,
  Calendar,
  Filter,
  CreditCard,
  QrCode,
  FileText,
  Calculator,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Layers,
  ShoppingBag,
  Truck,
  Sparkles,
} from "lucide-react";
import { Order, Product } from "../../types";

interface FinancialManagerProps {
  orders: Order[];
  products: Product[];
  onNavigateToOrders?: () => void;
}

export const FinancialManager: React.FC<FinancialManagerProps> = ({
  orders,
  products,
  onNavigateToOrders,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d");
  const [transactionFilter, setTransactionFilter] = useState<string>("all");

  // State for the interactive profit calculator tool
  const [simSalePrice, setSimSalePrice] = useState<number>(149.9);
  const [simCostPrice, setSimCostPrice] = useState<number>(55.0);
  const [simPaymentMethod, setSimPaymentMethod] = useState<"pix" | "card_1x" | "card_3x" | "card_6x">("pix");
  const [simShippingSubsidized, setSimShippingSubsidized] = useState<number>(0);
  const [simPackagingCost, setSimPackagingCost] = useState<number>(6.5);

  // Filter orders by time
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let days = 30;
    if (selectedPeriod === "7d") days = 7;
    else if (selectedPeriod === "15d") days = 15;
    else if (selectedPeriod === "30d") days = 30;
    else if (selectedPeriod === "90d") days = 90;
    else if (selectedPeriod === "all") days = 3650;

    const startDate = new Date();
    startDate.setDate(now.getDate() - days);

    return orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= startDate && o.status !== "CANCELADO";
    });
  }, [orders, selectedPeriod]);

  // Product cost lookup map (sku or productId -> costPrice)
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      // If product has costPrice, use it; otherwise estimate standard 38% cost of retail price
      const cost = p.costPrice !== undefined && p.costPrice > 0 ? p.costPrice : p.price * 0.38;
      map.set(p.id, cost);
      if (p.sku) map.set(p.sku, cost);
    });
    return map;
  }, [products]);

  // Financial Calculations
  const financialSummary = useMemo(() => {
    let grossRevenue = 0; // Faturamento Bruto (itens + frete)
    let productSubtotal = 0;
    let discountsGiven = 0;
    let shippingRevenue = 0;
    let estimatedCostOfGoods = 0; // CMV
    let gatewayFees = 0; // Taxas Mercado Pago estimadas
    let packagingAndLogisticsCost = 0;

    // Available vs Future Receivables
    let availableBalance = 0; // PIX is available immediately
    let pendingBalance = 0; // Credit card / future release

    filteredOrders.forEach((ord) => {
      const total = ord.total || 0;
      grossRevenue += total;
      productSubtotal += ord.subtotal || 0;
      discountsGiven += ord.discount || 0;
      shippingRevenue += ord.shippingPrice || 0;

      // Packaging cost estimation (~R$ 5.50 per order)
      packagingAndLogisticsCost += 5.5;

      // Calculate cost of goods sold for this order
      let orderCMV = 0;
      if (ord.items && ord.items.length > 0) {
        ord.items.forEach((item) => {
          const unitCost = productCostMap.get(item.productId) || productCostMap.get(item.sku) || item.price * 0.38;
          orderCMV += unitCost * (item.quantity || 1);
        });
      } else {
        orderCMV = (ord.subtotal || total) * 0.38;
      }
      estimatedCostOfGoods += orderCMV;

      // Calculate gateway fee based on Mercado Pago rules:
      // PIX: 0.99%
      // Cartão 1x: ~3.99%
      // Cartão parcelado 2-6x: ~4.99%
      // Boleto: R$ 3.49 fixo
      let fee = 0;
      if (ord.paymentMethod === "pix") {
        fee = total * 0.0099;
        availableBalance += total - fee;
      } else if (ord.paymentMethod === "credit_card") {
        const installments = ord.paymentDetails?.installments || 1;
        const rate = installments > 1 ? 0.0499 : 0.0399;
        fee = total * rate;
        // Credit card in standard plan releases in D+14 or D+30
        pendingBalance += total - fee;
      } else if (ord.paymentMethod === "boleto") {
        fee = 3.49;
        availableBalance += Math.max(0, total - fee);
      } else {
        fee = total * 0.025;
        availableBalance += total - fee;
      }
      gatewayFees += fee;
    });

    const netRevenue = grossRevenue - discountsGiven;
    const grossProfit = netRevenue - estimatedCostOfGoods;
    const netProfit = grossProfit - gatewayFees - packagingAndLogisticsCost;

    const grossMarginPct = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
    const netMarginPct = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
    const averageTicket = filteredOrders.length > 0 ? grossRevenue / filteredOrders.length : 0;

    return {
      grossRevenue,
      discountsGiven,
      netRevenue,
      estimatedCostOfGoods,
      grossProfit,
      grossMarginPct,
      gatewayFees,
      packagingAndLogisticsCost,
      netProfit,
      netMarginPct,
      averageTicket,
      availableBalance,
      pendingBalance,
      totalOrdersCount: filteredOrders.length,
    };
  }, [filteredOrders, productCostMap]);

  // Calculator Simulation Result
  const simulationResult = useMemo(() => {
    let gatewayRate = 0.0099; // PIX 0.99%
    let feeLabel = "0,99% (PIX Mercado Pago)";

    if (simPaymentMethod === "card_1x") {
      gatewayRate = 0.0399;
      feeLabel = "3,99% (Cartão 1x D+14)";
    } else if (simPaymentMethod === "card_3x") {
      gatewayRate = 0.0489;
      feeLabel = "4,89% (Cartão 3x Sem Juros)";
    } else if (simPaymentMethod === "card_6x") {
      gatewayRate = 0.0599;
      feeLabel = "5,99% (Cartão 6x Sem Juros)";
    }

    const gatewayFee = simSalePrice * gatewayRate;
    const totalDeductions = simCostPrice + gatewayFee + simShippingSubsidized + simPackagingCost;
    const netProfit = simSalePrice - totalDeductions;
    const marginPct = simSalePrice > 0 ? (netProfit / simSalePrice) * 100 : 0;
    const markup = simCostPrice > 0 ? (simSalePrice / simCostPrice) : 0;

    return {
      gatewayFee,
      feeLabel,
      totalDeductions,
      netProfit,
      marginPct,
      markup,
    };
  }, [simSalePrice, simCostPrice, simPaymentMethod, simShippingSubsidized, simPackagingCost]);

  // Export Financial CSV
  const handleExportCSV = () => {
    const headers = [
      "ID Pedido",
      "Data",
      "Cliente",
      "Forma de Pagamento",
      "Status",
      "Valor Bruto (R$)",
      "Desconto (R$)",
      "Frete Cobrado (R$)",
      "CMV Custo Produtos (R$)",
      "Taxa Gateway Estimada (R$)",
      "Lucro Líquido Estimado (R$)",
    ];

    const rows = filteredOrders.map((ord) => {
      let orderCMV = 0;
      if (ord.items && ord.items.length > 0) {
        ord.items.forEach((item) => {
          const unitCost = productCostMap.get(item.productId) || productCostMap.get(item.sku) || item.price * 0.38;
          orderCMV += unitCost * (item.quantity || 1);
        });
      } else {
        orderCMV = (ord.subtotal || ord.total) * 0.38;
      }

      let fee = 0;
      if (ord.paymentMethod === "pix") fee = ord.total * 0.0099;
      else if (ord.paymentMethod === "credit_card") {
        const inst = ord.paymentDetails?.installments || 1;
        fee = ord.total * (inst > 1 ? 0.0499 : 0.0399);
      } else if (ord.paymentMethod === "boleto") fee = 3.49;

      const net = ord.total - orderCMV - fee;

      return [
        ord.id,
        new Date(ord.createdAt).toLocaleDateString("pt-BR"),
        `"${ord.customer?.name || "Cliente"}"`,
        ord.paymentMethod === "pix" ? "PIX" : ord.paymentMethod === "credit_card" ? "Cartão de Crédito" : "Boleto",
        ord.status,
        ord.total.toFixed(2),
        (ord.discount || 0).toFixed(2),
        (ord.shippingPrice || 0).toFixed(2),
        orderCMV.toFixed(2),
        fee.toFixed(2),
        net.toFixed(2),
      ].join(";");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_financeiro_loja_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* ========================================================================= */}
      {/* TOP HEADER CONTROLS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period Filter */}
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none bg-stone-50 hover:bg-stone-100/80 border border-stone-200 text-stone-900 text-xs font-bold py-2 pl-9 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="15d">Últimos 15 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="all">Todo o histórico</option>
            </select>
            <Calendar className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="text-xs text-stone-500 font-medium">
            Base de cálculo: <strong className="text-stone-950 font-bold">{financialSummary.totalOrdersCount} pedidos</strong> no período
          </div>
        </div>

        {/* Action Button Export CSV */}
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar DRE em CSV</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. FINANCIAL KPI EXECUTIVE CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Total */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold tracking-wide uppercase">
                Faturamento Total
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-950">
              R$ {financialSummary.grossRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-stone-500 font-medium">Líquido: R$ {financialSummary.netRevenue.toFixed(2)}</span>
            <span className="text-emerald-700 font-bold">{financialSummary.totalOrdersCount} pedidos</span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold tracking-wide uppercase">
                Ticket Médio
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-950">
              R$ {financialSummary.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-[11px] text-stone-500 mt-3">
            Média por pedido processado na loja
          </p>
        </div>

        {/* Lucro Líquido Real & Margem */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold tracking-wide uppercase">
                Lucro Líquido Real
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-950">
              R$ {financialSummary.netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>
          <p className="text-[11px] text-stone-500 mt-3 flex items-center gap-1 font-medium">
            <span className="text-emerald-700 font-bold">Margem Líquida:</span>{" "}
            {financialSummary.netMarginPct.toFixed(1)}% do faturamento
          </p>
        </div>

        {/* Margem Bruta & Custos */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-xs font-bold tracking-wide uppercase">
                Margem de Lucro Bruta
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-950">
              {financialSummary.grossMarginPct.toFixed(1)}%
            </div>
          </div>
          <p className="text-[11px] text-stone-500 mt-3 flex items-center justify-between">
            <span>CMV: R$ {financialSummary.estimatedCostOfGoods.toFixed(2)}</span>
            <span className="text-purple-700 font-bold">Lucro B.: R$ {financialSummary.grossProfit.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* SALDO & FLUXO DE CAIXA MINI STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-emerald-900 block">Saldo Disponível (PIX)</span>
              <span className="text-lg font-extrabold text-emerald-950">R$ {financialSummary.availableBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-md font-bold">Liberado</span>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-900 block">A Liberar (Cartões D+14/30)</span>
              <span className="text-lg font-extrabold text-blue-950">R$ {financialSummary.pendingBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <span className="text-[10px] bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded-md font-bold">A Compensar</span>
        </div>

        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-bold text-rose-900 block">Taxas Gateway & Custos</span>
              <span className="text-lg font-extrabold text-rose-950">R$ {(financialSummary.gatewayFees + financialSummary.packagingAndLogisticsCost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <span className="text-[10px] bg-rose-200/60 text-rose-900 px-2 py-0.5 rounded-md font-bold">Deduções</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DRE OPERACIONAL DA LOJA (DEMONSTRATIVO DO RESULTADO DO EXERCÍCIO) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-stone-950 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" />
              DRE Operacional da Loja (Demonstrativo de Resultados)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Cálculo estruturado de receitas, custos diretos de mercadorias (CMV) e lucro operacional
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-950 border border-amber-500/20 rounded-full">
            Regime de Caixa
          </span>
        </div>

        <div className="divide-y divide-stone-100 text-xs sm:text-sm">
          {/* (+) Receita Bruta */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                +
              </span>
              <div>
                <span className="font-bold text-stone-900">Receita Bruta Total</span>
                <p className="text-[11px] text-stone-400">Total transacionado em pedidos (produtos + frete)</p>
              </div>
            </div>
            <span className="font-extrabold text-stone-950">
              R$ {financialSummary.grossRevenue.toFixed(2)}
            </span>
          </div>

          {/* (-) Descontos Concedidos */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 font-black text-xs flex items-center justify-center">
                -
              </span>
              <div>
                <span className="font-bold text-stone-700">Descontos Concedidos & Cupons</span>
                <p className="text-[11px] text-stone-400">Desconto de 5% no PIX e cupons promocionais aplicados</p>
              </div>
            </div>
            <span className="font-bold text-rose-700">
              - R$ {financialSummary.discountsGiven.toFixed(2)}
            </span>
          </div>

          {/* (=) Receita Líquida */}
          <div className="py-3.5 flex items-center justify-between bg-stone-50/80 px-3 rounded-xl">
            <div>
              <span className="font-extrabold text-stone-950">= Receita Operacional Líquida</span>
              <p className="text-[11px] text-stone-500">Valor líquido após descontos comerciais</p>
            </div>
            <span className="font-black text-stone-950 text-base">
              R$ {financialSummary.netRevenue.toFixed(2)}
            </span>
          </div>

          {/* (-) CMV */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">
                -
              </span>
              <div>
                <span className="font-bold text-stone-900">Custo de Mercadorias Vendidas (CMV)</span>
                <p className="text-[11px] text-stone-400">Custo de aquisição/fabricação dos itens dos pedidos</p>
              </div>
            </div>
            <span className="font-bold text-rose-700">
              - R$ {financialSummary.estimatedCostOfGoods.toFixed(2)}
            </span>
          </div>

          {/* (=) Lucro Bruto */}
          <div className="py-3.5 flex items-center justify-between bg-amber-50/60 px-3 rounded-xl border border-amber-200/50">
            <div>
              <span className="font-extrabold text-amber-950">= Lucro Bruto Operacional</span>
              <p className="text-[11px] text-amber-800">Margem de contribuição bruta: <strong>{financialSummary.grossMarginPct.toFixed(1)}%</strong></p>
            </div>
            <span className="font-black text-amber-950 text-base">
              R$ {financialSummary.grossProfit.toFixed(2)}
            </span>
          </div>

          {/* (-) Taxas de Intermediação Mercado Pago */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-800 font-black text-xs flex items-center justify-center">
                -
              </span>
              <div>
                <span className="font-bold text-stone-900">Taxas Mercado Pago (PIX / Cartões / Boleto)</span>
                <p className="text-[11px] text-stone-400">Tarifas de processamento bancário e anti-fraude</p>
              </div>
            </div>
            <span className="font-bold text-rose-700">
              - R$ {financialSummary.gatewayFees.toFixed(2)}
            </span>
          </div>

          {/* (-) Embalagem e Logística */}
          <div className="py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 font-black text-xs flex items-center justify-center">
                -
              </span>
              <div>
                <span className="font-bold text-stone-900">Custos Operacionais & Embalagens</span>
                <p className="text-[11px] text-stone-400">Caixas rígidas de presente, fitas, etiquetas e insumos</p>
              </div>
            </div>
            <span className="font-bold text-rose-700">
              - R$ {financialSummary.packagingAndLogisticsCost.toFixed(2)}
            </span>
          </div>

          {/* (=) LUCRO LÍQUIDO FINAL */}
          <div className="py-4 flex items-center justify-between bg-emerald-50 px-4 rounded-2xl border border-emerald-300">
            <div>
              <span className="font-black text-emerald-950 text-base sm:text-lg block">
                = Lucro Líquido Final da Loja
              </span>
              <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                Margem Líquida Real: <strong>{financialSummary.netMarginPct.toFixed(1)}%</strong> da receita
              </p>
            </div>
            <div className="text-right">
              <span className="font-black text-emerald-900 text-xl sm:text-2xl block">
                R$ {financialSummary.netProfit.toFixed(2)}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                Líquido no Caixa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SIMULADOR INTERATIVO DE LUCRO, PREÇO & MARGEM */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stone-950">
                Simulador de Margem & Preço de Venda
              </h3>
              <p className="text-xs text-stone-500">
                Calcule exatamente quanto sobra no seu bolso por produto vendido descontando taxas e custos
              </p>
            </div>
          </div>
          <span className="hidden sm:inline text-xs font-bold text-stone-400">
            Ferramenta para Precificação
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Inputs (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Preço de Venda */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Preço de Venda do Produto (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={simSalePrice}
                    onChange={(e) => setSimSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Custo do Produto */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Custo do Produto / CMV (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={simCostPrice}
                    onChange={(e) => setSimCostPrice(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Meio de Pagamento */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={simPaymentMethod}
                  onChange={(e) => setSimPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  <option value="pix">PIX (Taxa 0,99%)</option>
                  <option value="card_1x">Cartão 1x (Taxa 3,99%)</option>
                  <option value="card_3x">Cartão 3x (Taxa 4,89%)</option>
                  <option value="card_6x">Cartão 6x (Taxa 5,99%)</option>
                </select>
              </div>

              {/* Embalagem */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Custo Embalagem (R$)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={simPackagingCost}
                  onChange={(e) => setSimPackagingCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                />
              </div>

              {/* Frete subsidiado pela loja */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Frete Subsidiado (R$)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={simShippingSubsidized}
                  onChange={(e) => setSimShippingSubsidized(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                  placeholder="0 se o cliente pagar"
                />
              </div>
            </div>
          </div>

          {/* Results Card (5 cols) */}
          <div className="lg:col-span-5 bg-stone-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-md space-y-4">
            <div>
              <div className="flex items-center justify-between text-stone-400 text-xs font-bold mb-3 border-b border-stone-800 pb-2">
                <span>Resultado da Simulação</span>
                <span className="text-amber-400">Markup {simulationResult.markup.toFixed(2)}x</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-stone-300">
                  <span>Preço de Venda:</span>
                  <span className="font-bold text-white">R$ {simSalePrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-400">
                  <span>Custo do Produto:</span>
                  <span className="text-rose-400 font-semibold">- R$ {simCostPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-stone-400">
                  <span>Taxa Mercado Pago ({simulationResult.feeLabel}):</span>
                  <span className="text-rose-400 font-semibold">- R$ {simulationResult.gatewayFee.toFixed(2)}</span>
                </div>
                {simPackagingCost > 0 && (
                  <div className="flex items-center justify-between text-stone-400">
                    <span>Embalagem Especial:</span>
                    <span className="text-rose-400 font-semibold">- R$ {simPackagingCost.toFixed(2)}</span>
                  </div>
                )}
                {simShippingSubsidized > 0 && (
                  <div className="flex items-center justify-between text-stone-400">
                    <span>Frete Grátis Subsidiado:</span>
                    <span className="text-rose-400 font-semibold">- R$ {simShippingSubsidized.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-end justify-between">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                  Lucro Líquido no Bolso
                </span>
                <div className="text-2xl font-black text-amber-400">
                  R$ {simulationResult.netProfit.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block">
                  Margem Líquida
                </span>
                <div className={`text-lg font-black ${simulationResult.marginPct >= 25 ? "text-emerald-400" : "text-amber-400"}`}>
                  {simulationResult.marginPct.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
