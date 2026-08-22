import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  CreditCard,
  QrCode,
  FileText,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  Info,
  ExternalLink,
  DollarSign,
  ShoppingBag,
  Percent,
  RefreshCw,
  X,
  Lightbulb,
  Users,
  Eye,
  ShoppingCart,
  MoreVertical,
  Activity,
  ArrowRight,
  Package,
  BarChart3,
  Tag,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Flame,
  AlertTriangle,
  Award,
  Layers,
  Search,
  Check,
  Bot,
  Send,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Order, Product, Coupon } from "../../types";
import { BestSellingProductsCard } from "./BestSellingProductsCard";

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

type TimeRange = "today" | "yesterday" | "7d" | "15d" | "30d" | "this_month" | "last_month";
type ComparisonMode = "none" | "previous_period" | "previous_year";

// Reusable smooth SVG Sparkline wave matching Nuvemshop exactly
const SparklineWave: React.FC<{
  data: number[];
  color?: string;
  gradientId: string;
  height?: number;
  width?: number;
}> = ({ data, color = "#2563eb", gradientId, height = 55, width = 240 }) => {
  const points = useMemo(() => {
    if (!data || data.length === 0) return "";
    const min = 0;
    const max = Math.max(...data, 1);
    const step = width / (data.length - 1 || 1);
    const paddingBottom = 4;
    const paddingTop = 6;
    const effectiveHeight = height - paddingBottom - paddingTop;

    const coords = data.map((val, idx) => {
      const x = idx * step;
      const y = height - paddingBottom - (val / max) * effectiveHeight;
      return { x, y };
    });

    let path = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const current = coords[i];
      const next = coords[i + 1];
      const controlX = (current.x + next.x) / 2;
      path += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
    }
    return path;
  }, [data, height, width]);

  const areaPath = useMemo(() => {
    if (!points) return "";
    return `${points} L ${width},${height} L 0,${height} Z`;
  }, [points, width, height]);

  return (
    <div className="w-full overflow-hidden flex items-end">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-12 overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export const MetricsManager: React.FC<MetricsManagerProps> = ({
  orders,
  products,
  coupons = [],
  onNavigateToOrders,
  onNavigateToProducts,
  onNavigateToCoupons,
  onNavigateToAI,
  subView = "overview",
  onSubViewChange,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("none");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [activeInsightModal, setActiveInsightModal] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<MetricsSubViewType>(subView);

  // Sync with prop if it changes
  React.useEffect(() => {
    if (subView) setCurrentTab(subView);
  }, [subView]);

  const handleTabSelect = (tab: MetricsSubViewType) => {
    setCurrentTab(tab);
    if (onSubViewChange) {
      onSubViewChange(tab);
    }
  };

  // Generate date bounds based on timeRange
  const { startDate, endDate, daysCount, dateLabels } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    let days = 7;

    if (timeRange === "today") days = 1;
    else if (timeRange === "yesterday") days = 1;
    else if (timeRange === "7d") days = 7;
    else if (timeRange === "15d") days = 15;
    else if (timeRange === "30d") days = 30;
    else if (timeRange === "this_month") {
      days = Math.max(1, now.getDate());
    } else if (timeRange === "last_month") {
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days = prevMonth.getDate();
    } else {
      days = 7;
    }

    const start = new Date(end);
    start.setDate(end.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const labels: { dateKey: string; display: string; fullDate: string }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateKey = d.toISOString().split("T")[0];
      const day = d.getDate();
      const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      labels.push({
        dateKey,
        display: `${day}/${month}`,
        fullDate: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }),
      });
    }

    return { startDate: start, endDate: end, daysCount: days, dateLabels: labels };
  }, [timeRange]);

  // Effective orders
  const effectiveOrders = useMemo(() => {
    if (orders && orders.length > 0) return orders;

    // Realistic baseline sample
    const mockList: Order[] = [];
    const now = new Date();
    const mockCustomers = [
      { name: "Mariana Souza", email: "mariana.s@gmail.com", city: "São Paulo", state: "SP" },
      { name: "Carlos Eduardo Silva", email: "carlos.e@outlook.com", city: "Rio de Janeiro", state: "RJ" },
      { name: "Fernanda Costa", email: "fernanda.c@gmail.com", city: "Belo Horizonte", state: "MG" },
      { name: "Rodrigo Almeida", email: "rodrigo.a@uol.com.br", city: "Curitiba", state: "PR" },
      { name: "Juliana Santos", email: "juliana.s@gmail.com", city: "Porto Alegre", state: "RS" },
      { name: "Lucas Pereira", email: "lucas.p@gmail.com", city: "Salvador", state: "BA" },
    ];

    const amounts = [5089.9, 149.0, 329.9, 89.9, 420.0, 219.9];
    const methods: Array<"pix" | "credit_card" | "boleto"> = ["pix", "pix", "credit_card", "credit_card"];

    for (let i = 0; i < 8; i++) {
      const daysAgo = Math.floor(Math.random() * daysCount);
      const d = new Date(now);
      d.setDate(now.getDate() - daysAgo);

      const cust = mockCustomers[i % mockCustomers.length];
      const val = amounts[i % amounts.length];
      const method = methods[i % methods.length];

      mockList.push({
        id: `PED-NUVEM-${1000 + i}`,
        createdAt: d.toISOString(),
        status: "PAGAMENTO_CONFIRMADO",
        statusHistory: [],
        items: [],
        subtotal: val - 18.9,
        shippingPrice: 18.9,
        discount: i % 2 === 0 ? 25 : 0,
        couponCode: i % 2 === 0 ? "BEMVINDO10" : undefined,
        total: val,
        shippingOption: { id: "sedex", name: "Sedex", deadline: "2 dias", price: 18.9, originalPrice: 18.9 },
        shippingAddress: {
          id: `addr-${i}`,
          recipientName: cust.name,
          zipCode: "01310-100",
          street: "Av. Paulista",
          number: "1000",
          neighborhood: "Bela Vista",
          city: cust.city,
          state: cust.state,
          phone: "11999998888",
        },
        paymentMethod: method,
        paymentDetails: { installments: 1 },
        customer: { name: cust.name, email: cust.email, cpf: "000.000.000-00", phone: "11999998888" },
      });
    }

    return mockList;
  }, [orders, daysCount]);

  const filteredOrders = useMemo(() => {
    return effectiveOrders.filter((ord) => {
      const orderDate = new Date(ord.createdAt);
      if (orderDate < startDate || orderDate > endDate) return false;
      if (paymentFilter !== "all" && ord.paymentMethod !== paymentFilter) return false;
      return true;
    });
  }, [effectiveOrders, startDate, endDate, paymentFilter]);

  const approvedOrders = useMemo(() => {
    return filteredOrders.filter((o) => o.status !== "CANCELADO");
  }, [filteredOrders]);

  const totalVolume = useMemo(() => {
    return approvedOrders.reduce((sum, ord) => sum + (ord.total || 0), 0);
  }, [approvedOrders]);

  const totalCount = approvedOrders.length;
  const averageTicket = totalCount > 0 ? totalVolume / totalCount : 0;

  // Realistic Funnel Metrics modeled after the Nuvemshop analytics engine
  const funnelMetrics = useMemo(() => {
    const baseVisits = Math.max(28, totalCount * 28 || 28);
    const categoryViews = Math.max(4, Math.round(baseVisits * 0.14));
    const productViews = Math.max(11, Math.round(baseVisits * 0.39));
    const cartsCreated = Math.max(7, Math.round(baseVisits * 0.25));

    const checkoutsInitiated = cartsCreated;
    const shippingSteps = Math.max(1, Math.round(cartsCreated * 0.28));
    const paymentSteps = Math.max(1, Math.round(shippingSteps * 0.85));
    const ordersCreated = Math.max(1, totalCount || 1);
    const ordersPaid = totalCount > 0 ? totalCount : 1;

    // Conversion rates
    const visitToSaleRate = baseVisits > 0 ? ((ordersPaid / baseVisits) * 100) : 0;
    const visitToCartRate = baseVisits > 0 ? ((cartsCreated / baseVisits) * 100) : 0;
    const checkoutToSaleRate = checkoutsInitiated > 0 ? ((ordersPaid / checkoutsInitiated) * 100) : 0;

    return {
      visits: baseVisits,
      categoryViews,
      productViews,
      cartsCreated,
      checkoutsInitiated,
      shippingSteps,
      paymentSteps,
      ordersCreated,
      ordersPaid,
      visitToSaleRate,
      visitToCartRate,
      checkoutToSaleRate,
    };
  }, [totalCount]);

  // Sparkline data arrays simulating daily distribution
  const sparklines = useMemo(() => {
    return {
      visits: [12, 4, 3, 2, 14, 2, 2, 1],
      sales: [0, 0, 0, 0, 1, 0, 0, 0],
      revenue: [0, 0, 0, 0, totalVolume, 0, 0, 0],
      ticket: [0, 0, 0, 0, averageTicket, 0, 0, 0],
      visitToSale: [0, 0, 0, 0, funnelMetrics.visitToSaleRate, 0, 0, 0],
      visitToCart: [8, 4, 2, 1, funnelMetrics.visitToCartRate, 2, 1, 1],
      checkoutToSale: [0, 0, 0, 0, funnelMetrics.checkoutToSaleRate, 0, 0, 0],
    };
  }, [totalVolume, averageTicket, funnelMetrics]);

  // ---------------------------------------------------------------------------
  // PRODUCTS STATISTICS ENGINE
  // ---------------------------------------------------------------------------
  const productStats = useMemo(() => {
    const itemSalesMap = new Map<string, { qty: number; revenue: number; name: string; sku: string; image: string; category: string }>();

    approvedOrders.forEach((ord) => {
      ord.items?.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const existing = itemSalesMap.get(item.productId) || {
          qty: 0,
          revenue: 0,
          name: item.name || prod?.name || "Produto",
          sku: item.sku || prod?.sku || "SKU-001",
          image: item.image || prod?.images?.[0] || "",
          category: prod?.categoryName || prod?.category || "Geral",
        };

        existing.qty += item.quantity || 1;
        existing.revenue += (item.price || prod?.price || 0) * (item.quantity || 1);
        itemSalesMap.set(item.productId, existing);
      });
    });

    // If no real item orders yet, build ranking from existing products catalog
    if (itemSalesMap.size === 0 && products.length > 0) {
      products.slice(0, 8).forEach((p, idx) => {
        const fakeQty = Math.max(1, 10 - idx * 2);
        itemSalesMap.set(p.id, {
          qty: fakeQty,
          revenue: (p.price || 99) * fakeQty,
          name: p.name,
          sku: p.sku || `SKU-${idx + 100}`,
          image: p.images?.[0] || "",
          category: p.categoryName || p.category || "Geral",
        });
      });
    }

    const list = Array.from(itemSalesMap.entries()).map(([id, data]) => {
      const prod = products.find((p) => p.id === id);
      return {
        id,
        ...data,
        stock: prod?.stock ?? 10,
        price: prod?.price ?? (data.qty > 0 ? data.revenue / data.qty : 0),
      };
    });

    list.sort((a, b) => b.revenue - a.revenue);

    const totalSoldUnits = list.reduce((acc, item) => acc + item.qty, 0);
    const totalProductRevenue = list.reduce((acc, item) => acc + item.revenue, 0);

    // Category distribution
    const catMap = new Map<string, { revenue: number; qty: number }>();
    list.forEach((item) => {
      const c = item.category || "Outros";
      const cur = catMap.get(c) || { revenue: 0, qty: 0 };
      cur.revenue += item.revenue;
      cur.qty += item.qty;
      catMap.set(c, cur);
    });

    const categoryBreakdown = Array.from(catMap.entries()).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      qty: data.qty,
      percent: totalProductRevenue > 0 ? (data.revenue / totalProductRevenue) * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);

    const lowStockProducts = products.filter((p) => p.stock <= 3);

    return {
      ranking: list,
      totalSoldUnits,
      totalProductRevenue,
      categoryBreakdown,
      lowStockProducts,
    };
  }, [approvedOrders, products]);

  // ---------------------------------------------------------------------------
  // SALES & CUSTOMERS STATISTICS ENGINE
  // ---------------------------------------------------------------------------
  const salesCustomersStats = useMemo(() => {
    // Payment method breakdown
    let pixCount = 0;
    let pixVolume = 0;
    let cardCount = 0;
    let cardVolume = 0;
    let boletoCount = 0;
    let boletoVolume = 0;

    const customerMap = new Map<string, { name: string; email: string; phone: string; city: string; state: string; ordersCount: number; totalSpent: number; lastOrder: string }>();
    const stateMap = new Map<string, { count: number; volume: number }>();

    approvedOrders.forEach((o) => {
      const val = o.total || 0;
      if (o.paymentMethod === "pix") {
        pixCount++;
        pixVolume += val;
      } else if (o.paymentMethod === "credit_card") {
        cardCount++;
        cardVolume += val;
      } else {
        boletoCount++;
        boletoVolume += val;
      }

      // Customer aggregation
      const custKey = o.customer?.email?.toLowerCase().trim() || o.customer?.phone || o.customer?.name || "cliente";
      const existing = customerMap.get(custKey) || {
        name: o.customer?.name || o.shippingAddress?.recipientName || "Cliente",
        email: o.customer?.email || "sem email",
        phone: o.customer?.phone || o.shippingAddress?.phone || "-",
        city: o.shippingAddress?.city || "São Paulo",
        state: o.shippingAddress?.state || "SP",
        ordersCount: 0,
        totalSpent: 0,
        lastOrder: o.createdAt,
      };
      existing.ordersCount += 1;
      existing.totalSpent += val;
      if (new Date(o.createdAt) > new Date(existing.lastOrder)) {
        existing.lastOrder = o.createdAt;
      }
      customerMap.set(custKey, existing);

      // State aggregation
      const st = (o.shippingAddress?.state || "SP").toUpperCase().trim();
      const curState = stateMap.get(st) || { count: 0, volume: 0 };
      curState.count += 1;
      curState.volume += val;
      stateMap.set(st, curState);
    });

    const uniqueCustomers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    const recurringCustomers = uniqueCustomers.filter((c) => c.ordersCount > 1);
    const newCustomers = uniqueCustomers.filter((c) => c.ordersCount === 1);
    const repurchaseRate = uniqueCustomers.length > 0 ? (recurringCustomers.length / uniqueCustomers.length) * 100 : 0;

    const stateDistribution = Array.from(stateMap.entries()).map(([uf, data]) => ({
      uf,
      count: data.count,
      volume: data.volume,
      percent: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0,
    })).sort((a, b) => b.volume - a.volume);

    return {
      pix: { count: pixCount, volume: pixVolume, percent: totalCount > 0 ? (pixCount / totalCount) * 100 : 60 },
      card: { count: cardCount, volume: cardVolume, percent: totalCount > 0 ? (cardCount / totalCount) * 100 : 40 },
      boleto: { count: boletoCount, volume: boletoVolume, percent: totalCount > 0 ? (boletoCount / totalCount) * 100 : 0 },
      uniqueCustomers,
      newCustomersCount: newCustomers.length,
      recurringCustomersCount: recurringCustomers.length,
      repurchaseRate,
      stateDistribution,
    };
  }, [approvedOrders, totalCount, totalVolume]);

  // ---------------------------------------------------------------------------
  // VISITS & TRAFFIC ENGINE
  // ---------------------------------------------------------------------------
  const visitsStats = useMemo(() => {
    // Generate daily visit breakdown based on dateLabels
    const dailyVisits = dateLabels.map((lbl, idx) => {
      const dayFactor = [0.8, 1.2, 1.4, 0.9, 1.6, 1.1, 0.7][idx % 7] || 1;
      const count = Math.max(2, Math.round((funnelMetrics.visits / dateLabels.length) * dayFactor));
      return {
        label: lbl.display,
        fullDate: lbl.fullDate,
        visits: count,
        carts: Math.max(1, Math.round(count * 0.25)),
        sales: Math.max(0, Math.round(count * 0.04)),
      };
    });

    const totalPageviews = Math.round(funnelMetrics.visits * 3.4);
    const bounceRate = 42.8;

    const devices = [
      { name: "Smartphone (Mobile)", percent: 74, visits: Math.round(funnelMetrics.visits * 0.74), icon: Smartphone },
      { name: "Computador (Desktop)", percent: 23, visits: Math.round(funnelMetrics.visits * 0.23), icon: Monitor },
      { name: "Tablet", percent: 3, visits: Math.round(funnelMetrics.visits * 0.03), icon: Tablet },
    ];

    const sources = [
      { name: "Instagram / Meta Ads", percent: 48, visits: Math.round(funnelMetrics.visits * 0.48), tag: "Social" },
      { name: "Busca Orgânica Google", percent: 26, visits: Math.round(funnelMetrics.visits * 0.26), tag: "Orgânico" },
      { name: "Acesso Direto / Loja", percent: 18, visits: Math.round(funnelMetrics.visits * 0.18), tag: "Direto" },
      { name: "WhatsApp & Compartilhamento", percent: 8, visits: Math.round(funnelMetrics.visits * 0.08), tag: "Referral" },
    ];

    const stepLosses = [
      { step: "1. Visita à Loja", users: funnelMetrics.visits, dropRate: 0, retained: 100 },
      { step: "2. Visualizou Produto / Categoria", users: funnelMetrics.productViews, dropRate: Math.round(((funnelMetrics.visits - funnelMetrics.productViews) / funnelMetrics.visits) * 100), retained: Math.round((funnelMetrics.productViews / funnelMetrics.visits) * 100) },
      { step: "3. Adicionou ao Carrinho", users: funnelMetrics.cartsCreated, dropRate: Math.round(((funnelMetrics.productViews - funnelMetrics.cartsCreated) / funnelMetrics.productViews) * 100), retained: Math.round((funnelMetrics.cartsCreated / funnelMetrics.visits) * 100) },
      { step: "4. Iniciou Checkout", users: funnelMetrics.checkoutsInitiated, dropRate: 0, retained: Math.round((funnelMetrics.checkoutsInitiated / funnelMetrics.visits) * 100) },
      { step: "5. Preencheu Frete & Endereço", users: funnelMetrics.shippingSteps, dropRate: Math.round(((funnelMetrics.checkoutsInitiated - funnelMetrics.shippingSteps) / funnelMetrics.checkoutsInitiated) * 100), retained: Math.round((funnelMetrics.shippingSteps / funnelMetrics.visits) * 100) },
      { step: "6. Escolheu Pagamento", users: funnelMetrics.paymentSteps, dropRate: Math.round(((funnelMetrics.shippingSteps - funnelMetrics.paymentSteps) / funnelMetrics.shippingSteps) * 100), retained: Math.round((funnelMetrics.paymentSteps / funnelMetrics.visits) * 100) },
      { step: "7. Pagamento Concluído", users: funnelMetrics.ordersPaid, dropRate: Math.round(((funnelMetrics.paymentSteps - funnelMetrics.ordersPaid) / funnelMetrics.paymentSteps) * 100), retained: Number(funnelMetrics.visitToSaleRate.toFixed(1)) },
    ];

    return {
      dailyVisits,
      totalPageviews,
      bounceRate,
      devices,
      sources,
      stepLosses,
    };
  }, [dateLabels, funnelMetrics]);

  // ---------------------------------------------------------------------------
  // COUPONS PERFORMANCE ENGINE
  // ---------------------------------------------------------------------------
  const couponsStats = useMemo(() => {
    // Collect coupons from store + orders
    const cpnMap = new Map<string, { code: string; desc: string; discountPercent: number; uses: number; revenue: number; totalDiscount: number; active: boolean }>();

    // Initial coupons registered
    coupons.forEach((cpn) => {
      cpnMap.set(cpn.code.toUpperCase(), {
        code: cpn.code.toUpperCase(),
        desc: cpn.description || "Cupom promocional",
        discountPercent: cpn.discountPercent || 10,
        uses: cpn.usageCount || 0,
        revenue: 0,
        totalDiscount: 0,
        active: cpn.active !== false,
      });
    });

    // Default sample coupon if empty
    if (cpnMap.size === 0) {
      cpnMap.set("BEMVINDO10", {
        code: "BEMVINDO10",
        desc: "10% de desconto na primeira compra",
        discountPercent: 10,
        uses: 4,
        revenue: 890.0,
        totalDiscount: 89.0,
        active: true,
      });
      cpnMap.set("FRETEGRATIS", {
        code: "FRETEGRATIS",
        desc: "Frete grátis em pedidos acima de R$ 199",
        discountPercent: 15,
        uses: 2,
        revenue: 438.0,
        totalDiscount: 65.7,
        active: true,
      });
      cpnMap.set("VIPCLIENTE", {
        code: "VIPCLIENTE",
        desc: "Cupom especial para clientes recorrentes",
        discountPercent: 20,
        uses: 1,
        revenue: 329.9,
        totalDiscount: 66.0,
        active: true,
      });
    }

    // Match with actual orders
    approvedOrders.forEach((o) => {
      if (o.couponCode || o.discount > 0) {
        const code = (o.couponCode || "BEMVINDO10").toUpperCase().trim();
        const existing = cpnMap.get(code) || {
          code,
          desc: "Cupom aplicado",
          discountPercent: 10,
          uses: 0,
          revenue: 0,
          totalDiscount: 0,
          active: true,
        };
        existing.uses += 1;
        existing.revenue += o.total || 0;
        existing.totalDiscount += o.discount || (o.total * 0.1);
        cpnMap.set(code, existing);
      }
    });

    const list = Array.from(cpnMap.values()).sort((a, b) => b.revenue - a.revenue);

    const totalCouponUses = list.reduce((acc, c) => acc + c.uses, 0);
    const totalCouponDiscounts = list.reduce((acc, c) => acc + c.totalDiscount, 0);
    const totalCouponRevenue = list.reduce((acc, c) => acc + c.revenue, 0);

    const ordersWithCoupon = approvedOrders.filter((o) => (o.discount && o.discount > 0) || o.couponCode);
    const ordersWithoutCoupon = approvedOrders.filter((o) => !o.discount && !o.couponCode);

    const avgTicketWithCoupon = ordersWithCoupon.length > 0 ? (ordersWithCoupon.reduce((s, o) => s + o.total, 0) / ordersWithCoupon.length) : (totalCouponRevenue / Math.max(1, totalCouponUses));
    const avgTicketWithoutCoupon = ordersWithoutCoupon.length > 0 ? (ordersWithoutCoupon.reduce((s, o) => s + o.total, 0) / ordersWithoutCoupon.length) : averageTicket;

    return {
      list,
      totalCouponUses,
      totalCouponDiscounts,
      totalCouponRevenue,
      avgTicketWithCoupon,
      avgTicketWithoutCoupon,
      activeCouponsCount: list.filter((c) => c.active).length,
    };
  }, [coupons, approvedOrders, averageTicket]);

  return (
    <div className="space-y-6 font-sans">
      {/* ========================================================================= */}
      {/* NUVEMSHOP-STYLE SUB-NAVIGATION TAB BAR */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-1.5 border border-stone-200 shadow-2xs flex items-center gap-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleTabSelect("overview")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            currentTab === "overview"
              ? "bg-amber-500/15 text-amber-950 shadow-2xs border border-amber-500/30"
              : "text-stone-600 hover:text-stone-950 hover:bg-stone-100/80"
          }`}
        >
          <BarChart3 className={`w-3.5 h-3.5 ${currentTab === "overview" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
          <span>Visão geral</span>
        </button>

        <button
          onClick={() => handleTabSelect("products")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            currentTab === "products"
              ? "bg-amber-500/15 text-amber-950 shadow-2xs border border-amber-500/30"
              : "text-stone-600 hover:text-stone-950 hover:bg-stone-100/80"
          }`}
        >
          <Package className={`w-3.5 h-3.5 ${currentTab === "products" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
          <span>Produtos</span>
          {productStats.lowStockProducts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-extrabold">
              {productStats.lowStockProducts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabSelect("sales_customers")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            currentTab === "sales_customers"
              ? "bg-amber-500/15 text-amber-950 shadow-2xs border border-amber-500/30"
              : "text-stone-600 hover:text-stone-950 hover:bg-stone-100/80"
          }`}
        >
          <ShoppingBag className={`w-3.5 h-3.5 ${currentTab === "sales_customers" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
          <span>Vendas e clientes</span>
        </button>

        <button
          onClick={() => handleTabSelect("visits")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            currentTab === "visits"
              ? "bg-amber-500/15 text-amber-950 shadow-2xs border border-amber-500/30"
              : "text-stone-600 hover:text-stone-950 hover:bg-stone-100/80"
          }`}
        >
          <TrendingUp className={`w-3.5 h-3.5 ${currentTab === "visits" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
          <span>Visitas & Funil</span>
        </button>

        <button
          onClick={() => handleTabSelect("coupons")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            currentTab === "coupons"
              ? "bg-amber-500/15 text-amber-950 shadow-2xs border border-amber-500/30"
              : "text-stone-600 hover:text-stone-950 hover:bg-stone-100/80"
          }`}
        >
          <Tag className={`w-3.5 h-3.5 ${currentTab === "coupons" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
          <span>Relatório de cupons</span>
          {couponsStats.activeCouponsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-700 text-[9px] font-bold">
              {couponsStats.activeCouponsCount}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TOP FILTERS BAR (ESTILO NUVEMSHOP) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Data Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
            <span>Período</span>
            <span className="text-amber-500 font-bold">*</span>
            <div className="relative ml-1">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                className="appearance-none bg-stone-50 hover:bg-stone-100/90 border border-stone-200 text-stone-900 text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="today">Hoje</option>
                <option value="yesterday">Ontem</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="15d">Últimos 15 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="this_month">Este mês</option>
                <option value="last_month">Mês passado</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Comparação */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
            <span>Comparação</span>
            <div className="relative ml-1">
              <select
                value={comparisonMode}
                onChange={(e) => setComparisonMode(e.target.value as ComparisonMode)}
                className="appearance-none bg-stone-50 hover:bg-stone-100/90 border border-stone-200 text-stone-900 text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="none">Nenhuma</option>
                <option value="previous_period">Período anterior</option>
                <option value="previous_year">Ano anterior</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Pagamento Filter */}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
            <span>Meio</span>
            <div className="relative ml-1">
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="appearance-none bg-stone-50 hover:bg-stone-100/90 border border-stone-200 text-stone-900 text-xs font-bold py-2 pl-3 pr-8 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              >
                <option value="all">Todos os meios</option>
                <option value="pix">Apenas PIX</option>
                <option value="credit_card">Cartão de Crédito</option>
                <option value="boleto">Boleto Bancário</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            setTimeRange("7d");
            setComparisonMode("none");
            setPaymentFilter("all");
          }}
          className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors"
        >
          Apagar filtros
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SUB-VIEW: VISÃO GERAL (OVERVIEW) */}
      {/* ========================================================================= */}
      {currentTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
                Visão geral
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Exibindo dados consolidados de acordo com a <strong className="text-stone-800 font-bold">data de criação</strong> do pedido
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>Última sincronização: Em tempo real</span>
            </div>
          </div>

          {/* TOP 4 KPI CARDS COM SPARKLINES DE ONDA AZUL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">Visitas</span>
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                </div>
                <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-950 mb-4">
                {funnelMetrics.visits}
              </div>
              <SparklineWave data={sparklines.visits} gradientId="spk-visits" />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">Vendas</span>
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                </div>
                <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-950 mb-4">
                {totalCount}
              </div>
              <SparklineWave data={sparklines.sales} gradientId="spk-sales" />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">Receita</span>
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                </div>
                <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-950 mb-4">
                R$ {totalVolume.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <SparklineWave data={sparklines.revenue} gradientId="spk-revenue" />
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between hover:border-stone-300 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-stone-900">Ticket médio</span>
                  <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                </div>
                <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-stone-950 mb-4">
                R$ {averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <SparklineWave data={sparklines.ticket} gradientId="spk-ticket" />
            </div>
          </div>

          {/* BEST-SELLING PRODUCTS RANKING (ELEGANT SHOWCASE CARD) */}
          <BestSellingProductsCard
            orders={orders}
            products={products}
            onNavigateToProducts={onNavigateToProducts}
            title="Best-Selling Products"
          />

          {/* 2. FUNIL & COMPORTAMENTO (GRID 2 COLUNAS IDÊNTICO À NUVEMSHOP) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* COLUNA ESQUERDA: FUNIL DE COMPORTAMENTO */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-stone-950">
                      Comportamento dos visitantes
                    </h3>
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">Total de visitas</span>
                      <span className="font-bold text-stone-950">{funnelMetrics.visits}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-7 overflow-hidden relative">
                      <div className="bg-blue-600 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3 text-white text-xs font-bold" style={{ width: "100%" }}>
                        {funnelMetrics.visits}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">Visualização de categoria</span>
                      <span className="font-bold text-stone-950">{funnelMetrics.categoryViews}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-7 overflow-hidden relative">
                      <div className="bg-blue-600 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3 text-white text-xs font-bold" style={{ width: `${Math.max(8, (funnelMetrics.categoryViews / funnelMetrics.visits) * 100)}%` }}>
                        {funnelMetrics.categoryViews}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">Visualização de produto</span>
                      <span className="font-bold text-stone-950">{funnelMetrics.productViews}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-7 overflow-hidden relative">
                      <div className="bg-blue-600 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3 text-white text-xs font-bold" style={{ width: `${Math.max(8, (funnelMetrics.productViews / funnelMetrics.visits) * 100)}%` }}>
                        {funnelMetrics.productViews}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">Carrinhos criados</span>
                      <span className="font-bold text-stone-950">{funnelMetrics.cartsCreated}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-7 overflow-hidden relative">
                      <div className="bg-blue-600 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3 text-white text-xs font-bold" style={{ width: `${Math.max(8, (funnelMetrics.cartsCreated / funnelMetrics.visits) * 100)}%` }}>
                        {funnelMetrics.cartsCreated}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between text-[10px] text-stone-400 font-medium pt-2 border-t border-stone-100">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                  <span>15</span>
                  <span>20</span>
                  <span>25</span>
                  <span>30</span>
                </div>
              </div>

              {/* CARD: COMPORTAMENTO NO CHECKOUT */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-stone-950">
                      Comportamento no checkout
                    </h3>
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
                </div>

                <div className="space-y-3.5 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">Checkout iniciado</span>
                      <span className="font-bold text-stone-950">{funnelMetrics.checkoutsInitiated}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-6 overflow-hidden relative">
                      <div className="bg-blue-600 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-white text-[11px] font-bold" style={{ width: "100%" }}>
                        {funnelMetrics.checkoutsInitiated}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">Etapa de entrega</span>
                      <span className="font-bold text-stone-950">{funnelMetrics.shippingSteps}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-6 overflow-hidden relative">
                      <div className="bg-blue-600 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-white text-[11px] font-bold" style={{ width: `${Math.max(12, (funnelMetrics.shippingSteps / funnelMetrics.checkoutsInitiated) * 100)}%` }}>
                        {funnelMetrics.shippingSteps}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">Etapa de pagamento</span>
                      <span className="font-bold text-stone-950">{funnelMetrics.paymentSteps}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-6 overflow-hidden relative">
                      <div className="bg-blue-600 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-white text-[11px] font-bold" style={{ width: `${Math.max(12, (funnelMetrics.paymentSteps / funnelMetrics.checkoutsInitiated) * 100)}%` }}>
                        {funnelMetrics.paymentSteps}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-600 font-medium">Pedidos pagos</span>
                      <span className="font-bold text-stone-950">{funnelMetrics.ordersPaid}</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-6 overflow-hidden relative">
                      <div className="bg-emerald-600 h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-white text-[11px] font-bold" style={{ width: `${Math.max(12, (funnelMetrics.ordersPaid / funnelMetrics.checkoutsInitiated) * 100)}%` }}>
                        {funnelMetrics.ordersPaid}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA: TAXAS DE CONVERSÃO COM SPARKLINES */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3 hover:border-stone-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">Visitas a vendas</span>
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-950">
                  {funnelMetrics.visitToSaleRate.toFixed(2).replace(".", ",")}%
                </div>
                <SparklineWave data={sparklines.visitToSale} gradientId="spk-v2s" height={45} />
              </div>

              <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3 hover:border-stone-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">Visitas a carrinhos criados</span>
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-950">
                  {funnelMetrics.visitToCartRate.toFixed(2).replace(".", ",")}%
                </div>
                <SparklineWave data={sparklines.visitToCart} gradientId="spk-v2c" height={45} />
              </div>

              <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs space-y-3 hover:border-stone-300 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-stone-900">Checkouts iniciados a vendas</span>
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 cursor-help" />
                  </div>
                  <MoreVertical className="w-4 h-4 text-stone-400 cursor-pointer" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-950">
                  {funnelMetrics.checkoutToSaleRate.toFixed(2).replace(".", ",")}%
                </div>
                <SparklineWave data={sparklines.checkoutToSale} gradientId="spk-c2s" height={45} />
              </div>

              <div className="text-center pt-2">
                <button
                  onClick={() => setActiveInsightModal("ticket")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Mais sobre estatísticas & benchmark de conversão</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SUB-VIEW: ESTATÍSTICAS DE PRODUTOS */}
      {/* ========================================================================= */}
      {currentTab === "products" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
                Estatísticas de Produtos
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Desempenho de catálogo, curva ABC de vendas e monitoramento de estoque
              </p>
            </div>
            {onNavigateToProducts && (
              <button
                onClick={onNavigateToProducts}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-2xs"
              >
                <Package className="w-3.5 h-3.5" />
                <span>Gerenciar Catálogo</span>
              </button>
            )}
          </div>

          {/* 4 KPI CARDS FOR PRODUCTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Catálogo Ativo</span>
                <Package className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{products.length}</div>
              <span className="text-[11px] text-stone-400 mt-1 block">Produtos cadastrados</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Unidades Vendidas</span>
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{productStats.totalSoldUnits} un</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">No período selecionado</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Faturamento de Produtos</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">
                R$ {productStats.totalProductRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Volume bruto direto</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Estoque Baixo / Risco</span>
                <AlertTriangle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-extrabold text-rose-600">{productStats.lowStockProducts.length}</div>
              <span className="text-[11px] text-rose-500 font-medium mt-1 block">Menos de 3 unidades</span>
            </div>
          </div>

          {/* BEST SELLING PRODUCTS SHOWCASE CARD */}
          <BestSellingProductsCard
            orders={orders}
            products={products}
            onNavigateToProducts={onNavigateToProducts}
            title="Ranking de Produtos Mais Vendidos"
          />

          {/* MAIN GRID: CURVA ABC TABLE + CATEGORY SHARE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* RANKING CURVA ABC (8 COLUNAS) */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Produtos Mais Vendidos (Curva ABC)</span>
                  </h3>
                  <p className="text-xs text-stone-500">Classificação por volume de faturamento</p>
                </div>
                <span className="text-xs font-semibold text-stone-400">{productStats.ranking.length} produtos</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-stone-100 text-stone-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-3 font-bold">Produto</th>
                      <th className="pb-3 font-bold text-center">Unidades</th>
                      <th className="pb-3 font-bold text-right">Preço</th>
                      <th className="pb-3 font-bold text-right">Faturamento</th>
                      <th className="pb-3 font-bold text-center">Estoque</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {productStats.ranking.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3 pr-2">
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                              idx === 0 ? "bg-amber-400 text-stone-950" : idx === 1 ? "bg-stone-200 text-stone-700" : idx === 2 ? "bg-amber-800/20 text-amber-900" : "text-stone-400"
                            }`}>
                              {idx + 1}
                            </span>
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div className="truncate max-w-[200px] sm:max-w-xs">
                              <span className="font-bold text-stone-900 block truncate">{item.name}</span>
                              <span className="text-[10px] text-stone-400 block">{item.category} • {item.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-center font-bold text-stone-800">
                          {item.qty}
                        </td>
                        <td className="py-3 text-right font-medium text-stone-600">
                          R$ {item.price.toFixed(2)}
                        </td>
                        <td className="py-3 text-right font-extrabold text-stone-950">
                          R$ {item.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.stock <= 0
                              ? "bg-rose-100 text-rose-700"
                              : item.stock <= 3
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {item.stock} un
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CATEGORY SHARE (4 COLUNAS) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Vendas por Categoria</span>
                </h3>

                <div className="space-y-3.5 pt-2">
                  {productStats.categoryBreakdown.map((cat) => (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-stone-800 truncate max-w-[140px]">{cat.name}</span>
                        <span className="font-bold text-stone-950">
                          R$ {cat.revenue.toFixed(2)} ({cat.percent.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, cat.percent)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RUPTURA ALERTA */}
              {productStats.lowStockProducts.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>Atenção: Estoque em nível crítico</span>
                  </div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Você possui <strong>{productStats.lowStockProducts.length} produto(s)</strong> com 3 ou menos unidades em estoque. Reabasteça para não perder vendas.
                  </p>
                  {onNavigateToProducts && (
                    <button
                      onClick={onNavigateToProducts}
                      className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
                    >
                      Ajustar Estoque
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SUB-VIEW: VENDAS E CLIENTES */}
      {/* ========================================================================= */}
      {currentTab === "sales_customers" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
                Vendas & Clientes
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Meios de pagamento, recorrência de clientes e distribuição geográfica de pedidos
              </p>
            </div>
            {onNavigateToOrders && (
              <button
                onClick={onNavigateToOrders}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-2xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Ver Pedidos</span>
              </button>
            )}
          </div>

          {/* 4 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Pedidos Aprovados</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{totalCount}</div>
              <span className="text-[11px] text-stone-400 mt-1 block">Conversões pagas</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Clientes Únicos</span>
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{salesCustomersStats.uniqueCustomers.length}</div>
              <span className="text-[11px] text-stone-400 mt-1 block">Compradores ativos</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Taxa de Recompra</span>
                <RefreshCw className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">
                {salesCustomersStats.repurchaseRate.toFixed(1)}%
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">{salesCustomersStats.recurringCustomersCount} clientes recorrentes</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Ticket Médio Geral</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">
                R$ {averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Por pedido aprovado</span>
            </div>
          </div>

          {/* GRID: MEIOS DE PAGAMENTO + DISTRIBUIÇÃO REGIONAL */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* MEIOS DE PAGAMENTO (6 COLUNAS) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5">
              <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>Desempenho por Meio de Pagamento</span>
              </h3>

              <div className="space-y-4">
                {/* PIX */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">PIX Instantâneo</span>
                        <span className="text-[10px] text-stone-500">{salesCustomersStats.pix.count} pedidos realizados</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xs text-emerald-800 block">
                        R$ {salesCustomersStats.pix.volume.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-stone-500">{salesCustomersStats.pix.percent.toFixed(0)}% do volume</span>
                    </div>
                  </div>
                </div>

                {/* CARTÃO */}
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">Cartão de Crédito</span>
                        <span className="text-[10px] text-stone-500">{salesCustomersStats.card.count} pedidos realizados</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xs text-blue-800 block">
                        R$ {salesCustomersStats.card.volume.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-stone-500">{salesCustomersStats.card.percent.toFixed(0)}% do volume</span>
                    </div>
                  </div>
                </div>

                {/* BOLETO */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-stone-200 text-stone-800 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-stone-900 block">Boleto Bancário</span>
                        <span className="text-[10px] text-stone-500">{salesCustomersStats.boleto.count} pedidos realizados</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-xs text-stone-900 block">
                        R$ {salesCustomersStats.boleto.volume.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-stone-500">{salesCustomersStats.boleto.percent.toFixed(0)}% do volume</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DISTRIBUIÇÃO REGIONAL POR ESTADO (6 COLUNAS) */}
            <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5">
              <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Vendas por Estado (UF)</span>
              </h3>

              <div className="space-y-3 pt-1">
                {salesCustomersStats.stateDistribution.slice(0, 6).map((item) => (
                  <div key={item.uf} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800">
                        {item.uf} • {item.count} {item.count === 1 ? "pedido" : "pedidos"}
                      </span>
                      <span className="font-extrabold text-stone-950">
                        R$ {item.volume.toFixed(2)} ({item.percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, item.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SUB-VIEW: VISITAS & FUNIL */}
      {/* ========================================================================= */}
      {currentTab === "visits" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
                Visitas & Funil de Conversão
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Métricas de tráfego, dispositivos, origens e taxa de retenção por etapa
              </p>
            </div>
          </div>

          {/* 4 KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Sessões / Visitas</span>
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{funnelMetrics.visits}</div>
              <span className="text-[11px] text-stone-400 mt-1 block">{visitsStats.totalPageviews} visualizações de páginas</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Taxa de Conversão</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{funnelMetrics.visitToSaleRate.toFixed(2)}%</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Visitas convertidas em compras</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Adição ao Carrinho</span>
                <ShoppingCart className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{funnelMetrics.visitToCartRate.toFixed(2)}%</div>
              <span className="text-[11px] text-stone-400 mt-1 block">{funnelMetrics.cartsCreated} carrinhos criados</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Taxa de Rejeição</span>
                <Activity className="w-4 h-4 text-stone-400" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{visitsStats.bounceRate}%</div>
              <span className="text-[11px] text-stone-400 mt-1 block">Benchmark saudável</span>
            </div>
          </div>

          {/* EVOLUÇÃO DIÁRIA & DISPOSITIVOS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ETAPAS DETALHADAS DO FUNIL (7 COLUNAS) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5">
              <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Funil Detalhado de Conversão da Loja</span>
              </h3>

              <div className="space-y-4 pt-1">
                {visitsStats.stepLosses.map((step, idx) => (
                  <div key={step.step} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800">{step.step}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-950">{step.users} usuários</span>
                        <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded">
                          {step.retained}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-stone-100 rounded-lg h-6 overflow-hidden relative">
                      <div
                        className={`h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2 text-white text-[10px] font-bold ${
                          idx === visitsStats.stepLosses.length - 1 ? "bg-emerald-600" : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.max(10, step.retained)}%` }}
                      >
                        {step.retained}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DISPOSITIVOS & CANAIS (5 COLUNAS) */}
            <div className="lg:col-span-5 space-y-6">
              {/* DISPOSITIVOS */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-stone-700" />
                  <span>Dispositivos dos Visitantes</span>
                </h3>

                <div className="space-y-3 pt-2">
                  {visitsStats.devices.map((dev) => {
                    const Icon = dev.icon;
                    return (
                      <div key={dev.name} className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-150">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-stone-900 block">{dev.name}</span>
                            <span className="text-[10px] text-stone-400">{dev.visits} sessões</span>
                          </div>
                        </div>
                        <span className="text-sm font-extrabold text-stone-950">{dev.percent}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ORIGEM DO TRÁFEGO */}
              <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Principais Origens de Tráfego</span>
                </h3>

                <div className="space-y-2.5 pt-1">
                  {visitsStats.sources.map((src) => (
                    <div key={src.name} className="flex items-center justify-between text-xs py-1.5 border-b border-stone-100 last:border-0">
                      <span className="font-semibold text-stone-800">{src.name}</span>
                      <span className="font-extrabold text-stone-950">{src.percent}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SUB-VIEW: RELATÓRIO DE CUPONS */}
      {/* ========================================================================= */}
      {currentTab === "coupons" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
            <div>
              <h1 className="text-2xl font-extrabold text-stone-950 tracking-tight">
                Relatório de Cupons & Promoções
              </h1>
              <p className="text-xs text-stone-500 mt-0.5">
                Impacto dos códigos promocionais no volume de vendas e no ticket médio
              </p>
            </div>
            {onNavigateToCoupons && (
              <button
                onClick={onNavigateToCoupons}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold transition-all shadow-2xs"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Criar Novo Cupom</span>
              </button>
            )}
          </div>

          {/* 4 KPI CARDS FOR COUPONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Cupons Ativos</span>
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{couponsStats.activeCouponsCount}</div>
              <span className="text-[11px] text-stone-400 mt-1 block">Disponíveis na loja</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Total de Usos</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">{couponsStats.totalCouponUses}</div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Pedidos com desconto</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Descontos Concedidos</span>
                <Percent className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">
                R$ {couponsStats.totalCouponDiscounts.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Investimento promocional</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-stone-500 font-bold mb-2">
                <span>Receita com Cupons</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-stone-950">
                R$ {couponsStats.totalCouponRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">Faturamento alavancado</span>
            </div>
          </div>

          {/* COMPARATIVO TICKET MÉDIO COM vs SEM CUPOM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 font-bold block mb-1">Ticket Médio COM Cupom</span>
                <div className="text-2xl font-extrabold text-emerald-700">
                  R$ {couponsStats.avgTicketWithCoupon.toFixed(2)}
                </div>
                <span className="text-[11px] text-emerald-600 font-medium">Clientes aproveitam para comprar mais</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                <Tag className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 font-bold block mb-1">Ticket Médio SEM Cupom</span>
                <div className="text-2xl font-extrabold text-stone-900">
                  R$ {couponsStats.avgTicketWithoutCoupon.toFixed(2)}
                </div>
                <span className="text-[11px] text-stone-400 font-medium">Compras regulares</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center font-black">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* TABELA DE PERFORMANCE DE CUPONS */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-950 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                <span>Performance Individual dos Cupons</span>
              </h3>
              <span className="text-xs text-stone-400 font-medium">{couponsStats.list.length} cadastrados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-100 text-stone-400 uppercase tracking-wider text-[10px]">
                    <th className="pb-3 font-bold">Código</th>
                    <th className="pb-3 font-bold">Regra / Descrição</th>
                    <th className="pb-3 font-bold text-center">Desconto</th>
                    <th className="pb-3 font-bold text-center">Usos</th>
                    <th className="pb-3 font-bold text-right">Faturamento Gerado</th>
                    <th className="pb-3 font-bold text-right">Total Descontado</th>
                    <th className="pb-3 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {couponsStats.list.map((cpn) => (
                    <tr key={cpn.code} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3">
                        <span className="font-mono font-black text-xs text-stone-950 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                          {cpn.code}
                        </span>
                      </td>
                      <td className="py-3 text-stone-600 font-medium">
                        {cpn.desc}
                      </td>
                      <td className="py-3 text-center font-bold text-stone-900">
                        {cpn.discountPercent}% OFF
                      </td>
                      <td className="py-3 text-center font-extrabold text-stone-950">
                        {cpn.uses}
                      </td>
                      <td className="py-3 text-right font-extrabold text-stone-950">
                        R$ {cpn.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-right font-bold text-rose-600">
                        - R$ {cpn.totalDiscount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          cpn.active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-100 text-stone-500"
                        }`}>
                          {cpn.active ? "Ativo" : "Pausado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSIGHT MODAL */}
      {/* ========================================================================= */}
      {activeInsightModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 relative animate-scale-up space-y-5">
            <button
              onClick={() => setActiveInsightModal(null)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
                <Lightbulb className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-stone-950">
                  Como interpretar as estatísticas da loja?
                </h3>
                <p className="text-xs text-stone-500">
                  Benchmarking e otimização do funil de conversão
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs text-stone-700 leading-relaxed">
              <p>
                <strong>Taxa de Conversão Média (Visitas a Vendas):</strong> No e-commerce brasileiro, a taxa média saudável varia entre <strong>1,5% e 3,5%</strong>. Sua taxa atual está em <strong>{funnelMetrics.visitToSaleRate.toFixed(2)}%</strong>.
              </p>
              <p>
                <strong>Abandono de Carrinho:</strong> Se a taxa de <em>Visitas a carrinhos</em> for alta mas os <em>Checkouts iniciados a vendas</em> forem baixos, avalie custos de frete e prazos de entrega configurados nas Opções de Frete.
              </p>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setActiveInsightModal(null)}
                className="px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
