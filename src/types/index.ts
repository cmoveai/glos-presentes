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

export type ProductType = "simples" | "personalizavel" | "licenciado";

export interface CustomizationOptions {
  allowPhoto?: boolean;
  allowName?: boolean;
  allowMessage?: boolean;
  allowColor?: boolean;
  instructions?: string;
  requirePhotoUpload?: boolean;
}

export interface LicensingInfo {
  licensor?: string;
  contractNumber?: string;
  validUntil?: string;
}

export interface ProductFiscalInfo {
  productionType?: "revenda" | "fabricacao_propria";
  origin?: string;
  ncm?: string;
  gtin?: string;
  mpn?: string;
}

export interface ProductPackaging {
  weightKg?: number;
  heightCm?: number;
  widthCm?: number;
  depthCm?: number;
}

export interface ProductSeo {
  tagTitle?: string;
  metaDescription?: string;
  slug?: string;
}

export interface ProductCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  featured?: boolean;
}

export interface ProductBrand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  active: boolean;
  featured?: boolean;
  tagTitle?: string;
  metaDescription?: string;
}

export interface ProductGrade {
  id: string;
  name: string;
  options: string[]; // ex: ["300ml", "500ml"] ou ["P", "M", "G"]
  description?: string;
}

export interface SegmentedPriceRule {
  id: string;
  productId: string;
  customerGroup: "padrao" | "vip" | "revendedor" | "corporativo";
  region?: string;
  price: number;
  minQuantity?: number;
  marginPercent?: number;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  photoUrl?: string;
  createdAt: string;
  status: "aprovado" | "pendente" | "recusado";
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: ProductCategory;
  categoryName: string;
  productType?: ProductType;
  customizationOptions?: CustomizationOptions;
  licensingInfo?: LicensingInfo;
  brandId?: string;
  brandName?: string;
  collectionId?: string; // Coleção à qual o produto pertence
  collectionName?: string;
  occasions?: ProductOccasion[];
  recipientTags?: Array<"para-ela" | "para-ele" | "para-casa" | "para-cozinhar" | "para-tecnologia">;
  price: number;
  promotionalPrice?: number;
  costPrice?: number; // Custo unitário de aquisição/produção para DRE e lucro
  priceOnDemand?: boolean; // Preço sob consulta
  installments: number;
  images: string[];
  videoUrl?: string;
  variants?: ProductVariant[];
  stock: number;
  manageStock?: boolean;
  availability?: "pronta_entrega" | "sob_encomenda";
  outOfStockAction?: "indisponivel" | "continuar_vendendo";
  sku: string;
  fiscalInfo?: ProductFiscalInfo;
  packaging?: ProductPackaging;
  seo?: ProductSeo;
  specifications: ProductSpecifications;
  featured?: boolean;
  new?: boolean;
  bestseller?: boolean;
  active?: boolean;
  deleted?: boolean;
  deletedAt?: string;
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

export interface CartVariantSelection {
  id: string;
  nome: string;
  cor?: string | null;
  priceModifier?: number;
}

export interface CartItem {
  cartLineId: string;
  productId: string;
  nome: string;
  imagem: string;
  precoUnitario: number;
  quantidade: number;
  quantity?: number;
  natureza: "licenciado" | "personalizavel";
  variacaoSelecionada: CartVariantSelection | null;
  cor: string | null;
  textoCurto: string | null;
  requerArquivo: boolean;
  product: Product;
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
  natureza?: "licenciado" | "personalizavel" | "simples";
  requerArquivo?: boolean;
  cor?: string | null;
  textoCurto?: string | null;
  mockupUrl?: string;
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

export type OrderType = "revenda" | "personalizado";

export type OrderStepRevenda =
  | "pago"
  | "separar"
  | "despachar"
  | "entregue"
  | "cancelado";

export type OrderStepPersonalizado =
  | "pago"
  | "aguardando_arquivo"
  | "arte_aprovacao"
  | "em_producao"
  | "pronto"
  | "despachar"
  | "entregue"
  | "cancelado";

export type OrderStep = OrderStepRevenda | OrderStepPersonalizado;

export type ArtApprovalState =
  | "aguardando_arquivo"
  | "arquivo_recebido"
  | "mockup_pronto"
  | "aguardando_aprovacao"
  | "ajuste_solicitado"
  | "aprovado";

export interface WhatsAppMessage {
  id: string;
  sender: "ia" | "cliente" | "lojista";
  senderName?: string;
  timestamp: string;
  text: string;
  mediaUrl?: string;
  mediaType?: "image" | "audio" | "video" | "document";
  status?: "sent" | "delivered" | "read";
  intentDetected?: "envio_arquivo" | "aprovacao" | "solicitacao_ajuste" | "duvida_prazo" | "saudacao" | "outro";
  adjustmentNotes?: string;
}

export interface ArtApprovalEvent {
  id: string;
  state: ArtApprovalState;
  timestamp: string;
  actor: "ia" | "cris" | "cliente" | "sistema";
  description: string;
}

export interface ArtApprovalSession {
  id: string;
  orderId: string;
  orderNumber: string;
  itemId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerPhone: string;
  state: ArtApprovalState;
  customerUploadedFiles: CustomerFile[];
  customerTextDeclaration?: string;
  customerSongOrUrl?: string;
  mockupUrl?: string;
  mockupGeneratedAt?: string;
  mockupUploadedBy?: string;
  rejectionReason?: string;
  comentarioAjuste?: string;
  qrLink?: string;
  qrApplied?: boolean;
  isInteractiveProduct?: boolean;
  rejectionCount: number;
  conversationThread: WhatsAppMessage[];
  stateHistory: ArtApprovalEvent[];
  createdAt: string;
  updatedAt: string;
  requiresCrisAction: boolean;
}

export interface CustomerFile {
  id: string;
  name: string;
  url: string;
  type: "imagem" | "audio" | "video" | "texto" | "outro";
  size?: string;
  uploadedAt?: string;
}

export interface ItemPersonalization {
  customerFiles: CustomerFile[];
  customText?: string;
  mockupUrl?: string;
  qrLink?: string;
  qrApplied?: boolean;
  approvalStatus: "aguardando_envio" | "aguardando_aprovacao" | "aprovado" | "reprovado" | ArtApprovalState;
  approvalDate?: string;
  rejectionReason?: string;
  notes?: string;
  interactivePlayType?: "musica_spotify" | "video_afetivo" | "audio_voz" | "declaracao";
  conversationThread?: WhatsAppMessage[];
  approvalSessionId?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  image: string;
  price: number;
  costPrice?: number;
  quantity: number;
  variantName?: string;
  productType?: "simples" | "licenciado" | "personalizavel";
  personalization?: ItemPersonalization;
  natureza?: "licenciado" | "personalizavel" | "simples";
  requerArquivo?: boolean;
  cor?: string | null;
  textoCurto?: string | null;
}

export interface InternalOrderNote {
  id: string;
  text: string;
  date: string;
  author: string;
}

export interface OrderActionRequired {
  needed: boolean;
  reason: string;
  urgency: "baixa" | "media" | "alta";
}

export interface Order {
  id: string;
  orderNumber?: string;
  clienteId?: string;
  createdAt: string;
  orderType?: OrderType;
  currentStep?: OrderStep;
  status: OrderStatus;
  statusPedido?: "aguardando_arquivo" | "a_despachar" | "em_producao" | "despachado" | "entregue" | "cancelado" | string;
  statusPagamento?: "aguardando_pagamento" | "aprovado" | "rejeitado" | "estornado" | "pago" | "pendente" | "recusado" | string;
  aprovacaoMockup?: "aguardando_envio" | "aguardando_aprovacao" | "aprovado" | "reprovado" | "ajuste_solicitado" | string;
  dataAprovacaoMockup?: string;
  comentarioAjuste?: string;
  dataSolicitacaoAjuste?: string;
  mockupUrl?: string;
  qrLink?: string;
  qrApplied?: boolean;
  qrAplicado?: boolean;
  statusHistory: OrderStatusEvent[];
  stepHistory?: Array<{
    step: OrderStep;
    label: string;
    date: string;
    updatedBy?: string;
    note?: string;
  }>;
  items: (OrderItemSummary & {
    id?: string;
    productType?: "simples" | "licenciado" | "personalizavel";
    costPrice?: number;
    personalization?: ItemPersonalization;
  })[];
  subtotal: number;
  shippingPrice: number;
  discount: number;
  total: number;
  costTotal?: number;
  profitTotal?: number;
  couponCode?: string;
  shippingOption: ShippingOption;
  shippingAddress: Address;
  paymentMethod: "pix" | "credit_card" | "boleto" | "link_pagamento";
  paymentStatus?: "pago" | "pendente" | "recusado" | "estornado";
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
  nfeStatus?: "nao_emitida" | "emitida" | "cancelada";
  nfeKey?: string;
  nfeNumber?: string;
  nfePdfUrl?: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
    personType?: "PF" | "PJ";
    totalOrdersCount?: number;
  };
  giftWrap?: boolean;
  giftCardMessage?: string;
  internalNotes?: InternalOrderNote[];
  actionRequired?: OrderActionRequired;
}

export interface CartLinkItem {
  productId: string;
  productName: string;
  sku?: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  customizationNotes?: string;
}

export interface CartLink {
  id: string;
  title: string;
  code: string;
  targetCustomerName?: string;
  targetPhone?: string;
  items: CartLinkItem[];
  discountPercent?: number;
  discountValue?: number;
  couponCode?: string;
  subtotal: number;
  total: number;
  url: string;
  createdAt: string;
  expiresAt?: string;
  clicksCount: number;
  converted: boolean;
  status: "ativo" | "expirado" | "convertido";
}

export interface AbandonedCart {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    variantName?: string;
  }>;
  subtotal: number;
  shippingPrice: number;
  discount?: number;
  total: number;
  abandonedAt: string;
  timeAgo: string;
  stepReached?: "cart" | "email" | "address" | "shipping" | "payment";
  status?: "abandoned" | "contacted" | "recovered" | "expired";
  recoveryStatus: "nao_contatado" | "mensagem_enviada" | "recuperado" | "perdido";
  recoveryDiscountCode?: string;
  suggestedDiscountCode?: string;
  lastContactDate?: string;
  lastContactedAt?: string;
  recoveryAttemptsCount?: number;
  recoveredOrderId?: string;
  recoveryNote?: string;
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
