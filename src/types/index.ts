export type ProductCategory =
  | "presentes-criativos"
  | "cozinha"
  | "eletronicos"
  | "casa-utilidades"
  | "organizacao"
  | "decoracao"
  | "escritorio"
  | "copos-garrafas"
  | "kits-presenteaveis"
  | "datas-comemorativas"
  | "novidades"
  | string;

export type ProductOccasion =
  | "aniversario"
  | "casamento"
  | "casa-nova"
  | "dia-das-maes"
  | "dia-dos-pais"
  | "dia-dos-namorados"
  | "natal"
  | "amigo-secreto"
  | "agradecimento"
  | string;

export interface ProductVariant {
  id: string;
  name: string; // Ex: "Preto Matte", "Verde Sálvia", "Terracota", "Inox"
  colorHex?: string;
  inStock: boolean;
  image?: string;
  sku?: string;
  priceModifier?: number; // Preço adicional ou diferente se houver
  stock?: number;
}

export interface ProductSpecifications {
  dimensions?: string;
  weight?: string;
  material?: string;
  packageContents?: string;
  warranty?: string;
  origin?: string;
  careInstructions?: string;
  power?: string;
  capacity?: string;
}

export interface ProductCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  featured?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ProductCategory;
  categoryName: string;
  collectionId?: string; // Coleção à qual o produto pertence
  collectionName?: string;
  occasions?: ProductOccasion[];
  recipientTags?: Array<"para-ela" | "para-ele" | "para-casa" | "para-cozinhar" | "para-tecnologia">;
  price: number;
  promotionalPrice?: number;
  costPrice?: number; // Custo unitário de aquisição/produção para DRE e lucro
  installments: number;
  images: string[];
  variants?: ProductVariant[];
  stock: number;
  sku: string;
  specifications: ProductSpecifications;
  featured?: boolean;
  new?: boolean;
  bestseller?: boolean;
  isKit?: boolean;
  kitItems?: string[]; // Lista de itens incluídos no kit
  kitPackaging?: string; // Descrição da embalagem especial
  rating?: number;
  reviewCount?: number;
  color?: string;
}

export interface CategoryInfo {
  id: ProductCategory;
  slug: string;
  name: string;
  description: string;
  image: string;
  itemCount?: number;
  highlightIconName?: string;
}

export interface OccasionInfo {
  id: ProductOccasion;
  name: string;
  subtitle: string;
  tag: string;
  image: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: ProductVariant;
  customGiftMessage?: string;
  includeGiftWrap?: boolean;
}

export interface ShippingOption {
  id: string;
  name: string;
  deadline: string;
  price: number;
  originalPrice: number;
  isFree?: boolean;
}

export interface Coupon {
  code: string;
  description: string;
  discountPercent?: number;
  discountValue?: number;
  minOrder?: number;
  active?: boolean;
  usageCount?: number;
}

export interface AdminMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  pendingOrdersCount: number;
  shippedOrdersCount: number;
  deliveredOrdersCount: number;
  totalProducts: number;
  lowStockProductsCount: number;
  totalCost?: number;
  totalProfit?: number;
  profitMargin?: number;
}

export interface Address {
  id: string;
  recipientName: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  phone: string;
  isDefault?: boolean;
}

export interface OrderItemSummary {
  productId: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  quantity: number;
  variantName?: string;
}

export type OrderStatus =
  | "PEDIDO_REALIZADO"
  | "PAGAMENTO_CONFIRMADO"
  | "EM_SEPARACAO"
  | "ENVIADO"
  | "ENTREGUE"
  | "CANCELADO";

export interface OrderStatusEvent {
  status: OrderStatus;
  label: string;
  date: string;
  description?: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  items: OrderItemSummary[];
  subtotal: number;
  shippingPrice: number;
  discount: number;
  total: number;
  couponCode?: string;
  shippingOption: ShippingOption;
  shippingAddress: Address;
  paymentMethod: "pix" | "credit_card" | "boleto";
  paymentDetails: {
    installments?: number;
    cardLast4?: string;
    cardBrand?: string;
    pixCode?: string;
    pixQrCodeUrl?: string;
    pixExpiresAt?: string;
    boletoBarcode?: string;
    initPoint?: string;
    preferenceId?: string;
    isLiveGateway?: boolean;
  };
  trackingCode?: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  giftWrap?: boolean;
  giftCardMessage?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string;
  addresses: Address[];
}

export interface HeroCampaign {
  id: string;
  headline: string;
  subtitle: string;
  ctaText: string;
  ctaLink?: string;
  image: string;
  badge?: string;
  categoryFilter?: ProductCategory;
  active?: boolean;
  order?: number;
}

export interface EditorialBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  categorySlug?: string;
  tag?: string;
}

export interface StoreOperationsSettings {
  // Identidade & Marca
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  cnpj: string;
  address: string;
  instagramHandle: string;

  // Contato & Atendimento
  whatsapp: string;
  whatsappDisplay: string;
  email: string;
  phone: string;
  phoneDisplay: string;
  openingHours: string;

  // Frete & Entrega
  freeShippingThreshold: number; // Em reais (ex: 249.00)
  originCep: string; // Ex: "01310-100"
  handlingDays: number; // Dias úteis de manuseio

  // Pagamento & Checkout
  pixDiscountPercentage: number; // Ex: 5%
  pixKey: string;
  pixReceiverName: string;
  pixBankName: string;
  maxInstallmentsWithoutInterest: number;
  mercadoPagoMode: "production" | "sandbox";
  mercadoPagoPublicKey?: string;

  // Avisos & Top Banner
  announcementBarText: string;
  announcementBarEnabled: boolean;

  // Políticas
  returnPolicyDays: number;
  warrantyDays: number;
}

export interface AbandonedCart {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  shippingPrice?: number;
  discount?: number;
  total: number;
  stepReached: "cart" | "email" | "address" | "shipping" | "payment";
  status: "abandoned" | "contacted" | "recovered" | "expired";
  recoveredOrderId?: string;
  lastContactedAt?: string;
  suggestedDiscountCode?: string;
  recoveryNote?: string;
}

export interface UpsellSuggestion {
  product: Product;
  discountPercent?: number;
  specialPrice: number;
  badge: string;
  reason: string;
}

export interface MarketingSettings {
  // Google Tag Manager
  gtmId?: string; // GTM-XXXXXXX
  gtmEnabled?: boolean;

  // Google Analytics 4
  gaMeasurementId?: string; // G-XXXXXXXXXX
  gaEnabled?: boolean;

  // Google Ads
  googleAdsId?: string; // AW-XXXXXXXXXX
  googleAdsConversionLabel?: string; // e.g. "AbCdEfGhIjKlMnOpQrS"
  googleAdsEnabled?: boolean;

  // Meta Pixel (Facebook / Instagram)
  metaPixelId?: string; // 123456789012345
  metaPixelEnabled?: boolean;

  // SEO & Social Sharing Globals
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  ogImage?: string;
  canonicalUrl?: string;

  // Custom Scripts (Header / Body injection)
  customHeadScript?: string;
  customBodyScript?: string;
}

export type ActivePage =
  | { type: "home" }
  | { type: "catalog"; category?: ProductCategory; occasion?: ProductOccasion; tag?: string; search?: string }
  | { type: "product"; slug: string }
  | { type: "cart" }
  | { type: "checkout" }
  | { type: "account"; tab?: "profile" | "orders" | "addresses" | "favorites" | "exchange" }
  | { type: "order-confirmation"; orderId: string }
  | { type: "static-page"; pageId: "sobre" | "trocas" | "privacidade" | "termos" | "ajuda" | "entregas" | "pagamentos" };
