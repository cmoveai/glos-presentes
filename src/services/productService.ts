/**
 * SERVIÇO DE PRODUTOS · Glos Presentes
 * Gerenciamento centralizado de produtos, categorias, marcas, grades, precificação assistida (markup gross-up),
 * avaliações e lixeira.
 */

import {
  Product,
  CategoryInfo,
  ProductBrand,
  ProductGrade,
  SegmentedPriceRule,
  ProductReview,
  ProductType,
} from "../types";

export interface MarkupGrossUpInput {
  cost: number;
  taxPercent: number; // ex: 6.0% (Simples Nacional)
  paymentFeePercent: number; // ex: 3.99% (Meio de pagamento)
  expensePercent: number; // ex: 4.0% (Despesas operacionais/embalagem)
  targetMarginPercent: number; // ex: 30.0% (Margem líquida desejada)
}

export interface MarkupGrossUpResult {
  suggestedPrice: number;
  totalDeductionsPercent: number;
  marginAmount: number;
  marginPercent: number;
  isNegativeMargin: boolean;
  breakdown: {
    cost: number;
    taxes: number;
    paymentFee: number;
    expenses: number;
    netMargin: number;
  };
}

/**
 * Fórmula Gross-up:
 * Preço = Custo ÷ [ 1 − (soma dos %) ]
 */
export function calculateGrossUpMarkup(input: MarkupGrossUpInput): MarkupGrossUpResult {
  const sumPercents =
    (input.taxPercent +
      input.paymentFeePercent +
      input.expensePercent +
      input.targetMarginPercent) /
    100;

  const cost = Math.max(0, input.cost);

  let suggestedPrice = 0;
  if (sumPercents < 1 && sumPercents >= 0) {
    suggestedPrice = cost / (1 - sumPercents);
  } else {
    suggestedPrice = cost * 2; // Fallback se soma dos % for >= 100%
  }

  const taxesAmount = (suggestedPrice * input.taxPercent) / 100;
  const paymentFeeAmount = (suggestedPrice * input.paymentFeePercent) / 100;
  const expensesAmount = (suggestedPrice * input.expensePercent) / 100;
  const netMarginAmount = suggestedPrice - (cost + taxesAmount + paymentFeeAmount + expensesAmount);
  const netMarginPercent = suggestedPrice > 0 ? (netMarginAmount / suggestedPrice) * 100 : 0;

  return {
    suggestedPrice: Math.round(suggestedPrice * 100) / 100,
    totalDeductionsPercent: sumPercents * 100,
    marginAmount: Math.round(netMarginAmount * 100) / 100,
    marginPercent: Math.round(netMarginPercent * 10) / 10,
    isNegativeMargin: netMarginAmount < 0,
    breakdown: {
      cost,
      taxes: Math.round(taxesAmount * 100) / 100,
      paymentFee: Math.round(paymentFeeAmount * 100) / 100,
      expenses: Math.round(expensesAmount * 100) / 100,
      netMargin: Math.round(netMarginAmount * 100) / 100,
    },
  };
}

// Initial Mock Products for Glos Presentes
export const INITIAL_GLOS_PRODUCTS: Product[] = [
  {
    id: "prod-kit-mimo-afetivo",
    slug: "kit-mimo-afetivo-personalizado-foto",
    name: "Kit Mimo Afetivo (Caneca + Vela + Foto Polaroid)",
    shortDescription: "Composição nobre afetiva com caneca personalizada, vela botânica aromática e mini fotos polaroid com dedicatória.",
    description: "Um presente inesquecível para emocionar quem você ama. O kit inclui uma caneca de porcelana premium estampada com foto e frase especial, vela botânica em cera vegetal e 3 mini fotos no formato polaroid com legendas afetivas, tudo acomodado na caixa rígida kraft com laço de cetim.",
    category: "kits-presenteaveis",
    categoryName: "Kits Presenteáveis",
    productType: "personalizavel",
    customizationOptions: {
      allowPhoto: true,
      allowName: true,
      allowMessage: true,
      allowColor: false,
      instructions: "Envie até 3 fotos em boa resolução e a mensagem que deseja gravar no verso do cartão e na caneca.",
      requirePhotoUpload: true,
    },
    brandId: "brand-glos",
    brandName: "Nivah Atelier",
    price: 149.9,
    promotionalPrice: 139.9,
    costPrice: 48.0,
    installments: 4,
    images: [
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80",
    ],
    stock: 18,
    manageStock: true,
    availability: "pronta_entrega",
    outOfStockAction: "indisponivel",
    sku: "GLOS-KIT-001",
    fiscalInfo: {
      productionType: "fabricacao_propria",
      origin: "0 - Nacional",
      ncm: "69111010",
      gtin: "7891234567890",
      mpn: "MPN-KIT-001",
    },
    packaging: {
      weightKg: 0.95,
      heightCm: 14,
      widthCm: 22,
      depthCm: 26,
    },
    seo: {
      tagTitle: "Kit Mimo Afetivo com Foto e Vela | Glos Presentes",
      metaDescription: "Surpreenda com presentes personalizados afetivos. Kit com caneca com foto, vela vegetal e dedicatória.",
      slug: "kit-mimo-afetivo-personalizado-foto",
    },
    specifications: {
      dimensions: "Caixa: 26 x 22 x 14 cm",
      weight: "950g",
      material: "Porcelana, Cera Vegetal de Coco, Papel Fotográfico Silk",
      packageContents: "1x Caneca 325ml, 1x Vela 120g, 3x Mini Fotos Polaroid, 1x Caixa Rígida Kraft com Fita",
    },
    featured: true,
    new: false,
    bestseller: true,
    active: true,
    deleted: false,
    isKit: true,
    rating: 5.0,
    reviewCount: 34,
  },
  {
    id: "prod-caneca-foto-frase",
    slug: "caneca-porcelana-foto-frase-carinho",
    name: "Caneca Porcelana Foto & Frase Carinho",
    shortDescription: "Caneca de porcelana brilhante com impressão de altíssima definição da sua foto e frase inesquecível.",
    description: "Caneca de porcelana branca classe AAA, estampa brilhante que não desbota. Personalize com o nome do presenteado, uma foto marcante e uma frase carinhosa no verso.",
    category: "copos-garrafas",
    categoryName: "Canecas & Copos",
    productType: "personalizavel",
    customizationOptions: {
      allowPhoto: true,
      allowName: true,
      allowMessage: true,
      allowColor: true,
      instructions: "Escolha a cor da alça/interior e faça o upload de 1 foto nítida e o nome a ser personalizado.",
      requirePhotoUpload: true,
    },
    brandId: "brand-glos",
    brandName: "Nivah Atelier",
    price: 59.9,
    costPrice: 16.5,
    installments: 2,
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80",
      "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=800&q=80",
    ],
    variants: [
      { id: "v-branca", name: "Branca Tradicional", inStock: true, sku: "GLOS-CAN-WHT" },
      { id: "v-rosa", name: "Alça Rosa Claro", inStock: true, sku: "GLOS-CAN-PNK" },
      { id: "v-azul", name: "Alça Azul Céu", inStock: true, sku: "GLOS-CAN-BLU" },
    ],
    stock: 45,
    manageStock: true,
    availability: "pronta_entrega",
    outOfStockAction: "continuar_vendendo",
    sku: "GLOS-CAN-002",
    fiscalInfo: {
      productionType: "fabricacao_propria",
      origin: "0 - Nacional",
      ncm: "69111010",
      gtin: "7891234567891",
    },
    packaging: {
      weightKg: 0.42,
      heightCm: 11,
      widthCm: 13,
      depthCm: 13,
    },
    seo: {
      tagTitle: "Caneca Personalizada com Foto e Frase | Glos Presentes",
      metaDescription: "Presenteie com emoção: caneca de porcelana com sua foto e frase especial de carinho.",
      slug: "caneca-porcelana-foto-frase-carinho",
    },
    specifications: {
      dimensions: "9.5 x 8.2 cm (325ml)",
      weight: "360g",
      material: "Porcelana Importada Resinada AAA",
    },
    featured: true,
    new: true,
    bestseller: true,
    active: true,
    deleted: false,
    rating: 4.9,
    reviewCount: 52,
  },
  {
    id: "prod-caixa-memorias-gravacao",
    slug: "caixa-memorias-personalizada-gravacao-laser",
    name: "Caixa Memórias com Gravação a Laser",
    shortDescription: "Caixa em madeira nobre com gravação dos nomes e data marcante para guardar cartas, fotos e lembranças.",
    description: "Confeccionada em compensado naval e madeira tratada com gravação a laser precisa. Perfeita para casais, famílias e marcos inesquecíveis como casamentos, bodas e nascimentos.",
    category: "presentes-criativos",
    categoryName: "Presentes Criativos",
    productType: "personalizavel",
    customizationOptions: {
      allowPhoto: false,
      allowName: true,
      allowMessage: true,
      allowColor: false,
      instructions: "Digite o título da tampa (ex: 'Nossa História'), os 2 nomes e a data comemorativa.",
      requirePhotoUpload: false,
    },
    brandId: "brand-glos",
    brandName: "Nivah Atelier",
    price: 189.0,
    promotionalPrice: 175.0,
    costPrice: 58.0,
    installments: 5,
    images: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80",
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&q=80",
    ],
    stock: 12,
    manageStock: true,
    availability: "sob_encomenda",
    outOfStockAction: "continuar_vendendo",
    sku: "GLOS-BOX-003",
    fiscalInfo: {
      productionType: "fabricacao_propria",
      origin: "0 - Nacional",
      ncm: "44209000",
    },
    packaging: {
      weightKg: 0.8,
      heightCm: 10,
      widthCm: 25,
      depthCm: 25,
    },
    seo: {
      tagTitle: "Caixa Memórias de Madeira Gravada a Laser | Glos",
      metaDescription: "Guarde as melhores recordações em uma caixa de madeira personalizada com gravação a laser de nomes e datas.",
      slug: "caixa-memorias-personalizada-gravacao-laser",
    },
    specifications: {
      dimensions: "24 x 24 x 9 cm",
      weight: "680g",
      material: "Madeira Pinus e Acrílico Cristal",
    },
    featured: false,
    new: true,
    bestseller: true,
    active: true,
    deleted: false,
    rating: 4.9,
    reviewCount: 19,
  },
  {
    id: "prod-linha-peanuts-snoopy",
    slug: "caneca-colecionavel-snoopy-charlie-brown-oficial",
    name: "Caneca Colecionável Snoopy & Charlie Brown (Linha Oficial)",
    shortDescription: "Arte original licenciada sob contrato Peanuts Worldwide. Embalagem colecionável selada.",
    description: "Item colecionável oficial da turma do Snoopy. Desenvolvido com arte exclusiva autorizada pela Peanuts Worldwide LLC. Porcelana decorada com esmalte atóxico de alta resistência.",
    category: "copos-garrafas",
    categoryName: "Canecas & Copos",
    productType: "licenciado",
    licensingInfo: {
      licensor: "Peanuts Worldwide LLC",
      contractNumber: "LIC-PEA-BR-2026/04",
      validUntil: "31 dez, 27",
    },
    brandId: "brand-peanuts",
    brandName: "Peanuts / Snoopy",
    price: 89.9,
    costPrice: 38.0,
    installments: 3,
    images: [
      "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&q=80",
    ],
    stock: 28,
    manageStock: true,
    availability: "pronta_entrega",
    outOfStockAction: "indisponivel",
    sku: "LIC-SNP-001",
    fiscalInfo: {
      productionType: "revenda",
      origin: "0 - Nacional",
      ncm: "69111010",
      gtin: "7899988776655",
    },
    packaging: {
      weightKg: 0.45,
      heightCm: 12,
      widthCm: 14,
      depthCm: 14,
    },
    seo: {
      tagTitle: "Caneca Oficial Snoopy e Charlie Brown | Glos Presentes",
      metaDescription: "Caneca colecionável oficial licenciada Snoopy. Presente perfeito para fãs de Peanuts.",
      slug: "caneca-colecionavel-snoopy-charlie-brown-oficial",
    },
    specifications: {
      dimensions: "10 x 8.5 cm (350ml)",
      weight: "390g",
      material: "Porcelana Esmaltada Licenciada",
    },
    featured: false,
    new: true,
    bestseller: false,
    active: true,
    deleted: false,
    rating: 4.8,
    reviewCount: 15,
  },
  {
    id: "prod-difusor-aromas-casa",
    slug: "difusor-de-ambientes-aromas-da-casa-250ml",
    name: "Difusor de Ambientes Aromas da Casa (250ml)",
    shortDescription: "Difusor botânico com varetas de fibra de algodão e fragrância acolhedora de Alecrim e Flor de Laranjeira.",
    description: "Fragrância sofisticada com alta fixação para transformar a atmosfera do lar. Frasco de vidro âmbar minimalista com tampa de madeira reflorestada.",
    category: "casa-utilidades",
    categoryName: "Casa & Bem-Estar",
    productType: "simples",
    brandId: "brand-glos",
    brandName: "Nivah Atelier",
    price: 79.9,
    costPrice: 24.0,
    installments: 2,
    images: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80",
    ],
    stock: 22,
    manageStock: true,
    availability: "pronta_entrega",
    outOfStockAction: "indisponivel",
    sku: "GLOS-DIF-005",
    fiscalInfo: {
      productionType: "fabricacao_propria",
      origin: "0 - Nacional",
      ncm: "33074900",
    },
    packaging: {
      weightKg: 0.55,
      heightCm: 22,
      widthCm: 9,
      depthCm: 9,
    },
    seo: {
      tagTitle: "Difusor de Aromas Botânico 250ml | Glos Presentes",
      metaDescription: "Aroma de Alecrim & Flor de Laranjeira com varetas de fibra para perfumar sua casa com delicadeza.",
      slug: "difusor-de-ambientes-aromas-da-casa-250ml",
    },
    specifications: {
      dimensions: "Frasco 14cm + Varetas 25cm (250ml)",
      weight: "510g",
      material: "Vidro Âmbar, Óleos Essenciais e Varetas de Fibra",
    },
    featured: false,
    new: false,
    bestseller: true,
    active: true,
    deleted: false,
    rating: 4.9,
    reviewCount: 27,
  },
  {
    id: "prod-vela-aromatica-vegetal",
    slug: "vela-aromatica-cera-vegetal-mensagem-afeto",
    name: "Vela Aromática Cera Vegetal com Mensagem Secreta",
    shortDescription: "Vela em copo de vidro âmbar com mensagem revelada conforme a cera derrete.",
    description: "Vela artesanal feita com blend de ceras vegetais (coco, palma e arroz), essência premium de Baunilha & Âmbar e pavio 100% algodão.",
    category: "casa-utilidades",
    categoryName: "Casa & Bem-Estar",
    productType: "simples",
    brandId: "brand-glos",
    brandName: "Nivah Atelier",
    price: 49.9,
    costPrice: 14.0,
    installments: 1,
    images: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80",
    ],
    stock: 30,
    manageStock: true,
    availability: "pronta_entrega",
    sku: "GLOS-VEL-006",
    fiscalInfo: {
      productionType: "fabricacao_propria",
      origin: "0 - Nacional",
      ncm: "34060000",
    },
    packaging: {
      weightKg: 0.32,
      heightCm: 8,
      widthCm: 8,
      depthCm: 8,
    },
    specifications: {
      dimensions: "7 x 7 x 8 cm (140g)",
      weight: "290g",
      material: "Cera Vegetal e Vidro Âmbar",
    },
    featured: false,
    new: true,
    bestseller: false,
    active: true,
    deleted: false,
    rating: 5.0,
    reviewCount: 18,
  },
];

// Initial Mock Brands
export const INITIAL_BRANDS: ProductBrand[] = [
  {
    id: "brand-glos",
    name: "Nivah Atelier",
    slug: "nivah-atelier",
    description: "Linha própria artesanal de presentes criativos, velas, papéis e itens afetivos.",
    active: true,
    featured: true,
  },
  {
    id: "brand-peanuts",
    name: "Peanuts / Snoopy",
    slug: "peanuts-snoopy",
    description: "Produtos oficiais licenciados sob contrato internacional Peanuts.",
    active: true,
    featured: false,
  },
  {
    id: "brand-disney",
    name: "Disney Clássicos",
    slug: "disney-classicos",
    description: "Linha licenciada Disney para colecionadores e presentes especiais.",
    active: true,
    featured: false,
  },
];

// Initial Mock Grades (Variações)
export const INITIAL_GRADES: ProductGrade[] = [
  {
    id: "grade-volume-caneca",
    name: "Volume da Caneca",
    options: ["325ml Padrão", "450ml Jumbo", "150ml Espresso"],
    description: "Grades de capacidade para canecas de porcelana.",
  },
  {
    id: "grade-acabamento-caixa",
    name: "Acabamento da Madeira",
    options: ["Natural Fosco", "Mogno Envernizado", "Preto Ébano"],
    description: "Opções de tonalidade de gravação e madeira.",
  },
  {
    id: "grade-aromas",
    name: "Fragrância Aromática",
    options: ["Lavanda Francesa", "Alecrim & Laranjeira", "Baunilha & Âmbar", "Capim Limão"],
    description: "Fragrâncias disponíveis para velas e difusores.",
  },
];

// Initial Mock Segmented Pricing Rules
export const INITIAL_SEGMENTED_RULES: SegmentedPriceRule[] = [
  {
    id: "seg-1",
    productId: "prod-kit-mimo-afetivo",
    customerGroup: "vip",
    price: 129.9,
    marginPercent: 28.5,
  },
  {
    id: "seg-2",
    productId: "prod-kit-mimo-afetivo",
    customerGroup: "corporativo",
    minQuantity: 10,
    price: 119.0,
    marginPercent: 25.0,
  },
  {
    id: "seg-3",
    productId: "prod-caneca-foto-frase",
    customerGroup: "revendedor",
    minQuantity: 20,
    price: 39.9,
    marginPercent: 22.0,
  },
];

// Initial Mock Product Reviews
export const INITIAL_REVIEWS: ProductReview[] = [
  {
    id: "rev-1",
    productId: "prod-kit-mimo-afetivo",
    productName: "Kit Mimo Afetivo (Caneca + Vela + Foto Polaroid)",
    customerName: "Fernanda Albuquerque",
    rating: 5,
    comment: "Minha mãe chorou de emoção quando abriu o pacote! A qualidade da foto na caneca e o cheirinho da vela são surreais de bons.",
    photoUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
    createdAt: "20 ago, 26",
    status: "aprovado",
  },
  {
    id: "rev-2",
    productId: "prod-caneca-foto-frase",
    productName: "Caneca Porcelana Foto & Frase Carinho",
    customerName: "Lucas Mendonça",
    rating: 5,
    comment: "Chegou super bem embalada em plástico bolha e com uma fita linda. O acabamento da porcelana é impecável.",
    createdAt: "18 ago, 26",
    status: "aprovado",
  },
  {
    id: "rev-3",
    productId: "prod-caixa-memorias-gravacao",
    productName: "Caixa Memórias com Gravação a Laser",
    customerName: "Camila Ribeiro",
    rating: 5,
    comment: "A gravação a laser ficou perfeita, muito nítida. Guardamos nossos votos de casamento dentro dela.",
    photoUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400&q=80",
    createdAt: "15 ago, 26",
    status: "pendente",
  },
];

const LOCAL_STORAGE_KEY_PRODUCTS = "glos_admin_products_v2";
const LOCAL_STORAGE_KEY_BRANDS = "glos_admin_brands_v2";
const LOCAL_STORAGE_KEY_GRADES = "glos_admin_grades_v2";
const LOCAL_STORAGE_KEY_SEGMENTED = "glos_admin_segmented_v2";
const LOCAL_STORAGE_KEY_REVIEWS = "glos_admin_reviews_v2";

/**
 * Carrega todos os produtos salvos ou inicializa mock
 */
export function getProductsFromStorage(): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(INITIAL_GLOS_PRODUCTS));
  return INITIAL_GLOS_PRODUCTS;
}

export function saveProductsToStorage(products: Product[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  } catch {}
}

export function getBrandsFromStorage(): ProductBrand[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_BRANDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(LOCAL_STORAGE_KEY_BRANDS, JSON.stringify(INITIAL_BRANDS));
  return INITIAL_BRANDS;
}

export function saveBrandsToStorage(brands: ProductBrand[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_BRANDS, JSON.stringify(brands));
  } catch {}
}

export function getGradesFromStorage(): ProductGrade[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_GRADES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(LOCAL_STORAGE_KEY_GRADES, JSON.stringify(INITIAL_GRADES));
  return INITIAL_GRADES;
}

export function saveGradesToStorage(grades: ProductGrade[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_GRADES, JSON.stringify(grades));
  } catch {}
}

export function getSegmentedRulesFromStorage(): SegmentedPriceRule[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SEGMENTED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(LOCAL_STORAGE_KEY_SEGMENTED, JSON.stringify(INITIAL_SEGMENTED_RULES));
  return INITIAL_SEGMENTED_RULES;
}

export function saveSegmentedRulesToStorage(rules: SegmentedPriceRule[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SEGMENTED, JSON.stringify(rules));
  } catch {}
}

export function getReviewsFromStorage(): ProductReview[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_REVIEWS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  localStorage.setItem(LOCAL_STORAGE_KEY_REVIEWS, JSON.stringify(INITIAL_REVIEWS));
  return INITIAL_REVIEWS;
}

export function saveReviewsToStorage(reviews: ProductReview[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_REVIEWS, JSON.stringify(reviews));
  } catch {}
}

/**
 * Função de geração de rascunho de produto com IA (Gemini).
 * Assinatura pronta para conectar a /api/ai/product-draft
 */
export async function generateProductDraft(prompt: string): Promise<Partial<Product>> {
  try {
    const res = await fetch("/api/ai/product-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.name) return data;
    }
  } catch {}

  // Rascunho enriquecido com tom de afeto da Glos
  const cleanPrompt = prompt.trim() || "Kit Presente Afetivo";
  return {
    name: `Kit ${cleanPrompt.charAt(0).toUpperCase() + cleanPrompt.slice(1)} com Dedicatória`,
    shortDescription: `Uma seleção acolhedora pensada para transformar momentos simples em memórias eternas com a curadoria da Nivah.`,
    description: `Composto por itens artesanais de alta qualidade e acabamento delicado. Cada detalhe foi desenhado para despertar emoções verdadeiras, acompanhando caixa rígida especial com fita de cetim e cartão para sua dedicatória personalizada.`,
    productType: "personalizavel",
    customizationOptions: {
      allowPhoto: true,
      allowName: true,
      allowMessage: true,
      instructions: "Envie a foto e a mensagem que deseja incluir na personalização.",
      requirePhotoUpload: true,
    },
    price: 139.9,
    costPrice: 42.0,
    installments: 3,
    stock: 20,
    sku: `GLOS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    specifications: {
      packageContents: "1x Item Principal, 1x Cartão Dedicatória com Envelope, 1x Caixa Rígida Kraft",
      material: "Matéria-prima nobre e acabamento manual",
    },
    seo: {
      tagTitle: `Kit ${cleanPrompt} Personalizado | Glos Presentes`,
      metaDescription: `Presenteie com afeto: Kit ${cleanPrompt} com foto, mensagem e embalagem exclusiva.`,
    },
  };
}
