import {
  Order,
  OrderType,
  OrderStep,
  CartLink,
  AbandonedCart,
  ItemPersonalization,
  CustomerFile,
} from "../types";

const ORDERS_STORAGE_KEY = "glos_admin_orders_v1";
const CART_LINKS_STORAGE_KEY = "glos_admin_cart_links_v1";
const ABANDONED_CARTS_STORAGE_KEY = "glos_admin_abandoned_carts_v1";

/**
 * Lista inicial vazia de pedidos para a loja nascer em estado limpo (sem dados fictícios)
 */
export const INITIAL_ORDERS: Order[] = [];

/**
 * Lista inicial de Links de Carrinho
 */
export const INITIAL_CART_LINKS: CartLink[] = [];

/**
 * Lista inicial de Carrinhos Abandonados
 */
export const INITIAL_ABANDONED_CARTS: AbandonedCart[] = [];

// Helper para calcular se um pedido é Revenda (Fluxo A) ou Personalizado (Fluxo B)
export function deriveOrderType(items: Order["items"]): OrderType {
  const hasCustomizable = items.some(
    (item) =>
      item.productType === "personalizavel" ||
      Boolean(item.personalization) ||
      item.name.toLowerCase().includes("personalizad") ||
      item.name.toLowerCase().includes("foto") ||
      item.name.toLowerCase().includes("spotify") ||
      item.name.toLowerCase().includes("interativ")
  );
  return hasCustomizable ? "personalizado" : "revenda";
}

// Storage helpers
export function getOrdersFromStorage(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn("Erro ao ler pedidos do localStorage:", e);
  }
  return INITIAL_ORDERS;
}

export function saveOrdersToStorage(orders: Order[]): void {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn("Erro ao salvar pedidos no localStorage:", e);
  }
}

export function getCartLinksFromStorage(): CartLink[] {
  try {
    const raw = localStorage.getItem(CART_LINKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_CART_LINKS;
}

export function saveCartLinksToStorage(links: CartLink[]): void {
  try {
    localStorage.setItem(CART_LINKS_STORAGE_KEY, JSON.stringify(links));
  } catch (e) {}
}

export function getAbandonedCartsFromStorage(): AbandonedCart[] {
  try {
    const raw = localStorage.getItem(ABANDONED_CARTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return INITIAL_ABANDONED_CARTS;
}

export function saveAbandonedCartsToStorage(carts: AbandonedCart[]): void {
  try {
    localStorage.setItem(ABANDONED_CARTS_STORAGE_KEY, JSON.stringify(carts));
  } catch (e) {}
}

// Etapas do Fluxo A (Revenda)
export const REVENDA_STEPS: Array<{ id: OrderStep; label: string; description: string }> = [
  { id: "pago", label: "Pago", description: "Pagamento aprovado no gateway" },
  { id: "separar", label: "Separar", description: "Separação e embalagem para presente" },
  { id: "despachar", label: "Despachar", description: "Postagem e envio com código de rastreio" },
  { id: "entregue", label: "Entregue", description: "Entregue ao cliente com sucesso" },
];

// Etapas do Fluxo B (Personalizado)
export const PERSONALIZADO_STEPS: Array<{ id: OrderStep; label: string; description: string }> = [
  { id: "pago", label: "Pago", description: "Pagamento confirmado" },
  { id: "aguardando_arquivo", label: "Aguardando arquivo", description: "Aguardando fotos, áudio ou texto do cliente" },
  { id: "arte_aprovacao", label: "Arte em aprovação", description: "Mockup gerado e enviado para validação" },
  { id: "em_producao", label: "Em produção", description: "Sublimação, corte a laser ou impressão" },
  { id: "pronto", label: "Pronto", description: "Peça finalizada e embalada com afeto" },
  { id: "despachar", label: "Despachar", description: "Postagem e rastreamento" },
  { id: "entregue", label: "Entregue", description: "Presente entregue ao destinatário" },
];

/**
 * Gera Insight de IA para a listagem de pedidos
 */
export function getOrdersInsight(orders: Order[]): {
  headline: string;
  detail: string;
  actionText?: string;
  urgentCount: number;
} {
  if (orders.length === 0) {
    return {
      headline: "Loja pronta para receber os primeiros pedidos",
      detail: "Assim que novos pedidos forem confirmados na loja, eles aparecerão aqui com status de pagamento e fluxo de produção em tempo real.",
      urgentCount: 0,
    };
  }

  const pendingActionOrders = orders.filter(
    (o) => o.actionRequired?.needed && o.currentStep !== "entregue" && o.currentStep !== "cancelado"
  );

  if (pendingActionOrders.length > 0) {
    return {
      headline: `${pendingActionOrders.length} pedidos personalizados requerem sua atenção no ateliê`,
      detail: `Existem pedidos com atenção necessária na esteira de produção ou aprovação. Acompanhe os detalhes para manter o prazo de entrega em dia.`,
      actionText: "Ver pedidos que precisam de ação",
      urgentCount: pendingActionOrders.length,
    };
  }

  return {
    headline: "Fluxo de produção e expedição operando sem gargalos",
    detail: "Todos os pedidos pagos estão com artes aprovadas ou em rota de entrega normal. Nenhuma pendência crítica identificada.",
    urgentCount: 0,
  };
}
