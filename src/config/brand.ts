/**
 * CONFIGURAÇÃO CENTRAL DA MARCA — glos.
 * Marca: glos. (glos. presentes)
 * Nicho: Presentes afetivos, kits finos e produtos personalizados para pessoa física.
 * Aplicação standalone - Nenhuma credencial/segredo neste arquivo (sempre em variáveis de ambiente do servidor).
 */

export interface BrandConfig {
  name: string;
  displayName: string;
  shortName: string;
  adminLabel: string;
  tagline: string;
  description: string;
  whatsapp: string;
  whatsappDisplay: string;
  whatsappLink: string;
  contactWhatsapp: {
    display: string;
    link: string;
    rawNumber: string;
  };
  email: string;
  phone: string;
  phoneDisplay: string;
  openingHours: string;
  freeShippingThreshold: number; // Em reais
  maxInstallmentsWithoutInterest: number;
  pixDiscountPercentage: number;
  cnpjPlaceholder: string;
  addressPlaceholder: string;
  instagramHandle: string;
  isDemoMode: boolean;
}

export const BRAND_CONFIG: BrandConfig = {
  name: "glos.",
  displayName: "glos. presentes",
  shortName: "glos.",
  adminLabel: "Painel do Lojista",
  tagline: "Presentes finos, kits afetivos e criações personalizadas com foto e gravação",
  description: "Curadoria autoral de presentes criativos, kits com afeto, papelaria fina e itens personalizados para surpreender quem você ama.",
  whatsapp: "5511989749229",
  whatsappDisplay: "(11) 98974-9229",
  whatsappLink: "https://wa.me/5511989749229",
  contactWhatsapp: {
    display: "(11) 98974-9229",
    link: "https://wa.me/5511989749229",
    rawNumber: "5511989749229",
  },
  email: "contato@glospresentes.com.br",
  phone: "5511989749229",
  phoneDisplay: "(11) 98974-9229",
  openingHours: "Segunda a Sexta das 09h às 18h | Sábado das 09h às 13h",
  freeShippingThreshold: 249.0, // Frete grátis acima de R$ 249
  maxInstallmentsWithoutInterest: 6,
  pixDiscountPercentage: 5, // 5% de desconto no Pix
  cnpjPlaceholder: "00.000.000/0001-00 (Demonstrativo)",
  addressPlaceholder: "São Paulo - SP, Brasil",
  instagramHandle: "@glospresentes",
  isDemoMode: true,
};

