/**
 * CONFIGURAÇÃO CENTRAL DA MARCA — Nivah
 * Marca: Nivah (Nivah presentes criativos)
 * Nicho: Presentes criativos, kits afetivos e produtos personalizados para pessoa física.
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
  name: "Nivah",
  displayName: "Nivah presentes criativos",
  shortName: "Nivah",
  adminLabel: "Painel do Lojista",
  tagline: "Presentes criativos, kits afetivos e criações personalizadas com carinho",
  description: "Curadoria autoral de presentes criativos, kits com afeto, papelaria e itens personalizados para surpreender quem você ama.",
  whatsapp: "5511961820588",
  whatsappDisplay: "(11) 96182-0588",
  whatsappLink: "https://wa.me/5511961820588",
  contactWhatsapp: {
    display: "(11) 96182-0588",
    link: "https://wa.me/5511961820588",
    rawNumber: "5511961820588",
  },
  email: "contato@nivahpresentes.com.br",
  phone: "5511961820588",
  phoneDisplay: "(11) 96182-0588",
  openingHours: "Segunda a Sexta das 09h às 18h | Sábado das 09h às 13h",
  freeShippingThreshold: 249.0, // Frete grátis acima de R$ 249
  maxInstallmentsWithoutInterest: 10,
  pixDiscountPercentage: 5, // 5% de desconto no Pix
  cnpjPlaceholder: "00.000.000/0001-00 (Demonstrativo)",
  addressPlaceholder: "São Paulo - SP, Brasil",
  instagramHandle: "@nivahpresentes",
  isDemoMode: true,
};

