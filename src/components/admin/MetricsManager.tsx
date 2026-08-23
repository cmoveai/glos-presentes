import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  TrendingUp,
  Users,
  Layers,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Package,
  Clock,
  CheckCircle2,
  Brush,
  FileCheck,
  RotateCcw,
  Truck,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { Order, Product, Coupon, UserProfile } from "../../types";
import { fetchAllCustomersAdmin } from "../../lib/firebase";

export type MetricsSubViewType =
  | "overview"
  | "products"
  | "sales_customers"
  | "visits"
  | "realtime"
  | "coupons";

interface MetricsManagerProps {
  orders: Order[];
  products: Product[];
  coupons?: Coupon[];
  onNavigateToOrders?: () => void;
  onNavigateToProducts?: () => void;
  onNavigateToCoupons?: () => void;
  onNavigateToAI?: () => void;
  subView?: MetricsSubViewType;
  onSubViewChange?: (view: MetricsSubViewType) => void;
}

type TimeRangeDays = 7 | 30 | 90;

// Formatador padrão de moeda BRL com tabular-nums
const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

// Formata data abreviada: "14 out"
const formatDateShort = (d: Date): string => {
  const day = d.getDate();
  const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${day} ${month}`;
};

// Formata data completa: "14 out, 2026"
const formatDateFull = (d: Date): string => {
  const day = d.getDate();
  const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  const year = d.getFullYear();
  return `${day} ${month}, ${year}`;
};

// Verifica com rigor se o pedido tem pagamento confirmado (receita real)
export function isPaidOrder(order: Order): boolean {
  if (order.status === "CANCELADO" || order.statusPedido === "cancelado") {
    return false;
  }
  if (
    order.statusPagamento === "recusado" ||
    order.statusPagamento === "rejeitado" ||
    order.statusPagamento === "estornado" ||
    order.statusPagamento === "aguardando_pagamento" ||
    order.paymentStatus === "recusado" ||
    order.paymentStatus === "pendente"
  ) {
    return false;
  }
  return (
    order.statusPagamento === "pago" ||
    order.statusPagamento === "aprovado" ||
    order.paymentStatus === "pago" ||
    order.status === "PAGAMENTO_CONFIRMADO" ||
    order.status === "ENVIADO" ||
    order.status === "ENTREGUE"
  );
}

// Sparkline SVG em Cobalt ultra-limpo
const CobaltSparkline: React.FC<{
  data: number[];
  width?: number;
  height?: number;
}> = ({ data, width = 72, height = 24 }) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  const padding = 2;

  const points = data
    .map((val, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-visible shrink-0"
      aria-hidden="true"
    >
      <polyline
        fill="none"
        stroke="#004AAD"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const MetricsManager: React.FC<MetricsManagerProps> = ({
  orders,
  products,
  coupons = [],
  onNavigateToOrders,
  onNavigateToProducts,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRangeDays>(30);
  const [rankingLimit, setRankingLimit] = useState<5 | 10>(5);
  const [rankingSortBy, setRankingSortBy] = useState<"revenue" | "quantity">("revenue");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);

  // Carregar lista real de clientes do Firestore para métrica de novos clientes
  useEffect(() => {
    let mounted = true;
    const loadCustomers = async () => {
      try {
        const list = await fetchAllCustomersAdmin();
        if (mounted) {
          setCustomers(list);
        }
      } catch (err) {
        console.warn("Erro ao buscar clientes no Firestore:", err);
      } finally {
        if (mounted) {
          setLoadingCustomers(false);
        }
      }
    };
    loadCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  // Datas de corte para o período atual e anterior
  const { currentStart, currentEnd, prevStart, prevEnd, dateBuckets } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    const start = new Date(now);
    start.setDate(now.getDate() - timeRange + 1);
    start.setHours(0, 0, 0, 0);

    const pEnd = new Date(start);
    pEnd.setMilliseconds(pEnd.getMilliseconds() - 1);

    const pStart = new Date(start);
    pStart.setDate(start.getDate() - timeRange);
    pStart.setHours(0, 0, 0, 0);

    // Gerar buckets diários
    const buckets: { dateKey: string; label: string; fullLabel: string; date: Date }[] = [];
    for (let i = 0; i < timeRange; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().split("T")[0];
      buckets.push({
        dateKey: key,
        label: formatDateShort(d),
        fullLabel: formatDateFull(d),
        date: d,
      });
    }

    return {
      currentStart: start,
      currentEnd: end,
      prevStart: pStart,
      prevEnd: pEnd,
      dateBuckets: buckets,
    };
  }, [timeRange]);

  // 1. Pedidos do período atual e anterior (apenas pagos para receita)
  const { currentPaidOrders, prevPaidOrders, allCurrentOrders } = useMemo(() => {
    const curPaid: Order[] = [];
    const prevPaid: Order[] = [];
    const curAll: Order[] = [];

    orders.forEach((ord) => {
      const orderDate = new Date(ord.createdAt);
      const paid = isPaidOrder(ord);

      if (orderDate >= currentStart && orderDate <= currentEnd) {
        curAll.push(ord);
        if (paid) curPaid.push(ord);
      } else if (orderDate >= prevStart && orderDate <= prevEnd) {
        if (paid) prevPaid.push(ord);
      }
    });

    return {
      currentPaidOrders: curPaid,
      prevPaidOrders: prevPaid,
      allCurrentOrders: curAll,
    };
  }, [orders, currentStart, currentEnd, prevStart, prevEnd]);

  // 2. Cálculos dos 4 Cartões de Resumo do Topo
  const {
    revenueCurrent,
    revenueDelta,
    paidOrdersCount,
    paidOrdersDelta,
    ticketMedioCurrent,
    ticketMedioDelta,
    newCustomersCount,
    newCustomersDelta,
    revenueSparkline,
    ordersSparkline,
  } = useMemo(() => {
    // Faturamento
    const revCur = currentPaidOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const revPrev = prevPaidOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    let rDelta: number | null = null;
    if (revPrev > 0) {
      rDelta = ((revCur - revPrev) / revPrev) * 100;
    } else if (revPrev === 0 && revCur > 0) {
      rDelta = 100;
    }

    // Quantidade de pedidos pagos
    const pCountCur = currentPaidOrders.length;
    const pCountPrev = prevPaidOrders.length;
    let pDelta: number | null = null;
    if (pCountPrev > 0) {
      pDelta = ((pCountCur - pCountPrev) / pCountPrev) * 100;
    } else if (pCountPrev === 0 && pCountCur > 0) {
      pDelta = 100;
    }

    // Ticket Médio
    const tmCur = pCountCur > 0 ? revCur / pCountCur : 0;
    const tmPrev = pCountPrev > 0 ? revPrev / pCountPrev : 0;
    let tmDelta: number | null = null;
    if (tmPrev > 0) {
      tmDelta = ((tmCur - tmPrev) / tmPrev) * 100;
    } else if (tmPrev === 0 && tmCur > 0) {
      tmDelta = 100;
    }

    // Novos Clientes no período
    let newCustCur = 0;
    let newCustPrev = 0;

    // Se temos a base de clientes do Firestore com createdAt
    if (customers.length > 0) {
      customers.forEach((c) => {
        if (!c.createdAt) return;
        const cd = new Date(c.createdAt);
        if (cd >= currentStart && cd <= currentEnd) newCustCur++;
        else if (cd >= prevStart && cd <= prevEnd) newCustPrev++;
      });
    } else {
      // Fallback a partir de emails únicos em pedidos
      const curEmails = new Set(
        allCurrentOrders.map((o) => o.customer?.email?.toLowerCase().trim()).filter(Boolean)
      );
      newCustCur = curEmails.size;
    }

    let ncDelta: number | null = null;
    if (newCustPrev > 0) {
      ncDelta = ((newCustCur - newCustPrev) / newCustPrev) * 100;
    } else if (newCustPrev === 0 && newCustCur > 0) {
      ncDelta = 100;
    }

    // Sparklines diários
    const revMap = new Map<string, number>();
    const countMap = new Map<string, number>();
    dateBuckets.forEach((b) => {
      revMap.set(b.dateKey, 0);
      countMap.set(b.dateKey, 0);
    });

    currentPaidOrders.forEach((o) => {
      const key = o.createdAt ? o.createdAt.split("T")[0] : "";
      if (revMap.has(key)) {
        revMap.set(key, (revMap.get(key) || 0) + (o.total || 0));
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
    });

    const revSpark = dateBuckets.map((b) => revMap.get(b.dateKey) || 0);
    const countSpark = dateBuckets.map((b) => countMap.get(b.dateKey) || 0);

    return {
      revenueCurrent: revCur,
      revenueDelta: rDelta,
      paidOrdersCount: pCountCur,
      paidOrdersDelta: pDelta,
      ticketMedioCurrent: tmCur,
      ticketMedioDelta: tmDelta,
      newCustomersCount: newCustCur,
      newCustomersDelta: ncDelta,
      revenueSparkline: revSpark,
      ordersSparkline: countSpark,
    };
  }, [
    currentPaidOrders,
    prevPaidOrders,
    allCurrentOrders,
    customers,
    currentStart,
    currentEnd,
    prevStart,
    prevEnd,
    dateBuckets,
  ]);

  // 3. Dados Diários para o Gráfico de Faturamento no Tempo
  const dailyChartData = useMemo(() => {
    const dataMap = new Map<string, { revenue: number; ordersCount: number }>();
    dateBuckets.forEach((b) => {
      dataMap.set(b.dateKey, { revenue: 0, ordersCount: 0 });
    });

    currentPaidOrders.forEach((ord) => {
      const key = ord.createdAt ? ord.createdAt.split("T")[0] : "";
      if (dataMap.has(key)) {
        const item = dataMap.get(key)!;
        item.revenue += ord.total || 0;
        item.ordersCount += 1;
      }
    });

    return dateBuckets.map((b) => {
      const values = dataMap.get(b.dateKey) || { revenue: 0, ordersCount: 0 };
      return {
        dateKey: b.dateKey,
        label: b.label,
        fullLabel: b.fullLabel,
        revenue: values.revenue,
        ordersCount: values.ordersCount,
      };
    });
  }, [dateBuckets, currentPaidOrders]);

  const maxDailyRevenue = useMemo(() => {
    const maxVal = Math.max(...dailyChartData.map((d) => d.revenue), 0);
    return maxVal > 0 ? maxVal : 100;
  }, [dailyChartData]);

  // 4. Distribuição de TODOS os Pedidos por Status Operacional
  const statusDistribution = useMemo(() => {
    const counts = {
      aguardando_pagamento: 0,
      aguardando_arquivo: 0,
      aguardando_aprovacao: 0,
      ajuste_solicitado: 0,
      em_producao: 0,
      a_despachar: 0,
      enviado: 0,
      entregue: 0,
      cancelado: 0,
    };

    orders.forEach((ord) => {
      if (ord.status === "CANCELADO" || ord.statusPedido === "cancelado") {
        counts.cancelado++;
        return;
      }

      if (ord.status === "ENTREGUE" || ord.statusPedido === "entregue") {
        counts.entregue++;
        return;
      }

      if (ord.status === "ENVIADO" || ord.statusPedido === "despachado") {
        counts.enviado++;
        return;
      }

      if (ord.statusPedido === "a_despachar") {
        counts.a_despachar++;
        return;
      }

      if (ord.statusPedido === "em_producao") {
        counts.em_producao++;
        return;
      }

      if (ord.aprovacaoMockup === "ajuste_solicitado") {
        counts.ajuste_solicitado++;
        return;
      }

      if (ord.aprovacaoMockup === "aguardando_aprovacao") {
        counts.aguardando_aprovacao++;
        return;
      }

      if (ord.statusPedido === "aguardando_arquivo") {
        counts.aguardando_arquivo++;
        return;
      }

      if (
        ord.statusPagamento === "aguardando_pagamento" ||
        ord.paymentStatus === "pendente" ||
        ord.status === "PEDIDO_REALIZADO"
      ) {
        counts.aguardando_pagamento++;
        return;
      }

      // Default fallback
      counts.a_despachar++;
    });

    const total = orders.length || 1;

    const list = [
      {
        id: "aguardando_pagamento",
        label: "Aguardando pagamento",
        count: counts.aguardando_pagamento,
        icon: Clock,
        color: "#6B6A64",
      },
      {
        id: "aguardando_arquivo",
        label: "Aguardando arquivo / foto",
        count: counts.aguardando_arquivo,
        icon: Brush,
        color: "#004AAD",
      },
      {
        id: "aguardando_aprovacao",
        label: "Aguardando aprovação de arte",
        count: counts.aguardando_aprovacao,
        icon: FileCheck,
        color: "#004AAD",
      },
      {
        id: "ajuste_solicitado",
        label: "Ajuste de arte solicitado",
        count: counts.ajuste_solicitado,
        icon: RotateCcw,
        color: "#9B2C2C",
      },
      {
        id: "em_producao",
        label: "Em produção personalizada",
        count: counts.em_producao,
        icon: Package,
        color: "#004AAD",
      },
      {
        id: "a_despachar",
        label: "A despachar / embalagem",
        count: counts.a_despachar,
        icon: ShoppingBag,
        color: "#004AAD",
      },
      {
        id: "enviado",
        label: "Enviado / em trânsito",
        count: counts.enviado,
        icon: Truck,
        color: "#004AAD",
      },
      {
        id: "entregue",
        label: "Entregue ao cliente",
        count: counts.entregue,
        icon: CheckCircle2,
        color: "#0F7A4F",
      },
      {
        id: "cancelado",
        label: "Cancelado / estornado",
        count: counts.cancelado,
        icon: XCircle,
        color: "#9B2C2C",
      },
    ];

    return {
      list,
      totalOrders: orders.length,
    };
  }, [orders]);

  // 5. Ranking dos Produtos Mais Vendidos no Período
  const topProductsRanking = useMemo(() => {
    const salesMap = new Map<
      string,
      {
        productId: string;
        name: string;
        quantity: number;
        revenue: number;
        imageUrl?: string;
        categoryName?: string;
        productType?: string;
        price: number;
      }
    >();

    // Criar mapa de lookup rápido de produtos
    const productCatalogMap = new Map<string, Product>();
    products.forEach((p) => {
      productCatalogMap.set(p.id, p);
      if (p.slug) productCatalogMap.set(p.slug, p);
    });

    currentPaidOrders.forEach((ord) => {
      ord.items?.forEach((item) => {
        const pId = item.productId || item.id || item.productName;
        if (!pId) return;

        const qty = item.quantity || 1;
        const itemPrice = item.price || 0;
        const itemRev = itemPrice * qty;

        const catalogProd = productCatalogMap.get(item.productId || "") || productCatalogMap.get(item.id || "");

        const existing = salesMap.get(pId) || {
          productId: pId,
          name: item.productName || catalogProd?.name || "Produto",
          quantity: 0,
          revenue: 0,
          imageUrl: item.imageUrl || catalogProd?.images?.[0] || "",
          categoryName: catalogProd?.categoryName || catalogProd?.category || "Presentes",
          productType: catalogProd?.productType || item.productType || "simples",
          price: itemPrice || catalogProd?.price || 0,
        };

        existing.quantity += qty;
        existing.revenue += itemRev;
        if (!existing.imageUrl && catalogProd?.images?.[0]) {
          existing.imageUrl = catalogProd.images[0];
        }

        salesMap.set(pId, existing);
      });
    });

    const list = Array.from(salesMap.values());

    if (rankingSortBy === "revenue") {
      list.sort((a, b) => b.revenue - a.revenue);
    } else {
      list.sort((a, b) => b.quantity - a.quantity);
    }

    return list.slice(0, rankingLimit);
  }, [currentPaidOrders, products, rankingSortBy, rankingLimit]);

  // 6. Split por Natureza: Revenda vs Personalizável
  const splitNature = useMemo(() => {
    let personalizableRev = 0;
    let personalizableQty = 0;
    let retailRev = 0;
    let retailQty = 0;

    const productCatalogMap = new Map<string, Product>();
    products.forEach((p) => {
      productCatalogMap.set(p.id, p);
    });

    currentPaidOrders.forEach((ord) => {
      ord.items?.forEach((item) => {
        const qty = item.quantity || 1;
        const price = item.price || 0;
        const total = price * qty;

        const catalogProd = productCatalogMap.get(item.productId || "");
        const isCustom =
          item.productType === "personalizavel" ||
          Boolean(item.personalization) ||
          catalogProd?.productType === "personalizavel" ||
          Boolean(catalogProd?.customizationOptions?.allowPhoto) ||
          Boolean(catalogProd?.customizationOptions?.allowName);

        if (isCustom) {
          personalizableRev += total;
          personalizableQty += qty;
        } else {
          retailRev += total;
          retailQty += qty;
        }
      });
    });

    const totalRev = personalizableRev + retailRev;
    const personalizablePercent = totalRev > 0 ? (personalizableRev / totalRev) * 100 : 0;
    const retailPercent = totalRev > 0 ? (retailRev / totalRev) * 100 : 0;

    return {
      totalRev,
      personalizableRev,
      personalizableQty,
      personalizablePercent,
      retailRev,
      retailQty,
      retailPercent,
    };
  }, [currentPaidOrders, products]);

  // SVG Chart Dimensions & Calculations
  const chartWidth = 720;
  const chartHeight = 200;
  const chartPaddingTop = 20;
  const chartPaddingBottom = 30;
  const chartPaddingLeft = 10;
  const chartPaddingRight = 10;

  const chartPoints = useMemo(() => {
    const usableWidth = chartWidth - chartPaddingLeft - chartPaddingRight;
    const usableHeight = chartHeight - chartPaddingTop - chartPaddingBottom;
    const step = dailyChartData.length > 1 ? usableWidth / (dailyChartData.length - 1) : usableWidth;

    return dailyChartData.map((d, index) => {
      const x = chartPaddingLeft + index * step;
      const y =
        maxDailyRevenue > 0
          ? chartHeight - chartPaddingBottom - (d.revenue / maxDailyRevenue) * usableHeight
          : chartHeight - chartPaddingBottom;
      return { x, y, data: d };
    });
  }, [dailyChartData, maxDailyRevenue]);

  const svgPathD = useMemo(() => {
    if (chartPoints.length === 0) return "";
    let path = `M ${chartPoints[0].x},${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const current = chartPoints[i];
      const next = chartPoints[i + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
    }
    return path;
  }, [chartPoints]);

  const svgAreaD = useMemo(() => {
    if (!svgPathD || chartPoints.length === 0) return "";
    const lastPoint = chartPoints[chartPoints.length - 1];
    const firstPoint = chartPoints[0];
    return `${svgPathD} L ${lastPoint.x},${chartHeight - chartPaddingBottom} L ${firstPoint.x},${
      chartHeight - chartPaddingBottom
    } Z`;
  }, [svgPathD, chartPoints]);

  return (
    <div id="estatisticas-dashboard" className="w-full space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* CABEÇALHO COM SELETOR DE PERÍODO */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#D6D3CC] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#004AAD]" />
            <h2 className="text-xl font-medium text-[#272727] tracking-tight">
              Estatísticas da Operação
            </h2>
          </div>
          <p className="text-xs font-normal text-[#6B6A64] mt-1">
            Pulso de vendas baseado exclusivamente em pedidos confirmados do Firestore.
          </p>
        </div>

        {/* Seletor de Período: 7 / 30 / 90 dias */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-normal text-[#6B6A64] mr-1 hidden sm:inline">
            Período:
          </span>
          <div className="inline-flex bg-[#F4F3EF] p-1 rounded-[8px] border border-[#D6D3CC]">
            <button
              type="button"
              onClick={() => setTimeRange(7)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors cursor-pointer tabular-nums ${
                timeRange === 7
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8]"
              }`}
            >
              7 dias
            </button>
            <button
              type="button"
              onClick={() => setTimeRange(30)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors cursor-pointer tabular-nums ${
                timeRange === 30
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8]"
              }`}
            >
              30 dias
            </button>
            <button
              type="button"
              onClick={() => setTimeRange(90)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors cursor-pointer tabular-nums ${
                timeRange === 90
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8]"
              }`}
            >
              90 dias
            </button>
          </div>
        </div>
      </div>

      {/* Rótulo do intervalo de datas selecionado */}
      <div className="flex items-center justify-between text-xs text-[#9B998F] px-1 -mt-2">
        <span className="tabular-nums">
          Intervalo: {formatDateFull(currentStart)} — {formatDateFull(currentEnd)}
        </span>
        <span className="tabular-nums hidden sm:inline">
          Comparado a: {formatDateFull(prevStart)} — {formatDateFull(prevEnd)}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. CARTÕES DE RESUMO (TOPO) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento Confirmado */}
        <div
          id="kpi-faturamento"
          className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-4 flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-normal text-[#6B6A64] block">
              Faturamento no período
            </span>
            <div className="text-2xl font-medium text-[#272727] tabular-nums tracking-tight mt-1">
              {formatCurrency(revenueCurrent)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D6D3CC] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              {revenueDelta !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${
                    revenueDelta >= 0 ? "text-[#0F7A4F]" : "text-[#9B2C2C]"
                  }`}
                >
                  {revenueDelta >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {revenueDelta >= 0 ? "+" : ""}
                  {revenueDelta.toFixed(1).replace(".", ",")}%
                </span>
              ) : (
                <span className="text-[#9B998F] text-[11px]">Sem período anterior</span>
              )}
              <span className="text-[11px] text-[#9B998F]">vs. anterior</span>
            </div>
            <CobaltSparkline data={revenueSparkline} />
          </div>
        </div>

        {/* Card 2: Pedidos Pagos */}
        <div
          id="kpi-pedidos-pagos"
          className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-4 flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-normal text-[#6B6A64] block">
              Pedidos pagos
            </span>
            <div className="text-2xl font-medium text-[#272727] tabular-nums tracking-tight mt-1">
              {paidOrdersCount}{" "}
              <span className="text-xs font-normal text-[#9B998F]">
                {paidOrdersCount === 1 ? "pedido" : "pedidos"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D6D3CC] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              {paidOrdersDelta !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${
                    paidOrdersDelta >= 0 ? "text-[#0F7A4F]" : "text-[#9B2C2C]"
                  }`}
                >
                  {paidOrdersDelta >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {paidOrdersDelta >= 0 ? "+" : ""}
                  {paidOrdersDelta.toFixed(1).replace(".", ",")}%
                </span>
              ) : (
                <span className="text-[#9B998F] text-[11px]">Sem período anterior</span>
              )}
              <span className="text-[11px] text-[#9B998F]">vs. anterior</span>
            </div>
            <CobaltSparkline data={ordersSparkline} />
          </div>
        </div>

        {/* Card 3: Ticket Médio */}
        <div
          id="kpi-ticket-medio"
          className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-4 flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-normal text-[#6B6A64] block">
              Ticket médio
            </span>
            <div className="text-2xl font-medium text-[#272727] tabular-nums tracking-tight mt-1">
              {formatCurrency(ticketMedioCurrent)}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D6D3CC] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              {ticketMedioDelta !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${
                    ticketMedioDelta >= 0 ? "text-[#0F7A4F]" : "text-[#9B2C2C]"
                  }`}
                >
                  {ticketMedioDelta >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {ticketMedioDelta >= 0 ? "+" : ""}
                  {ticketMedioDelta.toFixed(1).replace(".", ",")}%
                </span>
              ) : (
                <span className="text-[#9B998F] text-[11px]">faturamento ÷ pagos</span>
              )}
              <span className="text-[11px] text-[#9B998F]">vs. anterior</span>
            </div>
          </div>
        </div>

        {/* Card 4: Novos Clientes */}
        <div
          id="kpi-novos-clientes"
          className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-4 flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-normal text-[#6B6A64] block">
              Novos clientes no período
            </span>
            <div className="text-2xl font-medium text-[#272727] tabular-nums tracking-tight mt-1">
              {newCustomersCount}{" "}
              <span className="text-xs font-normal text-[#9B998F]">
                {newCustomersCount === 1 ? "cliente" : "clientes"}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#D6D3CC] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              {newCustomersDelta !== null ? (
                <span
                  className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${
                    newCustomersDelta >= 0 ? "text-[#0F7A4F]" : "text-[#9B2C2C]"
                  }`}
                >
                  {newCustomersDelta >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5" />
                  )}
                  {newCustomersDelta >= 0 ? "+" : ""}
                  {newCustomersDelta.toFixed(1).replace(".", ",")}%
                </span>
              ) : (
                <span className="text-[#9B998F] text-[11px]">
                  {customers.length > 0
                    ? `${customers.length} total na base`
                    : "Base em formação"}
                </span>
              )}
              <span className="text-[11px] text-[#9B998F]">no período</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRÁFICO DE FATURAMENTO NO TEMPO (COBALT MINIMALISTA) */}
      {/* ========================================================================= */}
      <div
        id="grafico-faturamento"
        className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 relative"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-medium text-[#272727]">
              Faturamento no Tempo
            </h3>
            <p className="text-xs text-[#6B6A64] mt-0.5">
              Receita diária confirmada ao longo dos últimos {timeRange} dias.
            </p>
          </div>
          <div className="text-xs text-[#6B6A64] tabular-nums">
            Total do período:{" "}
            <span className="font-medium text-[#272727]">
              {formatCurrency(revenueCurrent)}
            </span>
          </div>
        </div>

        {/* Gráfico SVG ou Estado Vazio */}
        {revenueCurrent === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-10 h-10 rounded-full bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-center text-[#9B998F] mb-3">
              <TrendingUp className="w-5 h-5 text-[#9B998F]" />
            </div>
            <p className="text-sm font-medium text-[#272727]">
              Sem vendas confirmadas no período
            </p>
            <p className="text-xs text-[#6B6A64] max-w-md mt-1">
              Os pontos de faturamento surgirão aqui em tempo real assim que os pedidos forem
              pagos via PIX ou Cartão de Crédito.
            </p>
          </div>
        ) : (
          <div className="w-full">
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-48 sm:h-56 overflow-visible select-none"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="cobaltGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#004AAD" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#004AAD" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Linhas de grade horizontais discretas */}
                <line
                  x1={chartPaddingLeft}
                  y1={chartPaddingTop}
                  x2={chartWidth - chartPaddingRight}
                  y2={chartPaddingTop}
                  stroke="#D6D3CC"
                  strokeDasharray="2 2"
                  strokeWidth="0.75"
                />
                <line
                  x1={chartPaddingLeft}
                  y1={(chartHeight - chartPaddingBottom + chartPaddingTop) / 2}
                  x2={chartWidth - chartPaddingRight}
                  y2={(chartHeight - chartPaddingBottom + chartPaddingTop) / 2}
                  stroke="#D6D3CC"
                  strokeDasharray="2 2"
                  strokeWidth="0.75"
                />
                <line
                  x1={chartPaddingLeft}
                  y1={chartHeight - chartPaddingBottom}
                  x2={chartWidth - chartPaddingRight}
                  y2={chartHeight - chartPaddingBottom}
                  stroke="#D6D3CC"
                  strokeWidth="1"
                />

                {/* Área preenchida */}
                {svgAreaD && <path d={svgAreaD} fill="url(#cobaltGradient)" />}

                {/* Linha traçada */}
                {svgPathD && (
                  <path
                    d={svgPathD}
                    fill="none"
                    stroke="#004AAD"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Pontos interativos */}
                {chartPoints.map((pt, idx) => (
                  <g key={pt.data.dateKey}>
                    {pt.data.revenue > 0 && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPointIndex === idx ? 4.5 : 3}
                        fill="#004AAD"
                        stroke="#F4F3EF"
                        strokeWidth="1.5"
                        className="transition-all duration-150"
                      />
                    )}
                    {/* Área de toque/hover invisível para cada barra */}
                    <rect
                      x={pt.x - (chartWidth / dailyChartData.length) / 2}
                      y={0}
                      width={chartWidth / dailyChartData.length}
                      height={chartHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onMouseLeave={() => setHoveredPointIndex(null)}
                    />
                  </g>
                ))}
              </svg>

              {/* Tooltip flutuante de Hover */}
              {hoveredPointIndex !== null && chartPoints[hoveredPointIndex] && (
                <div
                  className="absolute pointer-events-none bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] px-3 py-2 text-xs shadow-xs z-10"
                  style={{
                    left: `${Math.min(
                      Math.max(10, (chartPoints[hoveredPointIndex].x / chartWidth) * 100),
                      85
                    )}%`,
                    top: "12px",
                    transform: "translateX(-50%)",
                  }}
                >
                  <div className="font-normal text-[#6B6A64]">
                    {chartPoints[hoveredPointIndex].data.fullLabel}
                  </div>
                  <div className="font-medium text-[#272727] tabular-nums mt-0.5">
                    {formatCurrency(chartPoints[hoveredPointIndex].data.revenue)}
                  </div>
                  <div className="text-[11px] text-[#9B998F] tabular-nums">
                    {chartPoints[hoveredPointIndex].data.ordersCount}{" "}
                    {chartPoints[hoveredPointIndex].data.ordersCount === 1
                      ? "pedido pago"
                      : "pedidos pagos"}
                  </div>
                </div>
              )}
            </div>

            {/* Eixo de Datas Inferior */}
            <div className="flex items-center justify-between text-[11px] text-[#9B998F] mt-2 px-1 tabular-nums">
              <span>{dailyChartData[0]?.label}</span>
              {dailyChartData.length > 2 && (
                <span className="hidden sm:inline">
                  {dailyChartData[Math.floor(dailyChartData.length / 2)]?.label}
                </span>
              )}
              <span>{dailyChartData[dailyChartData.length - 1]?.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3 & 5. GRID DE 2 COLUNAS: PEDIDOS POR STATUS & SPLIT POR NATUREZA */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloco 3: Pedidos por Status Operacional */}
        <div
          id="pedidos-por-status"
          className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-[#272727]">
                Pedidos por Status Operacional
              </h3>
              <span className="text-xs text-[#9B998F] tabular-nums">
                {statusDistribution.totalOrders}{" "}
                {statusDistribution.totalOrders === 1 ? "pedido" : "pedidos"} total
              </span>
            </div>
            <p className="text-xs text-[#6B6A64] mb-4">
              Acompanhamento de gargalos da esteira de presentes e personalização.
            </p>

            {statusDistribution.totalOrders === 0 ? (
              <div className="py-8 text-center text-xs text-[#9B998F]">
                Nenhum pedido cadastrado na loja até o momento.
              </div>
            ) : (
              <div className="space-y-3">
                {statusDistribution.list.map((item) => {
                  const Icon = item.icon;
                  const percent =
                    statusDistribution.totalOrders > 0
                      ? (item.count / statusDistribution.totalOrders) * 100
                      : 0;

                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[#272727]">
                          <Icon className="w-3.5 h-3.5 text-[#6B6A64]" />
                          <span>{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="font-medium text-[#272727]">{item.count}</span>
                          <span className="text-[#9B998F] text-[11px]">
                            ({percent.toFixed(0)}%)
                          </span>
                        </div>
                      </div>

                      {/* Barra de progresso horizontal flat */}
                      <div className="w-full h-1.5 bg-[#EEEDE8] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: item.count > 0 ? item.color : "transparent",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {onNavigateToOrders && (
            <div className="mt-5 pt-3 border-t border-[#D6D3CC] flex justify-end">
              <button
                type="button"
                onClick={onNavigateToOrders}
                className="text-xs font-medium text-[#004AAD] hover:underline flex items-center gap-1 cursor-pointer"
              >
                Gerenciar todos os pedidos
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bloco 5: Split por Natureza (Revenda vs Personalizável) */}
        <div
          id="split-natureza"
          className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-[#272727]">
                Split por Natureza de Produto
              </h3>
              <span className="text-xs text-[#9B998F]">
                Últimos {timeRange} dias
              </span>
            </div>
            <p className="text-xs text-[#6B6A64] mb-4">
              Identifica se a receita está sendo puxada por personalizações ou revenda.
            </p>

            {splitNature.totalRev === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                <p className="text-xs text-[#9B998F]">
                  Ainda sem itens faturados no período para calcular o split.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Barra de proporção splitada */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#6B6A64]">
                    <span>Proporção de Faturamento</span>
                    <span className="tabular-nums">
                      {splitNature.personalizablePercent.toFixed(0)}% Personalizáveis ·{" "}
                      {splitNature.retailPercent.toFixed(0)}% Revenda
                    </span>
                  </div>
                  <div className="w-full h-3 bg-[#EEEDE8] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#004AAD] transition-all duration-300"
                      style={{ width: `${splitNature.personalizablePercent}%` }}
                      title={`Personalizáveis: ${splitNature.personalizablePercent.toFixed(1)}%`}
                    />
                    <div
                      className="h-full bg-[#9B998F] transition-all duration-300"
                      style={{ width: `${splitNature.retailPercent}%` }}
                      title={`Revenda: ${splitNature.retailPercent.toFixed(1)}%`}
                    />
                  </div>
                </div>

                {/* Cards Comparativos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {/* Card Personalizáveis */}
                  <div className="bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] p-3.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#004AAD]" />
                      <span className="text-xs font-medium text-[#272727]">
                        Personalizáveis
                      </span>
                    </div>
                    <div className="text-lg font-medium text-[#272727] tabular-nums">
                      {formatCurrency(splitNature.personalizableRev)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6B6A64] mt-1 tabular-nums">
                      <span>{splitNature.personalizablePercent.toFixed(1)}% do total</span>
                      <span>{splitNature.personalizableQty} itens</span>
                    </div>
                  </div>

                  {/* Card Revenda / Pronta Entrega */}
                  <div className="bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] p-3.5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#9B998F]" />
                      <span className="text-xs font-medium text-[#272727]">
                        Pronta Entrega / Revenda
                      </span>
                    </div>
                    <div className="text-lg font-medium text-[#272727] tabular-nums">
                      {formatCurrency(splitNature.retailRev)}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#6B6A64] mt-1 tabular-nums">
                      <span>{splitNature.retailPercent.toFixed(1)}% do total</span>
                      <span>{splitNature.retailQty} itens</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-[#D6D3CC] text-[11px] text-[#9B998F]">
            Produtos com upload de fotos ou gravação de nomes são classificados como Personalizáveis.
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TOP PRODUTOS MAIS VENDIDOS NO PERÍODO */}
      {/* ========================================================================= */}
      <div
        id="top-produtos-ranking"
        className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#D6D3CC]">
          <div>
            <h3 className="text-sm font-medium text-[#272727]">
              Top Produtos Mais Vendidos
            </h3>
            <p className="text-xs text-[#6B6A64] mt-0.5">
              Itens com melhor desempenho em pedidos pagos nos últimos {timeRange} dias.
            </p>
          </div>

          {/* Filtros e Toggles de Ordenação */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle: Por Receita vs Por Quantidade */}
            <div className="inline-flex bg-[#EEEDE8] p-0.5 rounded-[6px] border border-[#D6D3CC]">
              <button
                type="button"
                onClick={() => setRankingSortBy("revenue")}
                className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  rankingSortBy === "revenue"
                    ? "bg-[#004AAD] text-white"
                    : "text-[#6B6A64] hover:text-[#272727]"
                }`}
              >
                Por Receita (R$)
              </button>
              <button
                type="button"
                onClick={() => setRankingSortBy("quantity")}
                className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer ${
                  rankingSortBy === "quantity"
                    ? "bg-[#004AAD] text-white"
                    : "text-[#6B6A64] hover:text-[#272727]"
                }`}
              >
                Por Quantidade
              </button>
            </div>

            {/* Seletor Top 5 vs Top 10 */}
            <div className="inline-flex bg-[#EEEDE8] p-0.5 rounded-[6px] border border-[#D6D3CC]">
              <button
                type="button"
                onClick={() => setRankingLimit(5)}
                className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer tabular-nums ${
                  rankingLimit === 5
                    ? "bg-[#004AAD] text-white"
                    : "text-[#6B6A64] hover:text-[#272727]"
                }`}
              >
                Top 5
              </button>
              <button
                type="button"
                onClick={() => setRankingLimit(10)}
                className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer tabular-nums ${
                  rankingLimit === 10
                    ? "bg-[#004AAD] text-white"
                    : "text-[#6B6A64] hover:text-[#272727]"
                }`}
              >
                Top 10
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Ranking ou Estado Vazio Honesto */}
        {topProductsRanking.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center px-4">
            <div className="w-10 h-10 rounded-full bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-center text-[#9B998F] mb-3">
              <Package className="w-5 h-5 text-[#9B998F]" />
            </div>
            <p className="text-sm font-medium text-[#272727]">
              Nenhum produto vendido no período
            </p>
            <p className="text-xs text-[#6B6A64] max-w-md mt-1">
              Assim que os primeiros pedidos forem confirmados, o ranking detalhado por receita e
              volume de itens vendidos aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#D6D3CC]">
            {topProductsRanking.map((prod, index) => (
              <div
                key={prod.productId || index}
                className="py-3 flex items-center justify-between gap-4 hover:bg-[#EEEDE8] px-2 rounded-[6px] transition-colors"
              >
                {/* Posição + Imagem + Nome */}
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-[#6B6A64] tabular-nums w-5 text-center shrink-0">
                    #{index + 1}
                  </span>

                  <div className="w-11 h-11 rounded-[6px] overflow-hidden bg-[#EEEDE8] border border-[#D6D3CC] shrink-0">
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9B998F]">
                        <Package className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#272727] truncate">
                        {prod.name}
                      </span>
                      {prod.productType === "personalizavel" && (
                        <span className="text-[10px] text-[#004AAD] bg-[#EEEDE8] border border-[#D6D3CC] px-1.5 py-0.5 rounded-[4px] shrink-0">
                          Personalizável
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#9B998F] block truncate mt-0.5">
                      {prod.categoryName}
                    </span>
                  </div>
                </div>

                {/* Quantidade e Receita Gerada */}
                <div className="flex items-center gap-6 shrink-0 text-right">
                  <div className="text-xs tabular-nums">
                    <span className="font-medium text-[#272727] block">
                      {prod.quantity} un.
                    </span>
                    <span className="text-[11px] text-[#9B998F]">vendidas</span>
                  </div>

                  <div className="text-xs tabular-nums min-w-[90px]">
                    <span className="font-medium text-[#272727] block">
                      {formatCurrency(prod.revenue)}
                    </span>
                    <span className="text-[11px] text-[#9B998F]">receita bruta</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {onNavigateToProducts && (
          <div className="mt-4 pt-3 border-t border-[#D6D3CC] flex justify-end">
            <button
              type="button"
              onClick={onNavigateToProducts}
              className="text-xs font-medium text-[#004AAD] hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver catálogo de produtos
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
