/**
 * CONFIGURAÇÃO CENTRAL DA MARCA
 * Conforme especificação: enquanto o naming oficial não estiver definido,
 * utilize "NOME DA MARCA" como placeholder editável neste único arquivo.
 */

export interface BrandConfig {
  name: string;
  shortName: string;
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
  name: "Ativva Gifts",
  shortName: "Ativva",
  tagline: "Presentes e objetos de design que transformam o dia a dia",
  description: "Curadoria autoral de presentes criativos, utilidades para casa, cozinha contemporânea, tecnologia e kits especiais feitos para surpreender.",
  whatsapp: "5511947596045",
  whatsappDisplay: "(11) 94759-6045",
  email: "contato@ativvagifts.com.br",
  phone: "5511947596045",
  phoneDisplay: "(11) 94759-6045",
  openingHours: "Segunda a Sexta das 09h às 18h | Sábado das 09h às 13h",
  freeShippingThreshold: 249.0, // Frete grátis acima de R$ 249
  maxInstallmentsWithoutInterest: 10,
  pixDiscountPercentage: 5, // 5% de desconto no Pix
  cnpjPlaceholder: "00.000.000/0001-00 (Demonstrativo)",
  addressPlaceholder: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",
  instagramHandle: "@nomedamarca",
  isDemoMode: true,
};
