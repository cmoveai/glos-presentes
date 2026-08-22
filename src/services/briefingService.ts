/**
 * SERVIÇO DE BRIEFING EXECUTIVO DE IA — glos.
 * Conecta ao endpoint /api/ai/briefing-executive (Gemini) com fallback mock enriquecido.
 */

export interface BriefingKpi {
  id: string;
  label: string;
  value: string;
  rawNumber: number;
  variationPercent: number;
  isPositive: boolean;
  sparkline: number[];
  periodLabel: string;
}

export interface BestSellerItem {
  id: string;
  rank: number;
  name: string;
  category: string;
  price: number;
  salesCount: number;
  revenue: number;
  imageUrl: string;
  sparkline: number[];
}

export interface NextActionItem {
  id: string;
  diagnosis: string;
  category: "carrinho" | "estoque" | "relacionamento" | "precificacao";
  actionLabel: string;
  actionType: "whatsapp" | "estoque" | "cupom" | "cliente";
  targetPayload?: any;
}

export type OrderStatus = "pendente" | "processando" | "concluido" | "cancelado";

export interface RecentOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  productSummary: string;
  amount: number;
  status: OrderStatus;
  date: string;
}

export interface BriefingData {
  updatedAt: string;
  summaryParagraph: string;
  anchorMetric: {
    label: string;
    value: string;
    sublabel: string;
  };
  kpis: BriefingKpi[];
  bestSellers: BestSellerItem[];
  nextActions: NextActionItem[];
  recentOrders: RecentOrderItem[];
}

const MOCK_BRIEFING: BriefingData = {
  updatedAt: "Atualizado hoje às 09h",
  summaryParagraph:
    "Ontem a Glos vendeu R$ 1.240 — 18% acima da média de quarta. O Kit Mimo Afetivo com foto personalizada puxou quase metade desse faturamento. Um carrinho de R$ 210 ficou para trás no checkout: vale a pena acionar no WhatsApp com uma mensagem de carinho.",
  anchorMetric: {
    label: "Faturamento de ontem",
    value: "R$ 1.240,00",
    sublabel: "+18% vs média semanal",
  },
  kpis: [
    {
      id: "faturamento-hoje",
      label: "Faturamento (hoje)",
      value: "R$ 1.890,00",
      rawNumber: 1890,
      variationPercent: 14.2,
      isPositive: true,
      sparkline: [25, 38, 30, 48, 62, 58, 85],
      periodLabel: "vs. ontem",
    },
    {
      id: "pedidos",
      label: "Pedidos",
      value: "14",
      rawNumber: 14,
      variationPercent: 8.0,
      isPositive: true,
      sparkline: [3, 5, 4, 7, 8, 6, 14],
      periodLabel: "vs. ontem",
    },
    {
      id: "ticket-medio",
      label: "Ticket médio",
      value: "R$ 135,00",
      rawNumber: 135,
      variationPercent: 5.4,
      isPositive: true,
      sparkline: [122, 126, 129, 131, 130, 133, 135],
      periodLabel: "vs. média 30d",
    },
    {
      id: "conversao",
      label: "Taxa de conversão",
      value: "2,8%",
      rawNumber: 2.8,
      variationPercent: -0.3,
      isPositive: false,
      sparkline: [3.2, 3.1, 2.9, 3.0, 2.7, 2.9, 2.8],
      periodLabel: "vs. ontem",
    },
  ],
  bestSellers: [
    {
      id: "p-1",
      rank: 1,
      name: "Kit Mimo Afetivo (Caneca + Vela + Foto)",
      category: "Kits & Afeto",
      price: 149.9,
      salesCount: 42,
      revenue: 6295.8,
      imageUrl: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&q=80",
      sparkline: [20, 25, 32, 28, 38, 42],
    },
    {
      id: "p-2",
      rank: 2,
      name: "Caixa Memórias Personalizada com Gravação",
      category: "Personalizados",
      price: 189.0,
      salesCount: 38,
      revenue: 7182.0,
      imageUrl: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=300&q=80",
      sparkline: [15, 22, 28, 31, 35, 38],
    },
    {
      id: "p-3",
      rank: 3,
      name: "Caneca Porcelana Foto & Frase Carinho",
      category: "Canecas",
      price: 59.9,
      salesCount: 31,
      revenue: 1856.9,
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&q=80",
      sparkline: [12, 18, 20, 25, 29, 31],
    },
    {
      id: "p-4",
      rank: 4,
      name: "Álbum Sanfonado Linho & Fotos Polaroid",
      category: "Papelaria Fina",
      price: 119.0,
      salesCount: 27,
      revenue: 3213.0,
      imageUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&q=80",
      sparkline: [10, 14, 18, 22, 24, 27],
    },
    {
      id: "p-5",
      rank: 5,
      name: "Difusor de Ambientes Aromas da Casa (250ml)",
      category: "Casa & Bem-Estar",
      price: 79.9,
      salesCount: 22,
      revenue: 1757.8,
      imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&q=80",
      sparkline: [8, 12, 15, 17, 20, 22],
    },
    {
      id: "p-6",
      rank: 6,
      name: "Porta-Retrato Acrílico Magnético Duplo",
      category: "Decoração",
      price: 89.0,
      salesCount: 19,
      revenue: 1691.0,
      imageUrl: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=300&q=80",
      sparkline: [6, 9, 12, 14, 17, 19],
    },
    {
      id: "p-7",
      rank: 7,
      name: "Vela Aromática Cera Vegetal com Mensagem",
      category: "Velas",
      price: 49.9,
      salesCount: 17,
      revenue: 848.3,
      imageUrl: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300&q=80",
      sparkline: [5, 7, 10, 12, 15, 17],
    },
    {
      id: "p-8",
      rank: 8,
      name: "Chaveiro em Couro Legítimo com Iniciais",
      category: "Acessórios",
      price: 39.9,
      salesCount: 15,
      revenue: 598.5,
      imageUrl: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300&q=80",
      sparkline: [4, 6, 8, 11, 13, 15],
    },
    {
      id: "p-9",
      rank: 9,
      name: "Planner Permanente Afeto & Metas Diárias",
      category: "Papelaria",
      price: 98.0,
      salesCount: 14,
      revenue: 1372.0,
      imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=300&q=80",
      sparkline: [3, 5, 8, 10, 12, 14],
    },
    {
      id: "p-10",
      rank: 10,
      name: "Kit Café & Afeto (Xícara + Café Especial)",
      category: "Gourmet",
      price: 129.0,
      salesCount: 12,
      revenue: 1548.0,
      imageUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300&q=80",
      sparkline: [2, 4, 6, 8, 10, 12],
    },
  ],
  nextActions: [
    {
      id: "act-1",
      diagnosis: "Recuperar carrinho de R$ 210,00 (Kit Memórias) abandonado há 2 horas no checkout.",
      category: "carrinho",
      actionLabel: "Enviar no WhatsApp",
      actionType: "whatsapp",
      targetPayload: { phone: "11987654321", customer: "Juliana Mendes", amount: "R$ 210,00" },
    },
    {
      id: "act-2",
      diagnosis: "Kit Mimo Afetivo com estoque baixo (apenas 4 unidades restantes para o fim de semana).",
      category: "estoque",
      actionLabel: "Repor estoque",
      actionType: "estoque",
      targetPayload: { productId: "p-1", currentStock: 4 },
    },
    {
      id: "act-3",
      diagnosis: "12 clientes especiais estão sem comprar presentes há mais de 60 dias.",
      category: "relacionamento",
      actionLabel: "Reativar com cupom",
      actionType: "cupom",
      targetPayload: { audienceCount: 12, suggestedDiscount: "10%" },
    },
  ],
  recentOrders: [
    {
      id: "ord-1042",
      orderNumber: "#1042",
      customerName: "Mariana Souza",
      productSummary: "Kit Mimo Afetivo + Cartão Afeto",
      amount: 159.9,
      status: "concluido",
      date: "22 ago, 26",
    },
    {
      id: "ord-1041",
      orderNumber: "#1041",
      customerName: "Carlos Eduardo",
      productSummary: "Caixa Memórias com Gravação a Laser",
      amount: 189.0,
      status: "processando",
      date: "22 ago, 26",
    },
    {
      id: "ord-1040",
      orderNumber: "#1040",
      customerName: "Beatriz Lima",
      productSummary: "Caneca Foto & Frase Carinho (2 un.)",
      amount: 119.8,
      status: "processando",
      date: "22 ago, 26",
    },
    {
      id: "ord-1039",
      orderNumber: "#1039",
      customerName: "Rodrigo Fagundes",
      productSummary: "Álbum Sanfonado Linho & Fotos",
      amount: 119.0,
      status: "pendente",
      date: "21 ago, 26",
    },
    {
      id: "ord-1038",
      orderNumber: "#1038",
      customerName: "Camila Nogueira",
      productSummary: "Difusor de Ambientes Aromas da Casa",
      amount: 79.9,
      status: "concluido",
      date: "21 ago, 26",
    },
  ],
};

/**
 * Retorna os dados do briefing executivo de IA.
 * Conectado via backend ou mock resiliente.
 */
export async function getBriefing(): Promise<BriefingData> {
  try {
    const response = await fetch("/api/ai/briefing-executive");
    if (response.ok) {
      const data = await response.json();
      if (data && data.summaryParagraph) {
        return data;
      }
    }
  } catch (e) {
    // Silently fall back to enriched mock
  }
  return MOCK_BRIEFING;
}
