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
  whatsapp: "5511947596045",
  whatsappDisplay: "(11) 94759-6045",
  email: "contato@glospresentes.com.br",
  phone: "5511947596045",
  phoneDisplay: "(11) 94759-6045",
  openingHours: "Segunda a Sexta das 09h às 18h | Sábado das 09h às 13h",
  freeShippingThreshold: 249.0, // Frete grátis acima de R$ 249
  maxInstallmentsWithoutInterest: 6,
  pixDiscountPercentage: 5, // 5% de desconto no Pix
  cnpjPlaceholder: "00.000.000/0001-00 (Demonstrativo)",
  addressPlaceholder: "São Paulo - SP, Brasil",
  instagramHandle: "@glospresentes",
  isDemoMode: true,
};

