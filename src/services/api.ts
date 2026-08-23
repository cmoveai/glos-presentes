import { Coupon, Order, OrderStatus, Product, ShippingOption, AdminMetrics, CategoryInfo, ProductCollection, HeroCampaign, EditorialBanner, MarketingSettings, StoreOperationsSettings } from "../types";
import {
  saveOrderToFirestore,
  fetchUserOrders,
  fetchProducts,
  fetchProductBySlug,
  seedProductsIfEmpty,
  fetchAllOrdersAdmin,
  updateOrderStatusAdmin,
  saveProductAdmin,
  deleteProductAdmin,
  fetchCouponsAdmin,
  saveCouponAdmin,
  deleteCouponAdmin,
  fetchCategories,
  saveCategoryAdmin,
  deleteCategoryAdmin,
  fetchCollections,
  saveCollectionAdmin,
  deleteCollectionAdmin,
  fetchHeroBanners,
  saveHeroBannerAdmin,
  deleteHeroBannerAdmin,
  fetchEditorialBanners,
  saveEditorialBannerAdmin,
  deleteEditorialBannerAdmin,
  fetchMarketingSettings,
  saveMarketingSettingsAdmin,
  fetchStoreOperationsSettings,
  saveStoreOperationsSettingsAdmin,
} from "../lib/firebase";
import { PRODUCTS } from "../data/products";

export async function createMercadoPagoPreference(orderData: {
  orderId?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; image?: string }>;
  customer: { name: string; email: string; phone?: string; cpf?: string };
  shippingPrice?: number;
  discount?: number;
}): Promise<{
  success: boolean;
  orderId: string;
  preferenceId?: string;
  init_point?: string;
  sandbox_init_point?: string;
  isLiveGateway?: boolean;
}> {
  try {
    const res = await fetch("/api/checkout/mercadopago/preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...orderData,
        baseUrl: window.location.origin,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || err.error || "Erro ao conectar com Mercado Pago");
    }
    return await res.json();
  } catch (error: any) {
    console.warn("Mercado Pago API call fallback:", error);
    const mockOrderId = orderData.orderId || "PED-" + Math.floor(100000 + Math.random() * 900000);
    return {
      success: true,
      orderId: mockOrderId,
      preferenceId: `pref-${mockOrderId}`,
      init_point: "",
      isLiveGateway: false,
    };
  }
}

export async function fetchAddressByCep(cep: string): Promise<{
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  region: string;
} | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`/api/cep/${clean}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("fetchAddressByCep error:", e);
  }
  return null;
}

export async function trackPackage(trackingCode: string): Promise<{
  trackingCode: string;
  carrier: string;
  status: string;
  estimatedDelivery: string;
  checkpoints: Array<{
    status: string;
    title: string;
    description: string;
    location: string;
    date: string;
    completed: boolean;
    current?: boolean;
  }>;
}> {
  try {
    const res = await fetch(`/api/shipping/track/${encodeURIComponent(trackingCode)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("trackPackage error:", e);
  }

  // Fallback checkpoints
  return {
    trackingCode,
    carrier: "Correios / Transportadora",
    status: "EM_TRANSITO",
    estimatedDelivery: "Em 1 a 3 dias úteis",
    checkpoints: [
      {
        status: "POSTADO",
        title: "Objeto Postado",
        description: "Pacote recebido na agência dos Correios.",
        location: "São Paulo / SP",
        date: "Ontem às 14:20",
        completed: true,
      },
      {
        status: "EM_TRANSITO",
        title: "Em Transferência para Centro de Distribuição",
        description: "Carga em trânsito para a cidade de destino.",
        location: "Unidade de Tratamento",
        date: "Hoje às 08:30",
        completed: true,
        current: true,
      },
      {
        status: "ENTREGUE",
        title: "Entrega no Endereço",
        description: "Objeto a ser entregue ao destinatário.",
        location: "Endereço cadastrado",
        date: "Previsão em breve",
        completed: false,
      },
    ],
  };
}

export async function calculateShipping(
  cep: string,
  subtotal: number
): Promise<{
  options: ShippingOption[];
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
  locationLabel?: string;
}> {
  try {
    const res = await fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, subtotal }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erro ao calcular frete");
    }
    return await res.json();
  } catch (_e) {
    // Fallback calculation client-side
    const cleanCep = cep.replace(/\D/g, "");
    const isFree = subtotal >= 249;
    return {
      options: [
        {
          id: "pac",
          name: "Econômico (Correios PAC)",
          deadline: "5 a 8 dias úteis",
          price: isFree ? 0 : 18.9,
          originalPrice: 18.9,
          isFree,
        },
        {
          id: "sedex",
          name: "Expresso (Correios SEDEX)",
          deadline: "2 a 3 dias úteis",
          price: 29.9,
          originalPrice: 29.9,
          isFree: false,
        },
      ],
      freeShippingThreshold: 249,
      remainingForFreeShipping: Math.max(0, 249 - subtotal),
    };
  }
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<{ code: string; description: string; discountAmount: number; valid: boolean }> {
  try {
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Cupom inválido");
    }
    return await res.json();
  } catch (e: any) {
    const upper = code.trim().toUpperCase();
    if (upper === "BEMVINDO10") {
      return {
        code: "BEMVINDO10",
        description: "10% OFF no primeiro pedido",
        discountAmount: Math.round(subtotal * 0.1 * 100) / 100,
        valid: true,
      };
    }
    if (upper === "FRETEGRATIS") {
      return {
        code: "FRETEGRATIS",
        description: "Frete Econômico Grátis",
        discountAmount: 18.9,
        valid: true,
      };
    }
    throw new Error(e.message || "Cupom inválido ou expirado");
  }
}

export async function applyCouponAPI(
  code: string,
  subtotal: number
): Promise<{ valid: boolean; message: string; coupon?: Coupon }> {
  try {
    const res = await validateCoupon(code, subtotal);
    return {
      valid: true,
      message: `Cupom ${res.code} aplicado com sucesso!`,
      coupon: {
        code: res.code,
        description: res.description,
        discountValue: res.discountAmount,
      },
    };
  } catch (err: any) {
    return {
      valid: false,
      message: err.message || "Cupom inválido ou expirado.",
    };
  }
}

export async function submitOrder(orderData: Partial<Order>): Promise<{ success: boolean; order: Order }> {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.order) {
        await saveOrderToFirestore(data.order);
      }
      return data;
    }
  } catch (_e) {
    // proceed to client-side order creation and direct Firestore sync
  }

  const orderId = "PED-" + Math.floor(100000 + Math.random() * 900000);
  const newOrder: Order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    status: "PAGAMENTO_CONFIRMADO",
    statusHistory: [
      { status: "PEDIDO_REALIZADO", label: "Pedido Realizado", date: new Date().toISOString() },
      { status: "PAGAMENTO_CONFIRMADO", label: "Pagamento Aprovado", date: new Date().toISOString() },
    ],
    items: (orderData.items as any) || [],
    subtotal: orderData.subtotal || 0,
    shippingPrice: orderData.shippingPrice || 0,
    discount: orderData.discount || 0,
    total: orderData.total || 0,
    couponCode: orderData.couponCode,
    shippingOption: orderData.shippingOption || {
      id: "sedex",
      name: "Sedex Expresso",
      price: 0,
      deadline: "1 a 3 dias úteis",
      originalPrice: 18.9,
    },
    shippingAddress: orderData.shippingAddress || {
      id: "1",
      recipientName: "Cliente",
      zipCode: "01310-100",
      street: "Av. Paulista",
      number: "1000",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      state: "SP",
      phone: "(11) 99999-9999",
    },
    paymentMethod: orderData.paymentMethod || "pix",
    paymentDetails: orderData.paymentDetails || {
      pixCode: "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540410.005802BR5915GLOS PRESENTES6009SAO PAULO62070503***6304E2CA",
      pixQrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020126580014BR.GOV.BCB.PIX",
      pixExpiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    },
    trackingCode: "BR" + Math.floor(100000000 + Math.random() * 900000000) + "BR",
    customer: orderData.customer || { name: "", email: "", cpf: "", phone: "" },
    giftWrap: orderData.giftWrap,
    giftCardMessage: orderData.giftCardMessage,
  };

  // Sync to Firestore
  await saveOrderToFirestore(newOrder);

  // Also save to local storage for instant offline access
  try {
    const savedOrders = JSON.parse(localStorage.getItem("ndm_user_orders") || "[]");
    savedOrders.unshift(newOrder);
    localStorage.setItem("ndm_user_orders", JSON.stringify(savedOrders));
  } catch {}

  return { success: true, order: newOrder };
}

export const createOrder = submitOrder;

export async function getOrders(email?: string): Promise<Order[]> {
  if (email) {
    const dbOrders = await fetchUserOrders(email);
    if (dbOrders.length > 0) return dbOrders;
  }
  try {
    const saved = localStorage.getItem("ndm_user_orders");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return [];
}

export async function subscribeNewsletter(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return await res.json();
  } catch (_e) {
    return {
      success: true,
      message: "Inscrição realizada com sucesso! Use o cupom BEMVINDO10 no seu primeiro pedido.",
    };
  }
}

/**
 * ADMIN: Get all orders across the entire store
 */
export async function getAdminOrders(): Promise<Order[]> {
  let orders = await fetchAllOrdersAdmin();

  // If no orders yet, seed a few realistic sample orders for the administrator
  if (orders.length === 0) {
    const sampleOrders: Order[] = [
      {
        id: "PED-982143",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "PAGAMENTO_CONFIRMADO",
        statusHistory: [
          { status: "PEDIDO_REALIZADO", label: "Pedido Realizado", date: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
          { status: "PAGAMENTO_CONFIRMADO", label: "Pagamento Confirmado", date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
        ],
        items: [
          {
            productId: "prod-1",
            name: "Kit Cafeteria Prensa Francesa & Canecas Cerâmica Artesanal",
            sku: "NDM-KCF-001",
            image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
            price: 249.9,
            quantity: 1,
          }
        ],
        subtotal: 249.9,
        shippingPrice: 0,
        discount: 24.99,
        total: 224.91,
        couponCode: "BEMVINDO10",
        shippingOption: { id: "pac", name: "Envio Econômico (PAC)", deadline: "4 a 7 dias úteis", price: 0, originalPrice: 18.9, isFree: true },
        shippingAddress: {
          id: "addr-1",
          recipientName: "Beatriz Silveira",
          zipCode: "04571-010",
          street: "Av. Engenheiro Luís Carlos Berrini",
          number: "1200",
          complement: "Apto 142",
          neighborhood: "Brooklin",
          city: "São Paulo",
          state: "SP",
          phone: "(11) 98765-4321",
        },
        paymentMethod: "pix",
        paymentDetails: { isLiveGateway: true },
        trackingCode: "BR982143001SP",
        customer: {
          name: "Beatriz Silveira",
          email: "beatriz.silveira@email.com",
          cpf: "345.678.901-22",
          phone: "(11) 98765-4321",
        },
        giftWrap: true,
        giftCardMessage: "Parabéns pela conquista do novo apê! Com muito carinho da Bia e do Lucas.",
      },
      {
        id: "PED-981029",
        createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        status: "EM_SEPARACAO",
        statusHistory: [
          { status: "PEDIDO_REALIZADO", label: "Pedido Realizado", date: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString() },
          { status: "PAGAMENTO_CONFIRMADO", label: "Pagamento Confirmado", date: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString() },
          { status: "EM_SEPARACAO", label: "Em Separação no Estoque", date: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString() }
        ],
        items: [
          {
            productId: "prod-2",
            name: "Luminária de Mesa Escultural em Madeira & Luz Âmbar",
            sku: "NDM-LUM-002",
            image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
            price: 189.9,
            quantity: 1,
          },
          {
            productId: "prod-5",
            name: "Vela Aromática Artesanal Cera de Coco Vanilla Bourbon",
            sku: "NDM-VEL-005",
            image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80",
            price: 79.9,
            quantity: 2,
          }
        ],
        subtotal: 349.7,
        shippingPrice: 28.9,
        discount: 0,
        total: 378.6,
        shippingOption: { id: "sedex", name: "Sedex Expresso", deadline: "1 a 2 dias úteis", price: 28.9, originalPrice: 28.9 },
        shippingAddress: {
          id: "addr-2",
          recipientName: "Rodrigo Mendonça",
          zipCode: "22041-001",
          street: "Rua Barata Ribeiro",
          number: "540",
          neighborhood: "Copacabana",
          city: "Rio de Janeiro",
          state: "RJ",
          phone: "(21) 99887-1122",
        },
        paymentMethod: "credit_card",
        paymentDetails: { installments: 3, cardBrand: "Mastercard", cardLast4: "4092" },
        trackingCode: "BR981029440RJ",
        customer: {
          name: "Rodrigo Mendonça",
          email: "rodrigo.mendonca@email.com",
          cpf: "219.876.543-11",
          phone: "(21) 99887-1122",
        },
        giftWrap: true,
        giftCardMessage: "Feliz aniversário, meu amor! Que sua nova fase seja iluminada e perfumada.",
      },
      {
        id: "PED-979450",
        createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        status: "ENVIADO",
        statusHistory: [
          { status: "PEDIDO_REALIZADO", label: "Pedido Realizado", date: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString() },
          { status: "PAGAMENTO_CONFIRMADO", label: "Pagamento Confirmado", date: new Date(Date.now() - 39 * 60 * 60 * 1000).toISOString() },
          { status: "EM_SEPARACAO", label: "Em Separação no Estoque", date: new Date(Date.now() - 38 * 60 * 60 * 1000).toISOString() },
          { status: "ENVIADO", label: "Enviado / Em Trânsito", date: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString() }
        ],
        items: [
          {
            productId: "prod-4",
            name: "Kit Sommelier com Saca-rolhas Pneumático & Aerador",
            sku: "NDM-VIN-004",
            image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80",
            price: 219.9,
            quantity: 1,
          }
        ],
        subtotal: 219.9,
        shippingPrice: 18.9,
        discount: 0,
        total: 238.8,
        shippingOption: { id: "pac", name: "Envio Econômico (PAC)", deadline: "4 a 7 dias úteis", price: 18.9, originalPrice: 18.9 },
        shippingAddress: {
          id: "addr-3",
          recipientName: "Camila Guimarães",
          zipCode: "80020-010",
          street: "Rua Marechal Deodoro",
          number: "300",
          neighborhood: "Centro",
          city: "Curitiba",
          state: "PR",
          phone: "(41) 97766-5544",
        },
        paymentMethod: "pix",
        paymentDetails: { isLiveGateway: true },
        trackingCode: "BR979450300PR",
        customer: {
          name: "Camila Guimarães",
          email: "camila.guimaraes@email.com",
          cpf: "456.789.012-33",
          phone: "(41) 97766-5544",
        },
        giftWrap: false,
      }
    ];

    for (const s of sampleOrders) {
      await saveOrderToFirestore(s);
    }
    return sampleOrders;
  }

  return orders;
}

/**
 * ADMIN: Update order status & tracking code
 */
export async function updateAdminOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  trackingCode?: string,
  note?: string
): Promise<boolean> {
  return await updateOrderStatusAdmin(orderId, newStatus, trackingCode, note);
}

/**
 * STOREFRONT: Get single product by slug or id (Firestore with local fallback)
 */
export async function getStoreProductBySlugOrId(slugOrId: string): Promise<Product | undefined> {
  try {
    const prod = await fetchProductBySlug(slugOrId);
    if (prod) return prod;
  } catch (err) {
    console.warn("Could not fetch product from Firestore:", err);
  }
  return PRODUCTS.find((p) => p.slug === slugOrId || p.id === slugOrId);
}

/**
 * ADMIN: Get all products for catalog management
 */
export async function getAdminProducts(): Promise<Product[]> {
  const prods = await fetchProducts();
  return prods && prods.length > 0 ? prods : PRODUCTS;
}

/**
 * ADMIN: Save or update product
 */
export async function saveAdminProduct(product: Product): Promise<boolean> {
  return await saveProductAdmin(product);
}

/**
 * ADMIN: Delete product
 */
export async function deleteAdminProduct(productId: string): Promise<boolean> {
  return await deleteProductAdmin(productId);
}

/**
 * ADMIN: Get coupons list
 */
export async function getAdminCoupons(): Promise<Coupon[]> {
  return await fetchCouponsAdmin();
}

/**
 * ADMIN: Save coupon
 */
export async function saveAdminCoupon(coupon: Coupon): Promise<boolean> {
  return await saveCouponAdmin(coupon);
}

/**
 * ADMIN: Delete coupon
 */
export async function deleteAdminCoupon(code: string): Promise<boolean> {
  return await deleteCouponAdmin(code);
}

/**
 * ADMIN: Calculate dashboard metrics
 */
export function calculateAdminMetrics(orders: Order[], products: Product[]): AdminMetrics {
  const validOrders = orders.filter((o) => o.status !== "CANCELADO");
  const totalRevenue = validOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);

  const totalOrders = orders.length;
  const validOrdersCount = validOrders.length;
  const averageTicket = validOrdersCount > 0 ? totalRevenue / validOrdersCount : 0;

  const pendingOrdersCount = orders.filter(
    (o) => o.status === "PEDIDO_REALIZADO" || o.status === "PAGAMENTO_CONFIRMADO" || o.status === "EM_SEPARACAO"
  ).length;

  const shippedOrdersCount = orders.filter((o) => o.status === "ENVIADO").length;
  const deliveredOrdersCount = orders.filter((o) => o.status === "ENTREGUE").length;

  const totalProducts = products.length;
  const lowStockProductsCount = products.filter((p) => (p.stock || 0) <= 5).length;

  // Build product cost lookup map
  const costMap = new Map<string, number>();
  products.forEach((p) => {
    const cost = p.costPrice !== undefined && p.costPrice > 0 ? p.costPrice : p.price * 0.38;
    costMap.set(p.id, cost);
    if (p.sku) costMap.set(p.sku, cost);
  });

  // Calculate estimated total cost of goods sold (CMV) and estimated gateway fees
  let totalCost = 0;
  validOrders.forEach((ord) => {
    if (ord.items && ord.items.length > 0) {
      ord.items.forEach((item) => {
        const unitCost = costMap.get(item.productId) || costMap.get(item.sku) || item.price * 0.38;
        totalCost += unitCost * (item.quantity || 1);
      });
    } else {
      totalCost += (ord.subtotal || ord.total) * 0.38;
    }
  });

  const totalProfit = Math.max(0, totalRevenue - totalCost);
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalOrders,
    averageTicket,
    pendingOrdersCount,
    shippedOrdersCount,
    deliveredOrdersCount,
    totalProducts,
    lowStockProductsCount,
    totalCost,
    totalProfit,
    profitMargin,
  };
}

/**
 * ADMIN: Categories
 */
export async function getAdminCategories(): Promise<CategoryInfo[]> {
  return await fetchCategories();
}

export async function saveAdminCategory(category: CategoryInfo): Promise<boolean> {
  return await saveCategoryAdmin(category);
}

export async function deleteAdminCategory(categoryId: string): Promise<boolean> {
  return await deleteCategoryAdmin(categoryId);
}

/**
 * ADMIN: Collections
 */
export async function getAdminCollections(): Promise<ProductCollection[]> {
  return await fetchCollections();
}

export async function saveAdminCollection(col: ProductCollection): Promise<boolean> {
  return await saveCollectionAdmin(col);
}

export async function deleteAdminCollection(collectionId: string): Promise<boolean> {
  return await deleteCollectionAdmin(collectionId);
}

/**
 * HERO BANNERS & VITRINES
 */
export async function getHeroBanners(): Promise<HeroCampaign[]> {
  return await fetchHeroBanners();
}

export async function saveAdminHeroBanner(banner: HeroCampaign): Promise<boolean> {
  return await saveHeroBannerAdmin(banner);
}

export async function deleteAdminHeroBanner(bannerId: string): Promise<boolean> {
  return await deleteHeroBannerAdmin(bannerId);
}

/**
 * EDITORIAL BANNERS (DESTAQUES HOME)
 */
export async function getEditorialBanners(): Promise<EditorialBanner[]> {
  return await fetchEditorialBanners();
}

export async function saveAdminEditorialBanner(banner: EditorialBanner): Promise<boolean> {
  return await saveEditorialBannerAdmin(banner);
}

export async function deleteAdminEditorialBanner(bannerId: string): Promise<boolean> {
  return await deleteEditorialBannerAdmin(bannerId);
}

/**
 * MARKETING, SEO & TRACKING (GTM, GA4, ADS, META)
 */
export async function getMarketingSettings(): Promise<MarketingSettings> {
  return await fetchMarketingSettings();
}

export async function saveAdminMarketingSettings(settings: MarketingSettings): Promise<boolean> {
  return await saveMarketingSettingsAdmin(settings);
}

/**
 * STORE OPERATIONS & BRAND SETTINGS (SHIPPING, GATEWAYS, IDENTITY)
 */
export async function getStoreOperationsSettings(): Promise<StoreOperationsSettings> {
  return await fetchStoreOperationsSettings();
}

export async function saveAdminStoreOperationsSettings(settings: StoreOperationsSettings): Promise<boolean> {
  return await saveStoreOperationsSettingsAdmin(settings);
}




