import React, { useState, useEffect } from "react";
import {
  Package,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Tag,
  DollarSign,
  Gift,
  Boxes,
  Eye,
  Sliders,
  SlidersHorizontal,
  X,
  Save,
  Check,
  MapPin,
  User,
  CreditCard,
  QrCode,
  FileText,
  Sparkles,
  ArrowUpRight,
  Store,
  PanelLeftClose,
  PanelLeft,
  Menu,
  Bell,
  Home,
  LayoutDashboard,
  Layers,
  Settings,
  LogOut,
  HelpCircle,
  BarChart3,
  Megaphone,
  Building2,
  ShieldCheck,
  Globe,
  Code,
  Zap,
  Users,
  Percent,
  Bot,
  Download,
  Camera,
  Share2,
  Calendar,
} from "lucide-react";
import {
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  ProductOccasion,
  Coupon,
  AdminMetrics,
  CategoryInfo,
  ProductCollection,
  ProductVariant,
  HeroCampaign,
  EditorialBanner,
  MarketingSettings,
  StoreOperationsSettings,
} from "../types";
import {
  getAdminOrders,
  getAdminProducts,
  getAdminCoupons,
  updateAdminOrderStatus,
  saveAdminProduct,
  deleteAdminProduct,
  saveAdminCoupon,
  deleteAdminCoupon,
  calculateAdminMetrics,
  getAdminCategories,
  getAdminCollections,
  getHeroBanners,
  getEditorialBanners,
  getMarketingSettings,
  getStoreOperationsSettings,
} from "../services/api";
import { BRAND_CONFIG } from "../config/brand";
import { useToast } from "../context/ToastContext";
import { ImageUploader } from "../components/admin/ImageUploader";
import { VariantManager } from "../components/admin/VariantManager";
import { CategoryManager } from "../components/admin/CategoryManager";
import { CollectionManager } from "../components/admin/CollectionManager";
import { BannerManager } from "../components/admin/BannerManager";
import { MarketingManager } from "../components/admin/MarketingManager";
import { StoreOperationsManager } from "../components/admin/StoreOperationsManager";
import { MetricsManager } from "../components/admin/MetricsManager";
import { FinancialManager } from "../components/admin/FinancialManager";
import { CustomerManager } from "../components/admin/CustomerManager";
import { AbandonedCartsManager } from "../components/admin/AbandonedCartsManager";
import { AIManager } from "../components/admin/AIManager";
import { InsightBanner } from "../components/admin/InsightBanner";
import { CopilotFab } from "../components/admin/CopilotFab";
import { CopilotPanel } from "../components/admin/CopilotPanel";
import { OrderRow } from "../components/admin/OrderRow";
import { PricingManager } from "../components/admin/PricingManager";
import { FiscalManager } from "../components/admin/FiscalManager";
import { VoucherEngine } from "../components/admin/VoucherEngine";
import { UGCManager } from "../components/admin/UGCManager";
import { ReferralPanel } from "../components/admin/ReferralPanel";
import { OccasionReminder } from "../components/admin/OccasionReminder";

interface AdminPageProps {
  onNavigateHome: () => void;
  onNavigateProduct?: (slug: string) => void;
  onNavigateCatalog?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  onNavigateHome,
  onNavigateProduct,
  onNavigateCatalog,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    | "metrics"
    | "finance"
    | "orders"
    | "abandoned_carts"
    | "ai_agent"
    | "products"
    | "categories"
    | "collections"
    | "banners"
    | "coupons"
    | "customers"
    | "marketing"
    | "settings"
    | "pricing"
    | "fiscal"
    | "ugc"
    | "referral"
    | "occasions"
  >("metrics");
  const [metricsSubView, setMetricsSubView] = useState<
    "overview" | "products" | "sales_customers" | "visits" | "realtime" | "coupons"
  >("overview");
  const [statsMenuOpen, setStatsMenuOpen] = useState(true);
  const [productsMenuOpen, setProductsMenuOpen] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [collections, setCollections] = useState<ProductCollection[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroCampaign[]>([]);
  const [editorialBanners, setEditorialBanners] = useState<EditorialBanner[]>([]);
  const [marketingSettings, setMarketingSettings] = useState<MarketingSettings>({
    gtmEnabled: false,
    gaEnabled: false,
    googleAdsEnabled: false,
    metaPixelEnabled: false,
  });
  const [storeOperationsSettings, setStoreOperationsSettings] = useState<StoreOperationsSettings>({
    name: BRAND_CONFIG.name,
    shortName: BRAND_CONFIG.shortName,
    tagline: BRAND_CONFIG.tagline,
    description: BRAND_CONFIG.description,
    cnpj: BRAND_CONFIG.cnpjPlaceholder,
    address: BRAND_CONFIG.addressPlaceholder,
    instagramHandle: BRAND_CONFIG.instagramHandle,
    whatsapp: BRAND_CONFIG.whatsapp,
    whatsappDisplay: BRAND_CONFIG.whatsappDisplay,
    email: BRAND_CONFIG.email,
    phone: BRAND_CONFIG.phone,
    phoneDisplay: BRAND_CONFIG.phoneDisplay,
    openingHours: BRAND_CONFIG.openingHours,
    freeShippingThreshold: BRAND_CONFIG.freeShippingThreshold,
    originCep: "01310-100",
    handlingDays: 1,
    pixDiscountPercentage: BRAND_CONFIG.pixDiscountPercentage,
    pixKey: "00.000.000/0001-00",
    pixReceiverName: BRAND_CONFIG.name,
    pixBankName: "Banco Inter / Nu Pagamentos",
    maxInstallmentsWithoutInterest: BRAND_CONFIG.maxInstallmentsWithoutInterest,
    mercadoPagoMode: "production",
    mercadoPagoPublicKey: "APP_USR-xxxx-xxxx-xxxx",
    announcementBarText: "Frete Grátis para todo o Brasil acima de R$ 249 | 5% OFF no PIX",
    announcementBarEnabled: true,
    returnPolicyDays: 30,
    warrantyDays: 90,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Submenu states for Marketing and Settings
  const [marketingSection, setMarketingSection] = useState<"trackers" | "seo" | "scripts">("trackers");
  const [settingsSection, setSettingsSection] = useState<"identity" | "shipping" | "payment" | "announcement" | "database">("identity");
  const [marketingMenuOpen, setMarketingMenuOpen] = useState(true);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const getTabInfo = () => {
    switch (activeTab) {
      case "metrics":
        if (metricsSubView === "products") return { title: "Estatísticas: Produtos", subtitle: "Métricas detalhadas de visualizações, conversão e produtos mais vendidos" };
        if (metricsSubView === "sales_customers") return { title: "Estatísticas: Vendas & Clientes", subtitle: "Desempenho de receita, ticket médio e comportamento de recompra" };
        if (metricsSubView === "visits") return { title: "Estatísticas: Visitas & Funil", subtitle: "Tráfego, taxa de conversão e etapas do funil de vendas" };
        if (metricsSubView === "coupons") return { title: "Estatísticas: Relatório de Cupons", subtitle: "Uso de cupons promocionais e impacto em receita gerada" };
        return { title: "Estatísticas: Visão Geral", subtitle: "Métricas principais de vendas, visitas, conversão e ticket médio" };
      case "finance":
        return { title: "Gestão Financeira & DRE", subtitle: "Demonstrativo de resultados, saldo a liberar, CMV e lucratividade líquida" };
      case "pricing":
        return { title: "Precificação & Markup Gross-Up", subtitle: "Simulador de margem bruta, custos fixos, comissões de gateway e lucro líquido" };
      case "fiscal":
        return { title: "Emissão & Gestão Fiscal (NF-e mod. 55)", subtitle: "Emissão automática SEFAZ, DANFE em PDF e envio de XML para clientes" };
      case "orders":
        return { title: "Gestão de Pedidos", subtitle: "Acompanhe pagamentos, status de envio e rastreio" };
      case "abandoned_carts":
        return { title: "Carrinhos Abandonados (IA Gemini)", subtitle: "Recupere vendas com mensagens hiperpersonalizadas para WhatsApp e E-mail" };
      case "ai_agent":
        return { title: "Inteligência Artificial & Automações", subtitle: "Relatórios executivos matinais das 09h, Z-API WhatsApp e análise autônoma de vendas" };
      case "products":
        return { title: "Seus produtos", subtitle: "Catálogo completo de produtos, variações e estoque" };
      case "categories":
        return { title: "Categorias da Loja", subtitle: "Organize seus produtos em categorias e departamentos" };
      case "collections":
        return { title: "Coleções & Linhas", subtitle: "Agrupamentos temáticos e vitrines sazonais" };
      case "banners":
        return { title: "Banners & Hero", subtitle: "Gestão visual dos carrosséis e cards editoriais da Home" };
      case "customers":
        return { title: "Clientes da Loja", subtitle: "Base de compradores, histórico de pedidos, LTV e contato direto via WhatsApp" };
      case "coupons":
        return { title: "Cupons de Desconto", subtitle: "Crie campanhas promocionais e cupons com regras e trava de margem" };
      case "ugc":
        return { title: "Prova Social & UGC dos Clientes", subtitle: "Moderação de fotos de unboxing, vídeos no Instagram e depoimentos verificados" };
      case "referral":
        return { title: "Programa Indique & Ganhe (MGM)", subtitle: "Métricas de Member-Get-Member, links de afiliados e comissões automáticas" };
      case "occasions":
        return { title: "Lembretes de Ocasião (Zero-Party Data)", subtitle: "Alertas preditivos de aniversários, datas especiais e sugestões de presentes" };
      case "marketing":
        if (marketingSection === "trackers") return { title: "1. Pixels & Tags de Conversão", subtitle: "Google Tag Manager, GA4, Google Ads e Meta Pixel" };
        if (marketingSection === "seo") return { title: "2. SEO Global & Redes Sociais", subtitle: "Metadados de busca no Google e prévias para redes" };
        if (marketingSection === "scripts") return { title: "3. Scripts Personalizados", subtitle: "Injeção de scripts customizados no cabeçalho e rodapé" };
        return { title: "Marketing, SEO & Pixels", subtitle: "Google Tag Manager, GA4, Ads, Meta Pixel e tags" };
      case "settings":
        if (settingsSection === "identity") return { title: "1. Identidade & Contato da Loja", subtitle: "Nome da marca, CNPJ, WhatsApp de atendimento e dados da empresa" };
        if (settingsSection === "shipping") return { title: "2. Frete & Regras de Logística", subtitle: "CEP de origem, regras de frete grátis e prazos operacionais" };
        if (settingsSection === "payment") return { title: "3. Pagamento, PIX & Mercado Pago", subtitle: "Chave PIX, credenciais de produção do Mercado Pago e descontos" };
        if (settingsSection === "announcement") return { title: "4. Barra de Avisos & Políticas", subtitle: "Faixa de topo do site e termos de privacidade e trocas" };
        if (settingsSection === "database") return { title: "5. Status do Firestore", subtitle: "Monitoramento de coleções e sincronização em nuvem" };
        return { title: "Configurações da Operação", subtitle: "Parâmetros de frete grátis, gateways e identidade da marca" };
      default:
        return { title: "Painel Administrativo", subtitle: "Gestão completa da loja" };
    }
  };

  // Orders filters and state
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingTrackingCode, setEditingTrackingCode] = useState("");
  const [editingStatus, setEditingStatus] = useState<OrderStatus>("PEDIDO_REALIZADO");
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  // Products filters and state
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [collectionFilter, setCollectionFilter] = useState<string>("ALL");
  const [stockFilter, setStockFilter] = useState<string>("ALL");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Coupons state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: "",
    description: "",
    discountPercent: 10,
    minOrder: 100,
    active: true,
  });

  // Fetch all admin data
  const loadData = async (showNotification = false) => {
    try {
      setIsRefreshing(true);
      const [ordList, prodList, cpnList, catList, colList, heroList, editList, mktSettings, opsSettings] = await Promise.all([
        getAdminOrders(),
        getAdminProducts(),
        getAdminCoupons(),
        getAdminCategories(),
        getAdminCollections(),
        getHeroBanners(),
        getEditorialBanners(),
        getMarketingSettings(),
        getStoreOperationsSettings(),
      ]);

      setOrders(ordList);
      setProducts(prodList);
      setCoupons(cpnList);
      setCategories(catList);
      setCollections(colList);
      setHeroBanners(heroList);
      setEditorialBanners(editList);
      if (mktSettings) setMarketingSettings(mktSettings);
      if (opsSettings) setStoreOperationsSettings(opsSettings);

      if (showNotification) {
        showToast("Dados do painel sincronizados com o Firestore!", "success");
      }
    } catch (err) {
      console.error("Admin data load error:", err);
      showToast("Erro ao carregar dados do painel.", "error");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Metrics calculated dynamically
  const metrics: AdminMetrics = calculateAdminMetrics(orders, products);

  // Unique customer count for sidebar badge
  const uniqueCustomerCount = React.useMemo(() => {
    const keys = new Set<string>();
    orders.forEach((o) => {
      if (o.customerEmail) keys.add(o.customerEmail.toLowerCase().trim());
      else if (o.customerPhone) keys.add(o.customerPhone.trim());
      else if (o.customerName) keys.add(o.customerName.toLowerCase().trim());
    });
    return keys.size;
  }, [orders]);

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    trackingCode?: string
  ) => {
    setIsSavingOrder(true);
    try {
      const ok = await updateAdminOrderStatus(orderId, newStatus, trackingCode);
      if (ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: newStatus,
                  trackingCode: trackingCode !== undefined ? trackingCode : o.trackingCode,
                }
              : o
          )
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: newStatus,
                  trackingCode: trackingCode !== undefined ? trackingCode : prev.trackingCode,
                }
              : null
          );
        }
        showToast(`Pedido ${orderId} atualizado para ${newStatus}!`, "success");
      } else {
        showToast("Não foi possível atualizar o pedido.", "error");
      }
    } catch {
      showToast("Erro ao salvar atualização.", "error");
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Handle Product Save
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name || !editingProduct?.price || !editingProduct?.category) {
      showToast("Preencha nome, preço e categoria do produto.", "error");
      return;
    }

    setIsSavingProduct(true);
    try {
      const productId =
        editingProduct.id ||
        "prod-" + Math.floor(1000 + Math.random() * 9000);

      const productSlug =
        editingProduct.slug ||
        editingProduct.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

      const selectedCat = categories.find((c) => c.id === editingProduct.category);
      const selectedCol = collections.find((c) => c.id === editingProduct.collectionId);

      const fullProduct: Product = {
        id: productId,
        slug: productSlug,
        name: editingProduct.name,
        shortDescription: editingProduct.shortDescription || "Presente sofisticado com acabamento impecável.",
        description: editingProduct.description || "Produto premium para presentear com elegância.",
        category: editingProduct.category as ProductCategory,
        categoryName: selectedCat ? selectedCat.name : editingProduct.categoryName || editingProduct.category,
        collectionId: editingProduct.collectionId || undefined,
        collectionName: selectedCol ? selectedCol.name : undefined,
        price: Number(editingProduct.price),
        promotionalPrice: editingProduct.promotionalPrice ? Number(editingProduct.promotionalPrice) : undefined,
        costPrice: editingProduct.costPrice !== undefined && editingProduct.costPrice !== null && !isNaN(Number(editingProduct.costPrice)) ? Number(editingProduct.costPrice) : undefined,
        installments: editingProduct.installments || BRAND_CONFIG.maxInstallmentsWithoutInterest || 10,
        stock: Number(editingProduct.stock) || 0,
        sku: editingProduct.sku || `NDM-${productId.toUpperCase()}`,
        images:
          editingProduct.images && editingProduct.images.length > 0
            ? editingProduct.images
            : ["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"],
        variants: editingProduct.variants || [],
        featured: Boolean(editingProduct.featured),
        bestseller: Boolean(editingProduct.bestseller),
        isKit: Boolean(editingProduct.isKit),
        kitPackaging: editingProduct.kitPackaging,
        kitItems: editingProduct.kitItems || [],
        specifications: editingProduct.specifications || {
          warranty: "30 dias contra defeitos",
          origin: "Nacional",
        },
      };

      const ok = await saveAdminProduct(fullProduct);
      if (ok) {
        setProducts((prev) => {
          const exists = prev.some((p) => p.id === fullProduct.id);
          if (exists) {
            return prev.map((p) => (p.id === fullProduct.id ? fullProduct : p));
          }
          return [fullProduct, ...prev];
        });
        showToast("Produto salvo com sucesso no Firestore!", "success");
        setIsProductModalOpen(false);
        setEditingProduct(null);
      } else {
        showToast("Erro ao gravar produto.", "error");
      }
    } catch {
      showToast("Erro ao processar produto.", "error");
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Handle Product Delete
  const handleDeleteProduct = async (productId: string, name: string) => {
    if (confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      const ok = await deleteAdminProduct(productId);
      if (ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        showToast(`Produto "${name}" removido.`, "success");
      } else {
        showToast("Erro ao excluir produto.", "error");
      }
    }
  };

  // Handle Quick Stock Update
  const handleQuickStockChange = async (product: Product, delta: number) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    const updated = { ...product, stock: newStock };
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updated : p)));
    await saveAdminProduct(updated);
    showToast(`Estoque de "${product.name}" atualizado para ${newStock} un.`, "info");
  };

  // Handle Coupon Save
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) {
      showToast("Digite o código do cupom.", "error");
      return;
    }
    const cpn: Coupon = {
      code: newCoupon.code.toUpperCase().trim(),
      description: newCoupon.description || "Desconto especial",
      discountPercent: newCoupon.discountPercent ? Number(newCoupon.discountPercent) : undefined,
      discountValue: newCoupon.discountValue ? Number(newCoupon.discountValue) : undefined,
      minOrder: Number(newCoupon.minOrder) || 0,
      active: newCoupon.active !== false,
      usageCount: 0,
    };

    const ok = await saveAdminCoupon(cpn);
    if (ok) {
      setCoupons((prev) => [cpn, ...prev.filter((c) => c.code !== cpn.code)]);
      showToast(`Cupom ${cpn.code} salvo com sucesso!`, "success");
      setIsCouponModalOpen(false);
      setNewCoupon({ code: "", description: "", discountPercent: 10, minOrder: 100, active: true });
    }
  };

  // Handle Coupon Delete
  const handleDeleteCoupon = async (code: string) => {
    if (confirm(`Deseja remover o cupom ${code}?`)) {
      await deleteAdminCoupon(code);
      setCoupons((prev) => prev.filter((c) => c.code !== code));
      showToast(`Cupom ${code} removido.`, "info");
    }
  };

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.customer?.name || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.customer?.email || "").toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.trackingCode || "").toLowerCase().includes(orderSearch.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.categoryName || "").toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.collectionName || "").toLowerCase().includes(productSearch.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    const matchesCollection = collectionFilter === "ALL" || p.collectionId === collectionFilter;

    let matchesStock = true;
    if (stockFilter === "LOW") matchesStock = (p.stock || 0) <= 5 && (p.stock || 0) > 0;
    if (stockFilter === "OUT") matchesStock = (p.stock || 0) === 0;
    if (stockFilter === "IN_STOCK") matchesStock = (p.stock || 0) > 5;

    return matchesSearch && matchesCategory && matchesCollection && matchesStock;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PEDIDO_REALIZADO":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 w-max">
            <Clock className="w-3 h-3" /> Aguardando Pagamento
          </span>
        );
      case "PAGAMENTO_CONFIRMADO":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-max">
            <CheckCircle2 className="w-3 h-3" /> Pagamento Confirmado
          </span>
        );
      case "EM_SEPARACAO":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1 w-max">
            <Boxes className="w-3 h-3" /> Em Separação
          </span>
        );
      case "ENVIADO":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1 w-max">
            <Truck className="w-3 h-3" /> Enviado / Em Trânsito
          </span>
        );
      case "ENTREGUE":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-900 text-white flex items-center gap-1 w-max">
            <Check className="w-3 h-3" /> Entregue ao Cliente
          </span>
        );
      case "CANCELADO":
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1 w-max">
            <X className="w-3 h-3" /> Cancelado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans text-stone-900 overflow-x-hidden">
      {/* MOBILE BACKDROP */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* ========================================================================= */}
      {/* SIDEBAR (ESTILO NUVEMSHOP & MERCADO PAGO COM SCROLL PERFEITO) */}
      {/* ========================================================================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-stone-200/80 flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${sidebarCollapsed ? "lg:w-20" : "lg:w-64"} w-64 shadow-2xl lg:shadow-none select-none`}
      >
        {/* TOP: Brand Header + Collapse Button */}
        <div className="p-4 flex items-center justify-between border-b border-stone-100 min-h-[64px] shrink-0 bg-white">
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Store brand icon badge */}
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <Store className="w-5 h-5 text-stone-950" />
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <h2 className="font-extrabold text-xs tracking-tight text-stone-950 truncate uppercase">
                  {storeOperationsSettings.name || BRAND_CONFIG.name}
                </h2>
                <span className="text-[10px] font-semibold text-stone-400 block truncate">
                  Painel do Lojista
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle / Mobile close */}
          <div className="flex items-center">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION ITEMS (SCROLLABLE AREA - NUVEMSHOP & SHOPIFY ARCHITECTURE) */}
        <div className="flex-1 min-h-0 overflow-y-auto py-3 px-2.5 space-y-4 text-xs">
          {/* GROUP 1: INÍCIO & ESTATÍSTICAS */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Principal & Análise
              </span>
            )}
            <div className="space-y-0.5">
              {/* INÍCIO */}
              <button
                onClick={() => {
                  setActiveTab("metrics");
                  setMetricsSubView("overview");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "metrics" && metricsSubView === "overview"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Início / Visão Geral"
              >
                <Home className={`w-4 h-4 shrink-0 ${activeTab === "metrics" && metricsSubView === "overview" ? "text-amber-600" : "text-stone-500"}`} />
                {!sidebarCollapsed && <span className="truncate">Início</span>}
              </button>

              {/* ESTATÍSTICAS PARENT */}
              <div>
                <button
                  onClick={() => {
                    if (activeTab !== "metrics") {
                      setActiveTab("metrics");
                    }
                    setStatsMenuOpen(!statsMenuOpen);
                    if (sidebarCollapsed) setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                    activeTab === "metrics"
                      ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                      : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                  } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                  title="Estatísticas & Análises"
                >
                  <div className="flex items-center gap-3 truncate">
                    <BarChart3 className={`w-4 h-4 shrink-0 ${activeTab === "metrics" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                    {!sidebarCollapsed && <span className="truncate">Estatísticas</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-stone-400 hover:text-stone-700">
                      {statsMenuOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </button>

                {/* ESTATÍSTICAS SUBMENU */}
                {!sidebarCollapsed && statsMenuOpen && (
                  <div className="mt-1 ml-4 pl-2 border-l border-stone-200/80 space-y-0.5 animate-in fade-in duration-150">
                    <button
                      onClick={() => {
                        setActiveTab("metrics");
                        setMetricsSubView("overview");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "metrics" && metricsSubView === "overview"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <LayoutDashboard className={`w-3 h-3 shrink-0 ${activeTab === "metrics" && metricsSubView === "overview" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">Visão geral</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("metrics");
                        setMetricsSubView("products");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "metrics" && metricsSubView === "products"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <Package className={`w-3 h-3 shrink-0 ${activeTab === "metrics" && metricsSubView === "products" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">Produtos</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("metrics");
                        setMetricsSubView("sales_customers");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "metrics" && metricsSubView === "sales_customers"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <ShoppingBag className={`w-3 h-3 shrink-0 ${activeTab === "metrics" && metricsSubView === "sales_customers" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">Vendas e clientes</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("metrics");
                        setMetricsSubView("visits");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "metrics" && metricsSubView === "visits"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <TrendingUp className={`w-3 h-3 shrink-0 ${activeTab === "metrics" && metricsSubView === "visits" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">Visitas & Funil</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("metrics");
                        setMetricsSubView("coupons");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "metrics" && metricsSubView === "coupons"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <Tag className={`w-3 h-3 shrink-0 ${activeTab === "metrics" && metricsSubView === "coupons" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">Relatório de cupons</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GROUP 2: GESTÃO & VENDAS */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Gestão & Operação
              </span>
            )}
            <div className="space-y-0.5">
              {/* VENDAS */}
              <button
                onClick={() => {
                  setActiveTab("orders");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "orders"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2 relative" : ""}`}
                title="Vendas & Pedidos"
              >
                <div className="flex items-center gap-3 truncate">
                  <ShoppingBag className={`w-4 h-4 shrink-0 ${activeTab === "orders" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Vendas</span>}
                </div>
                {metrics.pendingOrdersCount > 0 && (
                  <span
                    className={`${
                      sidebarCollapsed
                        ? "absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"
                        : "px-2 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px]"
                    }`}
                  >
                    {!sidebarCollapsed && metrics.pendingOrdersCount}
                  </span>
                )}
              </button>

              {/* CARRINHOS ABANDONADOS (IA GEMINI) */}
              <button
                onClick={() => {
                  setActiveTab("abandoned_carts");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "abandoned_carts"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2 relative" : ""}`}
                title="Carrinhos Abandonados (IA)"
              >
                <div className="flex items-center gap-3 truncate">
                  <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === "abandoned_carts" ? "text-amber-600 font-bold" : "text-amber-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Carrinhos Abandonados</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] uppercase tracking-wider">
                    IA
                  </span>
                )}
              </button>

              {/* INTELIGÊNCIA ARTIFICIAL & RELATÓRIOS Z-API */}
              <button
                onClick={() => {
                  setActiveTab("ai_agent");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "ai_agent"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Inteligência Artificial"
              >
                <div className="flex items-center gap-3 truncate">
                  <Bot className={`w-4 h-4 shrink-0 ${activeTab === "ai_agent" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Inteligência Artificial</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    Z-API
                  </span>
                )}
              </button>

              {/* PRODUTOS PARENT */}
              <div>
                <button
                  onClick={() => {
                    if (activeTab !== "products" && activeTab !== "categories" && activeTab !== "collections") {
                      setActiveTab("products");
                    }
                    setProductsMenuOpen(!productsMenuOpen);
                    if (sidebarCollapsed) setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                    activeTab === "products" || activeTab === "categories" || activeTab === "collections"
                      ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                      : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                  } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                  title="Produtos & Catálogo"
                >
                  <div className="flex items-center gap-3 truncate">
                    <Package className={`w-4 h-4 shrink-0 ${activeTab === "products" || activeTab === "categories" || activeTab === "collections" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                    {!sidebarCollapsed && <span className="truncate">Produtos</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-stone-400 hover:text-stone-700">
                      {productsMenuOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </button>

                {/* PRODUTOS SUBMENU */}
                {!sidebarCollapsed && productsMenuOpen && (
                  <div className="mt-1 ml-4 pl-2 border-l border-stone-200/80 space-y-0.5 animate-in fade-in duration-150">
                    <button
                      onClick={() => {
                        setActiveTab("products");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "products"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <span className="truncate">Todos os produtos</span>
                      {metrics.lowStockProductsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                          {metrics.lowStockProductsCount}
                        </span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("categories");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "categories"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <span className="truncate">Categorias</span>
                      {categories.length > 0 && (
                        <span className="text-[10px] text-stone-400">{categories.length}</span>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("collections");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "collections"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <span className="truncate">Coleções & Linhas</span>
                      {collections.length > 0 && (
                        <span className="text-[10px] text-stone-400">{collections.length}</span>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* CLIENTES (CRM) */}
              <button
                onClick={() => {
                  setActiveTab("customers");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "customers"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Clientes & CRM"
              >
                <div className="flex items-center gap-3 truncate">
                  <Users className={`w-4 h-4 shrink-0 ${activeTab === "customers" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Clientes</span>}
                </div>
                {!sidebarCollapsed && uniqueCustomerCount > 0 && (
                  <span className="text-[10px] font-semibold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                    {uniqueCustomerCount}
                  </span>
                )}
              </button>

              {/* PRECIFICAÇÃO & MARGEM */}
              <button
                onClick={() => {
                  setActiveTab("pricing");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "pricing"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Precificação & Markup Gross-Up"
              >
                <div className="flex items-center gap-3 truncate">
                  <Percent className={`w-4 h-4 shrink-0 ${activeTab === "pricing" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Precificação & Markup</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md">
                    Gross-Up
                  </span>
                )}
              </button>

              {/* FISCAL & NOTAS FISCAIS */}
              <button
                onClick={() => {
                  setActiveTab("fiscal");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "fiscal"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Fiscal & NF-e SEFAZ (mod. 55)"
              >
                <div className="flex items-center gap-3 truncate">
                  <FileText className={`w-4 h-4 shrink-0 ${activeTab === "fiscal" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Fiscal & NF-e</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-md">
                    SEFAZ
                  </span>
                )}
              </button>

              {/* FINANCEIRO */}
              <button
                onClick={() => {
                  setActiveTab("finance");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "finance"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Gestão Financeira & DRE"
              >
                <DollarSign className={`w-4 h-4 shrink-0 ${activeTab === "finance" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                {!sidebarCollapsed && (
                  <div className="flex items-center justify-between flex-1 truncate">
                    <span className="truncate">Financeiro</span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                      DRE
                    </span>
                  </div>
                )}
              </button>

              {/* CUPONS */}
              <button
                onClick={() => {
                  setActiveTab("coupons");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "coupons"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Cupons de Desconto"
              >
                <div className="flex items-center gap-3 truncate">
                  <Tag className={`w-4 h-4 shrink-0 ${activeTab === "coupons" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Descontos</span>}
                </div>
                {!sidebarCollapsed && coupons.length > 0 && (
                  <span className="text-[10px] text-stone-400 font-medium">{coupons.length}</span>
                )}
              </button>

              {/* PROVA SOCIAL & UGC */}
              <button
                onClick={() => {
                  setActiveTab("ugc");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "ugc"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Prova Social & UGC dos Clientes"
              >
                <div className="flex items-center gap-3 truncate">
                  <Camera className={`w-4 h-4 shrink-0 ${activeTab === "ugc" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Prova Social (UGC)</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[9px] font-bold bg-pink-100 text-pink-800 px-1.5 py-0.5 rounded-md">
                    Fotos
                  </span>
                )}
              </button>

              {/* INDIQUE & GANHE (MGM) */}
              <button
                onClick={() => {
                  setActiveTab("referral");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "referral"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Indique & Ganhe (MGM)"
              >
                <div className="flex items-center gap-3 truncate">
                  <Share2 className={`w-4 h-4 shrink-0 ${activeTab === "referral" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Indique & Ganhe</span>}
                </div>
                {!sidebarCollapsed && (
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                    MGM
                  </span>
                )}
              </button>

              {/* LEMBRETES DE OCASIÃO */}
              <button
                onClick={() => {
                  setActiveTab("occasions");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "occasions"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Lembretes de Ocasião (Zero-Party Data)"
              >
                <div className="flex items-center gap-3 truncate">
                  <Calendar className={`w-4 h-4 shrink-0 ${activeTab === "occasions" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Lembretes de Datas</span>}
                </div>
              </button>

              {/* MARKETING PARENT */}
              <div>
                <button
                  onClick={() => {
                    if (activeTab !== "marketing") {
                      setActiveTab("marketing");
                    }
                    setMarketingMenuOpen(!marketingMenuOpen);
                    if (sidebarCollapsed) setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                    activeTab === "marketing"
                      ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                      : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                  } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                  title="Marketing, SEO & Pixels"
                >
                  <div className="flex items-center gap-3 truncate">
                    <Sparkles className={`w-4 h-4 shrink-0 ${activeTab === "marketing" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                    {!sidebarCollapsed && <span className="truncate">Marketing</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-stone-400 hover:text-stone-700">
                      {marketingMenuOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </button>

                {/* MARKETING SUBMENU */}
                {!sidebarCollapsed && marketingMenuOpen && (
                  <div className="mt-1 ml-4 pl-2 border-l border-stone-200/80 space-y-0.5 animate-in fade-in duration-150">
                    <button
                      onClick={() => {
                        setActiveTab("marketing");
                        setMarketingSection("trackers");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "marketing" && marketingSection === "trackers"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <Zap className={`w-3 h-3 shrink-0 ${activeTab === "marketing" && marketingSection === "trackers" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">1. Pixels & Tags (GTM, Meta)</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("marketing");
                        setMarketingSection("seo");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "marketing" && marketingSection === "seo"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <Globe className={`w-3 h-3 shrink-0 ${activeTab === "marketing" && marketingSection === "seo" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">2. SEO & Redes Sociais</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("marketing");
                        setMarketingSection("scripts");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "marketing" && marketingSection === "scripts"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <Code className={`w-3 h-3 shrink-0 ${activeTab === "marketing" && marketingSection === "scripts" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">3. Scripts Personalizados</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* GROUP 3: CANAIS DE VENDA */}
          <div>
            {!sidebarCollapsed && (
              <span className="px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Canais de Venda
              </span>
            )}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setActiveTab("banners");
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                  activeTab === "banners"
                    ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                    : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                title="Banners & Vitrines"
              >
                <div className="flex items-center gap-3 truncate">
                  <SlidersHorizontal className={`w-4 h-4 shrink-0 ${activeTab === "banners" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                  {!sidebarCollapsed && <span className="truncate">Banners & Vitrines</span>}
                </div>
                {!sidebarCollapsed && heroBanners.length > 0 && (
                  <span className="text-[10px] text-stone-400 font-medium">{heroBanners.length}</span>
                )}
              </button>
            </div>
          </div>

          {/* GROUP 4: CONFIGURAÇÕES */}
          <div className="pb-2">
            {!sidebarCollapsed && (
              <span className="px-3 text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Configurações
              </span>
            )}
            <div className="space-y-0.5">
              {/* CONFIGURAÇÕES DA LOJA PARENT */}
              <div>
                <button
                  onClick={() => {
                    if (activeTab !== "settings") {
                      setActiveTab("settings");
                    }
                    setSettingsMenuOpen(!settingsMenuOpen);
                    if (sidebarCollapsed) setMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition-all ${
                    activeTab === "settings"
                      ? "bg-amber-500/10 text-amber-950 font-bold border border-amber-500/30 shadow-xs"
                      : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-950"
                  } ${sidebarCollapsed ? "justify-center px-2" : ""}`}
                  title="Configurações da Loja"
                >
                  <div className="flex items-center gap-3 truncate">
                    <Settings className={`w-4 h-4 shrink-0 ${activeTab === "settings" ? "text-amber-600 font-bold" : "text-stone-500"}`} />
                    {!sidebarCollapsed && <span className="truncate">Configurações</span>}
                  </div>
                  {!sidebarCollapsed && (
                    <span className="text-stone-400 hover:text-stone-700">
                      {settingsMenuOpen ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </span>
                  )}
                </button>

                {/* CONFIGURAÇÕES SUBMENU ITEMS (1, 2, 3, 4, 5) */}
                {!sidebarCollapsed && settingsMenuOpen && (
                  <div className="mt-1 ml-4 pl-2 border-l border-stone-200/80 space-y-0.5 animate-in fade-in duration-150">
                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setSettingsSection("identity");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "settings" && settingsSection === "identity"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <Building2 className={`w-3 h-3 shrink-0 ${activeTab === "settings" && settingsSection === "identity" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">1. Identidade & Contato</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setSettingsSection("shipping");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "settings" && settingsSection === "shipping"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <Truck className={`w-3 h-3 shrink-0 ${activeTab === "settings" && settingsSection === "shipping" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">2. Frete & Logística</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setSettingsSection("payment");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "settings" && settingsSection === "payment"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <CreditCard className={`w-3 h-3 shrink-0 ${activeTab === "settings" && settingsSection === "payment" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">3. Pagamento & PIX</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setSettingsSection("announcement");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "settings" && settingsSection === "announcement"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <Megaphone className={`w-3 h-3 shrink-0 ${activeTab === "settings" && settingsSection === "announcement" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">4. Avisos & Políticas</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab("settings");
                        setSettingsSection("database");
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] transition-all text-left ${
                        activeTab === "settings" && settingsSection === "database"
                          ? "bg-amber-500/15 text-amber-950 font-bold"
                          : "text-stone-500 hover:text-stone-900 hover:bg-stone-100/70"
                      }`}
                    >
                      <ShieldCheck className={`w-3 h-3 shrink-0 ${activeTab === "settings" && settingsSection === "database" ? "text-amber-600 font-bold" : "text-stone-400"}`} />
                      <span className="truncate">5. Status do Firestore</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR FOOTER: FIRESTORE STATUS & SHORTCUTS (FIXED AT BOTTOM, NO OVERLAP) */}
        <div className="p-3 border-t border-stone-100 bg-stone-50/50 space-y-2 shrink-0">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-emerald-800 truncate">
                Firestore Sincronizado
              </span>
            </div>
          )}

          <button
            onClick={onNavigateHome}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors ${
              sidebarCollapsed ? "justify-center px-2" : ""
            }`}
            title="Ver Loja Virtual"
          >
            <ExternalLink className="w-4 h-4 text-stone-500 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Ver Loja Virtual</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* RIGHT MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* TOP NAVBAR ESTILO MERCADO PAGO */}
        <header className="sticky top-0 z-30 bg-white border-b border-stone-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-stone-950 tracking-tight flex items-center gap-2 truncate">
                {getTabInfo().title}
              </h1>
              <p className="text-xs text-stone-500 hidden sm:block truncate">
                {getTabInfo().subtitle}
              </p>
            </div>
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sincronizar Button */}
            <button
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Sincronizar com Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-amber-600" : ""}`} />
              <span className="hidden md:inline">Sincronizar</span>
            </button>

            {/* Mercado Pago style notification bell */}
            <button
              onClick={() => setActiveTab("orders")}
              className="relative p-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors"
              title="Notificações de pedidos"
            >
              <Bell className="w-4 h-4" />
              {metrics.pendingOrdersCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-400 text-stone-950 font-black text-[9px] flex items-center justify-center shadow-xs">
                  {metrics.pendingOrdersCount}
                </span>
              )}
            </button>

            {/* Store Badge chip (like CM360 chip in Mercado Pago screenshot) */}
            <div className="flex items-center gap-2 pl-2 border-l border-stone-200">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-stone-100 border border-stone-200/80 text-stone-800 text-xs font-bold">
                <div className="w-5 h-5 rounded-full bg-stone-950 text-amber-400 font-extrabold text-[10px] flex items-center justify-center">
                  {storeOperationsSettings.name?.charAt(0) || "L"}
                </div>
                <span className="hidden sm:inline font-bold truncate max-w-[120px]">
                  {storeOperationsSettings.shortName || storeOperationsSettings.name}
                </span>
              </div>
            </div>

            {/* Botão Baixar Dossiê MD */}
            <a
              href="/dossie-painel-lojista.md"
              download="DOSSIE_PAINEL_LOJISTA.md"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Baixar Dossiê Completo em formato Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar Dossiê (.MD)</span>
            </a>

            {/* Botão Ver Loja */}
            <button
              onClick={onNavigateHome}
              className="px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Loja</span>
            </button>
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
              <p className="text-sm font-semibold text-stone-600">
                Carregando dados da loja no Firestore...
              </p>
            </div>
          ) : (
            <>
              {/* Contextual AI Insight Banner on Top of Active View */}
              {activeTab === "metrics" && (
                <InsightBanner
                  title="IA Insights: Análise de Vendas e Desempenho"
                  insight={`Receita consolidada de R$ ${metrics.totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} com ticket médio de R$ ${metrics.averageTicket.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}. O Ranking dos Mais Vendidos agora possui filtros Top 5/Top 10 e tendências sparkline.`}
                  actionLabel="Abrir Copiloto IA"
                  onAction={() => setIsCopilotOpen(true)}
                  badge="Visão Geral"
                  type="growth"
                />
              )}

              {activeTab === "orders" && (
                <InsightBanner
                  title="IA Logística: Fila Operacional de Envios"
                  insight={`Você possui ${metrics.pendingOrdersCount} pedido(s) aguardando processamento ou despacho. Utilize o rastreamento integrado e notificação WhatsApp para manter a taxa de satisfação alta.`}
                  actionLabel="Filtrar Pendentes"
                  onAction={() => setStatusFilter("PEDIDO_REALIZADO")}
                  badge="Operação"
                  type="alert"
                />
              )}

              {activeTab === "abandoned_carts" && (
                <InsightBanner
                  title="IA Conversão: Recuperação Inteligente de Checkouts"
                  insight="Modelos generativos do Gemini elaboram mensagens personalizadas considerando os itens do carrinho e histórico do cliente para disparo via WhatsApp Z-API."
                  actionLabel="Ver Automações"
                  onAction={() => setActiveTab("ai_agent")}
                  badge="IA Ativa"
                  type="growth"
                />
              )}

              {activeTab === "ai_agent" && (
                <InsightBanner
                  title="IA Autônoma: Resumo Executivo das 09:00 AM"
                  insight="O Agendador Cron executa diariamente a compilação de faturamento, pedidos e alertas de estoque, disparando o relatório formatado diretamente para seu WhatsApp."
                  actionLabel="Conversar com Copiloto"
                  onAction={() => setIsCopilotOpen(true)}
                  badge="Z-API Online"
                  type="neutral"
                />
              )}

              {activeTab === "products" && (
                <InsightBanner
                  title="IA Estoque: Gestão de Inventário e Reposição"
                  insight={`${metrics.lowStockProductsCount} produto(s) no catálogo estão com estoque inferior a 5 unidades. Evite perda de vendas repondo os itens com maior velocidade de saída.`}
                  actionLabel="Ver Estoque Crítico"
                  onAction={() => setStockFilter("LOW")}
                  badge="Inventário"
                  type={metrics.lowStockProductsCount > 0 ? "alert" : "neutral"}
                />
              )}

            {/* ========================================================================= */}
            {/* TAB 1: VISÃO GERAL / MÉTRICAS (ESTATÍSTICAS) */}
            {/* ========================================================================= */}
            {activeTab === "metrics" && (
              <MetricsManager
                orders={orders}
                products={products}
                coupons={coupons}
                onNavigateToOrders={() => setActiveTab("orders")}
                onNavigateToProducts={() => setActiveTab("products")}
                onNavigateToCoupons={() => setActiveTab("coupons")}
                onNavigateToAI={() => setActiveTab("ai_agent")}
                subView={metricsSubView}
                onSubViewChange={(view) => setMetricsSubView(view)}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB 1.2: CLIENTES (PAINEL DO LOJISTA GLOS) */}
            {/* ========================================================================= */}
            {activeTab === "customers" && (
              <CustomerManager
                orders={orders}
                onViewOrder={(order) => {
                  setSelectedOrder(order);
                  setActiveTab("orders");
                }}
                onNavigateToOrders={() => setActiveTab("orders")}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB 1.5: GESTÃO FINANCEIRA & DRE */}
            {/* ========================================================================= */}
            {activeTab === "finance" && (
              <FinancialManager
                orders={orders}
                products={products}
                onNavigateToOrders={() => setActiveTab("orders")}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB 1.8: RECUPERAÇÃO DE CARRINHOS ABANDONADOS (IA GEMINI) */}
            {/* ========================================================================= */}
            {activeTab === "abandoned_carts" && (
              <AbandonedCartsManager showToast={showToast} />
            )}

            {/* ========================================================================= */}
            {/* TAB 1.9: INTELIGÊNCIA ARTIFICIAL & RELATÓRIOS Z-API */}
            {/* ========================================================================= */}
            {activeTab === "ai_agent" && (
              <AIManager
                orders={orders}
                products={products}
                onShowNotification={(type, text) => showToast(text, type === "error" ? "error" : "success")}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB 2: GESTÃO DE PEDIDOS */}
            {/* ========================================================================= */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                {/* SEARCH AND FILTERS */}
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Buscar por ID, cliente, email ou código de rastreio..."
                      className="w-full pl-9 pr-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-stone-500 font-medium">Status:</span>
                    {[
                      { id: "ALL", label: "Todos" },
                      { id: "PEDIDO_REALIZADO", label: "Aguardando" },
                      { id: "PAGAMENTO_CONFIRMADO", label: "Pago" },
                      { id: "EM_SEPARACAO", label: "Separação" },
                      { id: "ENVIADO", label: "Enviados" },
                      { id: "ENTREGUE", label: "Entregues" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setStatusFilter(st.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          statusFilter === st.id
                            ? "bg-stone-950 text-white"
                            : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ORDERS LIST */}
                <div className="space-y-4">
                  {filteredOrders.map((ord) => (
                    <OrderRow
                      key={ord.id}
                      order={ord}
                      onUpdateStatus={(status) => handleUpdateOrderStatus(ord.id, status)}
                      onManageDispatch={() => {
                        setSelectedOrder(ord);
                        setEditingStatus(ord.status);
                        setEditingTrackingCode(ord.trackingCode || "");
                      }}
                      onShowNotification={(type, msg) => showToast(msg, type === "error" ? "error" : "success")}
                    />
                  ))}

                  {filteredOrders.length === 0 && (
                    <div className="py-16 text-center bg-white rounded-3xl border border-stone-200 p-8 space-y-2">
                      <ShoppingBag className="w-10 h-10 text-stone-300 mx-auto" />
                      <h3 className="font-bold text-stone-700 text-sm">Nenhum pedido encontrado</h3>
                      <p className="text-xs text-stone-400">
                        Tente ajustar os termos de pesquisa ou o filtro de status.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: CATÁLOGO & ESTOQUE */}
            {/* ========================================================================= */}
            {activeTab === "products" && (
              <div className="space-y-6">
                {/* TOOLBAR */}
                <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar por nome, SKU ou categoria de presente..."
                      className="w-full pl-9 pr-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900"
                    >
                      <option value="ALL">Todas as Categorias</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={collectionFilter}
                      onChange={(e) => setCollectionFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900"
                    >
                      <option value="ALL">Todas as Coleções</option>
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={stockFilter}
                      onChange={(e) => setStockFilter(e.target.value)}
                      className="px-3 py-2 text-xs font-semibold bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900"
                    >
                      <option value="ALL">Todos os Estoques</option>
                      <option value="LOW">Estoque Baixo (≤ 5 un)</option>
                      <option value="OUT">Esgotados (0 un)</option>
                      <option value="IN_STOCK">Em Estoque (&gt; 5 un)</option>
                    </select>

                    <button
                      onClick={() => {
                        setEditingProduct({
                          name: "",
                          price: 149.9,
                          stock: 20,
                          category: (categories[0]?.id as any) || "presentes-criativos",
                          categoryName: categories[0]?.name || "Presentes Criativos",
                          images: [],
                          variants: [],
                          featured: false,
                          bestseller: false,
                          isKit: false,
                        });
                        setIsProductModalOpen(true);
                      }}
                      className="px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Novo Produto</span>
                    </button>
                  </div>
                </div>

                {/* PRODUCTS TABLE */}
                <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase text-[10px] tracking-wider">
                          <th className="py-3.5 px-4 font-bold">Produto</th>
                          <th className="py-3.5 px-4 font-bold">Categoria</th>
                          <th className="py-3.5 px-4 font-bold">Venda / Promo</th>
                          <th className="py-3.5 px-4 font-bold">Custo / Margem</th>
                          <th className="py-3.5 px-4 font-bold">Estoque</th>
                          <th className="py-3.5 px-4 font-bold">Destaques</th>
                          <th className="py-3.5 px-4 font-bold text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredProducts.map((prod) => (
                          <tr key={prod.id} className="hover:bg-stone-50/70 transition-colors">
                            {/* Product Info */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={prod.images[0]}
                                  alt={prod.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0"
                                />
                                <div>
                                  <h4 className="font-bold text-stone-950 hover:text-amber-700 cursor-pointer transition-colors"
                                    onClick={() => onNavigateProduct && onNavigateProduct(prod.slug)}
                                  >
                                    {prod.name}
                                  </h4>
                                  <span className="text-[10px] font-mono text-stone-400">
                                    SKU: {prod.sku} • ID: {prod.id}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 font-semibold text-[11px]">
                                {prod.categoryName || prod.category}
                              </span>
                            </td>

                            {/* Sale / Promo Price */}
                            <td className="py-3 px-4">
                              <span className="font-bold text-stone-950 block">
                                R$ {prod.price.toFixed(2)}
                              </span>
                              {prod.promotionalPrice ? (
                                <span className="font-bold text-emerald-700 bg-emerald-50 text-[11px] px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                                  R$ {prod.promotionalPrice.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400">Sem promoção</span>
                              )}
                            </td>

                            {/* Cost & Profit Margin */}
                            <td className="py-3 px-4">
                              {prod.costPrice !== undefined && prod.costPrice > 0 ? (
                                <div>
                                  <span className="text-xs font-semibold text-stone-700 block">
                                    Custo: R$ {prod.costPrice.toFixed(2)}
                                  </span>
                                  {(() => {
                                    const effectivePrice = prod.promotionalPrice || prod.price;
                                    const grossProfit = effectivePrice - prod.costPrice;
                                    const margin = effectivePrice > 0 ? (grossProfit / effectivePrice) * 100 : 0;
                                    return (
                                      <span className={`text-[10px] font-bold inline-block mt-0.5 px-1.5 py-0.2 rounded ${
                                        margin >= 45 ? "bg-emerald-50 text-emerald-700" : margin >= 25 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"
                                      }`}>
                                        +{margin.toFixed(0)}% (R$ {grossProfit.toFixed(2)})
                                      </span>
                                    );
                                  })()}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-xs text-stone-400 block">
                                    Est. R$ {(prod.price * 0.38).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-stone-400 italic">
                                    (Custo padrão 38%)
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Stock & Quick Stepper */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleQuickStockChange(prod, -1)}
                                  className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 font-bold text-stone-800 flex items-center justify-center transition-colors"
                                  title="Diminuir 1"
                                >
                                  -
                                </button>
                                <span
                                  className={`px-2.5 py-0.5 rounded-lg font-bold text-xs ${
                                    prod.stock === 0
                                      ? "bg-rose-100 text-rose-800"
                                      : prod.stock <= 5
                                      ? "bg-amber-100 text-amber-800"
                                      : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {prod.stock} un
                                </span>
                                <button
                                  onClick={() => handleQuickStockChange(prod, 1)}
                                  className="w-6 h-6 rounded-md bg-stone-100 hover:bg-stone-200 font-bold text-stone-800 flex items-center justify-center transition-colors"
                                  title="Aumentar 1"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Flags */}
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {prod.featured && (
                                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                                    Destaque
                                  </span>
                                )}
                                {prod.bestseller && (
                                  <span className="text-[10px] font-bold bg-purple-100 text-purple-900 px-1.5 py-0.5 rounded">
                                    Mais Vendido
                                  </span>
                                )}
                                {prod.isKit && (
                                  <span className="text-[10px] font-bold bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Gift className="w-2.5 h-2.5" /> Kit Box
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingProduct(prod);
                                    setIsProductModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-700 transition-colors"
                                  title="Editar Produto"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                  className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-700 transition-colors"
                                  title="Excluir Produto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
            {/* TAB: CATEGORIAS */}
            {/* ========================================================================= */}
            {activeTab === "categories" && (
              <CategoryManager
                categories={categories}
                onCategoriesUpdated={(cats) => setCategories(cats)}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB: COLEÇÕES & LINHAS COM VARIAÇÕES */}
            {/* ========================================================================= */}
            {activeTab === "collections" && (
              <CollectionManager
                collections={collections}
                onCollectionsUpdated={(cols) => setCollections(cols)}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB: BANNERS & HERO DINÂMICA */}
            {/* ========================================================================= */}
            {activeTab === "banners" && (
              <BannerManager
                heroBanners={heroBanners}
                editorialBanners={editorialBanners}
                categories={categories}
                onHeroBannersUpdated={(banners) => setHeroBanners(banners)}
                onEditorialBannersUpdated={(banners) => setEditorialBanners(banners)}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB: PRECIFICAÇÃO & MARKUP GROSS-UP */}
            {/* ========================================================================= */}
            {activeTab === "pricing" && (
              <PricingManager
                products={products}
                onShowNotification={(type, text) => showToast(text, type === "error" ? "error" : "success")}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB: FISCAL & NOTAS FISCAIS (SEFAZ MOD. 55) */}
            {/* ========================================================================= */}
            {activeTab === "fiscal" && (
              <FiscalManager
                orders={orders}
                onShowNotification={(type, text) => showToast(text, type === "error" ? "error" : "success")}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB: PROVA SOCIAL & UGC */}
            {/* ========================================================================= */}
            {activeTab === "ugc" && (
              <UGCManager
                onShowNotification={(type, text) => showToast(text, type === "error" ? "error" : "success")}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB: PROGRAMA INDIQUE & GANHE (MGM) */}
            {/* ========================================================================= */}
            {activeTab === "referral" && (
              <ReferralPanel
                onShowNotification={(type, text) => showToast(text, type === "error" ? "error" : "success")}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB: LEMBRETES DE OCASIÃO (ZERO-PARTY DATA) */}
            {/* ========================================================================= */}
            {activeTab === "occasions" && (
              <OccasionReminder
                onShowNotification={(type, text) => showToast(text, type === "error" ? "error" : "success")}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB 4: CUPONS DE DESCONTO & MOTOR DE VOUCHERS */}
            {/* ========================================================================= */}
            {activeTab === "coupons" && (
              <div className="space-y-6">
                <VoucherEngine
                  onCouponCreated={(coupon) => {
                    setCoupons((prev) => [coupon, ...prev]);
                    showToast(`Cupom ${coupon.code} ativado com sucesso!`, "success");
                  }}
                  onShowNotification={(type, text) => showToast(text, type === "error" ? "error" : "success")}
                />

                <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-bold text-stone-950">
                      Cupons Ativos no Firestore
                    </h2>
                    <p className="text-xs text-stone-500">
                      Cupons disponíveis para aplicação em checkout pelos clientes
                    </p>
                  </div>

                  <button
                    onClick={() => setIsCouponModalOpen(true)}
                    className="px-4 py-2 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Criação Rápida de Cupom</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {coupons.map((cpn) => (
                    <div
                      key={cpn.code}
                      className="bg-white rounded-3xl p-5 border border-stone-200 shadow-xs space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-sm px-2.5 py-1 bg-stone-950 text-white rounded-lg">
                          {cpn.code}
                        </span>
                        <button
                          onClick={() => handleDeleteCoupon(cpn.code)}
                          className="p-1 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Remover Cupom"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <h4 className="font-bold text-stone-900 text-xs">{cpn.description}</h4>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Válido para pedidos acima de R$ {cpn.minOrder?.toFixed(2) || "0,00"}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-extrabold">
                          {cpn.discountPercent
                            ? `${cpn.discountPercent}% OFF`
                            : `R$ ${cpn.discountValue?.toFixed(2)} OFF`}
                        </span>
                        <span className="text-[10px] text-stone-400 font-medium">
                          {cpn.usageCount || 0} usos registrados
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB: MARKETING, SEO & TRACKING (GTM, GA4, ADS, META) */}
            {/* ========================================================================= */}
            {activeTab === "marketing" && (
              <MarketingManager
                settings={marketingSettings}
                onSettingsUpdated={(updated) => setMarketingSettings(updated)}
                activeSubTab={marketingSection}
                onSubTabChange={(sec) => setMarketingSection(sec)}
              />
            )}

            {/* ========================================================================= */}
            {/* TAB: CONFIGURAÇÕES DA OPERAÇÃO & STATUS */}
            {/* ========================================================================= */}
            {activeTab === "settings" && (
              <StoreOperationsManager
                settings={storeOperationsSettings}
                onSettingsUpdated={(updated) => setStoreOperationsSettings(updated)}
                activeSection={settingsSection}
                onSectionChange={(sec) => setSettingsSection(sec)}
              />
            )}
          </>
        )}
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAR STATUS & RASTREIO DO PEDIDO */}
      {/* ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-950 text-base">
                    Gerenciar Pedido {selectedOrder.id}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Cliente: {selectedOrder.customer?.name} ({selectedOrder.customer?.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM: UPDATE STATUS & TRACKING */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1.5">
                  Atualizar Status do Pedido:
                </label>
                <select
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value as OrderStatus)}
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl font-semibold text-stone-900 focus:outline-none focus:border-stone-950"
                >
                  <option value="PEDIDO_REALIZADO">1. Aguardando Pagamento (PEDIDO_REALIZADO)</option>
                  <option value="PAGAMENTO_CONFIRMADO">2. Pagamento Aprovado (PAGAMENTO_CONFIRMADO)</option>
                  <option value="EM_SEPARACAO">3. Em Separação no Estoque (EM_SEPARACAO)</option>
                  <option value="ENVIADO">4. Enviado / Em Trânsito (ENVIADO)</option>
                  <option value="ENTREGUE">5. Entregue ao Destinatário (ENTREGUE)</option>
                  <option value="CANCELADO">6. Cancelado (CANCELADO)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1.5">
                  Código de Rastreamento (Correios / Jadlog / Loggi):
                </label>
                <input
                  type="text"
                  value={editingTrackingCode}
                  onChange={(e) => setEditingTrackingCode(e.target.value)}
                  placeholder="Ex: BR982143001SP"
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-900 focus:outline-none focus:border-stone-950 uppercase"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  O cliente poderá acompanhar a linha do tempo em tempo real com este código.
                </p>
              </div>

              {/* TIMELINE PREVIEW */}
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-800 block text-[11px]">
                  Histórico de Eventos do Pedido:
                </span>
                <div className="space-y-1.5">
                  {selectedOrder.statusHistory?.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] text-stone-600">
                      <span className="font-semibold text-stone-900">• {ev.label}</span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(ev.date).toLocaleString("pt-BR")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleUpdateOrderStatus(selectedOrder.id, editingStatus, editingTrackingCode)
                }
                disabled={isSavingOrder}
                className="px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                {isSavingOrder ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CADASTRO / EDIÇÃO DE PRODUTO */}
      {/* ========================================================================= */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-stone-950 text-white flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-950 text-base">
                    {editingProduct.id ? "Editar Produto" : "Cadastrar Novo Produto"}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Sincronização em tempo real no Firestore e catálogo da loja
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsProductModalOpen(false);
                  setEditingProduct(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    placeholder="Ex: Kit Box Luxo Café Gourmet com Caneca Cerâmica"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Categoria *
                  </label>
                  <select
                    value={editingProduct.category || (categories[0]?.id || "presentes-criativos")}
                    onChange={(e) => {
                      const selCat = categories.find((c) => c.id === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as ProductCategory,
                        categoryName: selCat ? selCat.name : e.target.options[e.target.selectedIndex].text,
                      });
                    }}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Coleção / Linha Temática (Opcional)
                  </label>
                  <select
                    value={editingProduct.collectionId || ""}
                    onChange={(e) => {
                      const selCol = collections.find((c) => c.id === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        collectionId: e.target.value || undefined,
                        collectionName: selCol ? selCol.name : undefined,
                      });
                    }}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  >
                    <option value="">Nenhuma (Produto Avulso)</option>
                    {collections.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Código SKU
                  </label>
                  <input
                    type="text"
                    value={editingProduct.sku || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    placeholder="Ex: NDM-BOX-009"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Preço Regular (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) })
                    }
                    placeholder="189.90"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Preço Promocional (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.promotionalPrice || ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        promotionalPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="159.90"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1 flex items-center justify-between">
                    <span>Custo Unitário (CMV) (R$)</span>
                    <span className="text-[10px] font-normal text-amber-700">Para métricas e DRE</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.costPrice ?? ""}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        costPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="Ex: 65.00"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  />
                  {editingProduct.price && editingProduct.costPrice && (
                    <p className="text-[10px] text-stone-500 mt-1">
                      Margem Bruta Estimada:{" "}
                      <span className="font-bold text-emerald-700">
                        {(
                          (((editingProduct.promotionalPrice || editingProduct.price) - editingProduct.costPrice) /
                            (editingProduct.promotionalPrice || editingProduct.price)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>{" "}
                      (Lucro: R${" "}
                      {(
                        (editingProduct.promotionalPrice || editingProduct.price) -
                        editingProduct.costPrice
                      ).toFixed(2)}
                      )
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Estoque Geral (un) *
                  </label>
                  <input
                    type="number"
                    required
                    value={editingProduct.stock ?? 10}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Parcelas Sem Juros
                  </label>
                  <input
                    type="number"
                    value={editingProduct.installments || BRAND_CONFIG.maxInstallmentsWithoutInterest || 10}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        installments: parseInt(e.target.value) || BRAND_CONFIG.maxInstallmentsWithoutInterest || 10,
                      })
                    }
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  />
                </div>

                {/* UPLOAD DE IMAGENS DO PRODUTO */}
                <div className="sm:col-span-2 pt-2 pb-1">
                  <ImageUploader
                    images={editingProduct.images || []}
                    onChange={(imgs) => setEditingProduct({ ...editingProduct, images: imgs })}
                    maxImages={6}
                    label="Galeria de Imagens do Produto"
                    helperText="Faça upload das fotos do produto ou cole links. A primeira foto será a capa principal."
                  />
                </div>

                {/* GESTOR DE VARIAÇÕES (CORES / MODELOS) */}
                <div className="sm:col-span-2 pt-2">
                  <VariantManager
                    variants={editingProduct.variants || []}
                    onChange={(vars) => setEditingProduct({ ...editingProduct, variants: vars })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">
                    Descrição Curta
                  </label>
                  <input
                    type="text"
                    value={editingProduct.shortDescription || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, shortDescription: e.target.value })
                    }
                    placeholder="Resumo em uma frase para cards e compartilhamento"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">
                    Descrição Completa & Detalhes
                  </label>
                  <textarea
                    rows={3}
                    value={editingProduct.description || ""}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, description: e.target.value })
                    }
                    placeholder="Detalhes completos sobre materiais, acabamento, dimensões e ocasiões recomendadas..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 text-xs"
                  />
                </div>

                {/* FLAGS CHECKBOXES */}
                <div className="sm:col-span-2 flex flex-wrap gap-4 pt-2 border-t border-stone-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.featured)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, featured: e.target.checked })
                      }
                      className="rounded text-stone-950"
                    />
                    <span className="font-bold text-stone-800">Destaque na Página Inicial</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.bestseller)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, bestseller: e.target.checked })
                      }
                      className="rounded text-stone-950"
                    />
                    <span className="font-bold text-stone-800">Selo Mais Vendido</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingProduct.isKit)}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, isKit: e.target.checked })
                      }
                      className="rounded text-stone-950"
                    />
                    <span className="font-bold text-stone-800">Kit / Caixa Presenteável</span>
                  </label>
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
                >
                  {isSavingProduct ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Salvar Produto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR NOVO CUPOM */}
      {/* ========================================================================= */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-950 text-base">Novo Cupom de Desconto</h3>
              </div>
              <button
                onClick={() => setIsCouponModalOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Código do Cupom (em maiúsculas) *
                </label>
                <input
                  type="text"
                  required
                  value={newCoupon.code || ""}
                  onChange={(e) =>
                    setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                  }
                  placeholder="Ex: DIADOSPAIS20"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Descrição da Promoção
                </label>
                <input
                  type="text"
                  value={newCoupon.description || ""}
                  onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  placeholder="Ex: 20% de desconto especial para presentes"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Desconto (%)
                  </label>
                  <input
                    type="number"
                    value={newCoupon.discountPercent || ""}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        discountPercent: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="15"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Valor Mínimo (R$)
                  </label>
                  <input
                    type="number"
                    value={newCoupon.minOrder || ""}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        minOrder: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="150"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Ativar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Persistent AI Copilot (FAB + Slide-over Panel) */}
      <CopilotFab
        onClick={() => setIsCopilotOpen(true)}
        unreadCount={metrics.pendingOrdersCount > 0 ? 1 : 0}
      />

      <CopilotPanel
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        metrics={metrics}
        recentOrders={orders.slice(0, 5)}
        topProducts={products.slice(0, 5)}
      />
    </div>
  );
};
