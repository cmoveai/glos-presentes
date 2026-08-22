import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ShoppingBag,
  Sparkles,
  ArrowUpRight,
  Plus,
  Link as LinkIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  User,
  Package,
  Layers,
  FileText,
} from "lucide-react";
import { Order, OrderType, OrderStep } from "../../types";
import { Card } from "./Card";
import { getOrdersInsight } from "../../services/orderService";

interface OrderListProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
  onCreateOrder: () => void;
  onOpenCartLinks: () => void;
  onOpenAbandonedCarts: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  orders,
  onSelectOrder,
  onCreateOrder,
  onOpenCartLinks,
  onOpenAbandonedCarts,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | OrderType>("all");
  const [selectedStep, setSelectedStep] = useState<string>("all");
  const [onlyActionNeeded, setOnlyActionNeeded] = useState(false);

  // IA Insight calculado
  const insight = useMemo(() => getOrdersInsight(orders), [orders]);

  // Contadores
  const metrics = useMemo(() => {
    const total = orders.length;
    const revendaCount = orders.filter((o) => o.orderType === "revenda").length;
    const personalizadCount = orders.filter((o) => o.orderType === "personalizado").length;
    const actionRequiredCount = orders.filter(
      (o) => o.actionRequired?.needed && o.currentStep !== "entregue" && o.currentStep !== "cancelado"
    ).length;
    const pendingProduction = orders.filter(
      (o) => o.currentStep === "em_producao" || o.currentStep === "arte_aprovacao"
    ).length;

    return { total, revendaCount, personalizadCount, actionRequiredCount, pendingProduction };
  }, [orders]);

  // Filtragem dos pedidos
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          order.id.toLowerCase().includes(query) ||
          (order.orderNumber && order.orderNumber.toLowerCase().includes(query)) ||
          order.customer.name.toLowerCase().includes(query) ||
          order.customer.email.toLowerCase().includes(query) ||
          order.customer.phone.toLowerCase().includes(query) ||
          order.customer.cpf.toLowerCase().includes(query) ||
          order.items.some((i) => i.name.toLowerCase().includes(query));
        if (!matchesQuery) return false;
      }

      // Tipo de pedido
      if (selectedType !== "all" && order.orderType !== selectedType) {
        return false;
      }

      // Etapa
      if (selectedStep !== "all" && order.currentStep !== selectedStep) {
        return false;
      }

      // Ação necessária
      if (onlyActionNeeded && (!order.actionRequired?.needed || order.currentStep === "entregue")) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, selectedType, selectedStep, onlyActionNeeded]);

  const getStepVisual = (order: Order) => {
    const step = order.currentStep;
    switch (step) {
      case "pago":
        return { label: "Pago", dot: "bg-[#004AAD]" };
      case "aguardando_arquivo":
        return { label: "Aguardando Arquivo", dot: "bg-[#9B998F]" };
      case "arte_aprovacao":
        return { label: "Arte em Aprovação", dot: "bg-[#004AAD]" };
      case "em_producao":
        return { label: "Em Produção", dot: "bg-[#004AAD]" };
      case "pronto":
        return { label: "Pronto", dot: "bg-[#0F7A4F]" };
      case "separar":
        return { label: "Aguardando Separação", dot: "bg-[#6B6A64]" };
      case "despachar":
        return { label: "Despachado", dot: "bg-[#004AAD]" };
      case "entregue":
        return { label: "Entregue", dot: "bg-[#0F7A4F]" };
      case "cancelado":
        return { label: "Cancelado", dot: "bg-[#9B2C2C]" };
      default:
        return { label: step || "Processando", dot: "bg-[#6B6A64]" };
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. Header do Módulo com Contadores e Ações Rápidas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#D6D3CC]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-[#272727]">
              Vendas & Pedidos
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#6B6A64] tabular-nums">
              {metrics.total} pedidos
            </span>
          </div>
          <p className="text-xs text-[#6B6A64] mt-1">
            Gestão unificada do Fluxo A (Revenda pronta-entrega) e Fluxo B (Personalizados / Fabricação Glos).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenAbandonedCarts}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#272727] hover:bg-[#EEEDE8] transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-[#6B6A64]" />
            <span>Carrinhos Abandonados</span>
          </button>

          <button
            type="button"
            onClick={onOpenCartLinks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#272727] hover:bg-[#EEEDE8] transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5 text-[#004AAD]" />
            <span>Links de Carrinho</span>
          </button>

          <button
            type="button"
            onClick={onCreateOrder}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Pedido Manual</span>
          </button>
        </div>
      </div>

      {/* 2. Faixa Editorial / Briefing de IA do Ateliê de Pedidos */}
      <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-center text-[#004AAD] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#004AAD]">
                  ● Inteligência Operacional Glos
                </span>
                {insight.urgentCount > 0 && (
                  <span className="text-[10px] text-[#9B2C2C] font-medium">
                    ({insight.urgentCount} pendência{insight.urgentCount > 1 ? "s" : ""})
                  </span>
                )}
              </div>
              <h2 className="text-xs font-medium text-[#272727]">
                {insight.headline}
              </h2>
              <p className="text-xs text-[#6B6A64] max-w-3xl leading-relaxed">
                {insight.detail}
              </p>
            </div>
          </div>

          {insight.urgentCount > 0 && (
            <button
              type="button"
              onClick={() => setOnlyActionNeeded(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs font-medium text-[#004AAD] hover:bg-[#E4E2DD] transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <span>{insight.actionText}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </Card>

      {/* 3. Barra de Filtros Full-Bleed */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de Busca */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9B998F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por #pedido, cliente, CPF ou produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          {/* Filtros em Abas Segmentadas */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Filtro de Tipo de Pedido */}
            <div className="inline-flex rounded-[6px] bg-[#EEEDE8] p-0.5 border border-[#D6D3CC]">
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors ${
                  selectedType === "all"
                    ? "bg-[#F4F3EF] text-[#004AAD]"
                    : "text-[#6B6A64] hover:text-[#272727]"
                }`}
              >
                Todos ({metrics.total})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("personalizado")}
                className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors ${
                  selectedType === "personalizado"
                    ? "bg-[#F4F3EF] text-[#004AAD]"
                    : "text-[#6B6A64] hover:text-[#272727]"
                }`}
              >
                Personalizados ({metrics.personalizadCount})
              </button>
              <button
                type="button"
                onClick={() => setSelectedType("revenda")}
                className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors ${
                  selectedType === "revenda"
                    ? "bg-[#F4F3EF] text-[#004AAD]"
                    : "text-[#6B6A64] hover:text-[#272727]"
                }`}
              >
                Revenda ({metrics.revendaCount})
              </button>
            </div>

            {/* Toggle de Ação Necessária */}
            <button
              type="button"
              onClick={() => setOnlyActionNeeded(!onlyActionNeeded)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border text-xs font-medium transition-colors ${
                onlyActionNeeded
                  ? "bg-[#004AAD] text-white border-[#004AAD]"
                  : "bg-[#F4F3EF] text-[#6B6A64] border-[#D6D3CC] hover:text-[#272727]"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${onlyActionNeeded ? "bg-white" : "bg-[#004AAD]"}`} />
              <span>Ação Necessária ({metrics.actionRequiredCount})</span>
            </button>
          </div>
        </div>

        {/* Filtro de Etapas Específicas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] text-[#9B998F] pr-1 whitespace-nowrap">Etapa:</span>
          {[
            { id: "all", label: "Todas" },
            { id: "pago", label: "Pago" },
            { id: "aguardando_arquivo", label: "Aguardando Arquivo" },
            { id: "arte_aprovacao", label: "Arte em Aprovação" },
            { id: "em_producao", label: "Em Produção" },
            { id: "separar", label: "Separar" },
            { id: "despachar", label: "Despachado" },
            { id: "entregue", label: "Entregue" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStep(st.id)}
              className={`px-2.5 py-1 rounded-[4px] border whitespace-nowrap transition-colors ${
                selectedStep === st.id
                  ? "bg-[#004AAD] text-white border-[#004AAD]"
                  : "bg-[#F4F3EF] text-[#6B6A64] border-[#D6D3CC] hover:bg-[#EEEDE8]"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Tabela Full-Bleed de Pedidos */}
      <div className="w-full bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D6D3CC] bg-[#EEEDE8] text-[#6B6A64]">
                <th className="py-2.5 px-4 font-medium">Pedido</th>
                <th className="py-2.5 px-4 font-medium">Cliente</th>
                <th className="py-2.5 px-4 font-medium">Natureza</th>
                <th className="py-2.5 px-4 font-medium">Itens</th>
                <th className="py-2.5 px-4 font-medium text-right">Total</th>
                <th className="py-2.5 px-4 font-medium">Etapa / Status</th>
                <th className="py-2.5 px-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D3CC]">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const stepVisual = getStepVisual(order);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder(order.id)}
                      className="hover:bg-[#EEEDE8] transition-colors cursor-pointer group"
                    >
                      {/* 1. Pedido */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-[#272727] group-hover:text-[#004AAD] transition-colors">
                            {order.orderNumber || order.id}
                          </span>
                          <span className="text-[10px] text-[#9B998F] block tabular-nums">
                            {order.createdAt}
                          </span>
                        </div>
                      </td>

                      {/* 2. Cliente */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-medium text-[#272727] block truncate max-w-[160px]">
                            {order.customer.name}
                          </span>
                          <span className="text-[10px] text-[#6B6A64] block truncate max-w-[160px]">
                            {order.customer.phone}
                          </span>
                        </div>
                      </td>

                      {/* 3. Natureza */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-[4px] border text-[10px] font-medium ${
                            order.orderType === "personalizado"
                              ? "bg-[#EEEDE8] border-[#D6D3CC] text-[#004AAD]"
                              : "bg-[#EEEDE8] border-[#D6D3CC] text-[#6B6A64]"
                          }`}
                        >
                          {order.orderType === "personalizado" ? "Personalizado (Fluxo B)" : "Revenda (Fluxo A)"}
                        </span>
                      </td>

                      {/* 4. Itens */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <img
                                key={idx}
                                src={item.image}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="inline-block h-7 w-7 rounded-[4px] object-cover ring-1 ring-[#D6D3CC] bg-white"
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-[#6B6A64] truncate max-w-[180px]">
                            {order.items[0]?.name}
                            {order.items.length > 1 && ` (+${order.items.length - 1})`}
                          </span>
                        </div>
                      </td>

                      {/* 5. Total */}
                      <td className="py-3 px-4 text-right">
                        <div className="space-y-0.5">
                          <span className="font-medium text-[#272727] tabular-nums">
                            R$ {order.total.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-[10px] text-[#9B998F] block uppercase">
                            {order.paymentMethod === "pix" ? "PIX" : "Cartão"}
                          </span>
                        </div>
                      </td>

                      {/* 6. Etapa / Status (Rótulo + Ponto) */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC]">
                            <span className={`w-1.5 h-1.5 rounded-full ${stepVisual.dot}`} />
                            <span className="text-[11px] font-medium text-[#272727]">
                              {stepVisual.label}
                            </span>
                          </div>

                          {order.actionRequired?.needed && order.currentStep !== "entregue" && (
                            <div className="flex items-center gap-1 text-[10px] text-[#004AAD] font-medium">
                              <span>● Ação no Ateliê</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 7. Ação */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs text-[#004AAD] font-medium group-hover:underline flex items-center gap-1">
                            <span>Abrir</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#6B6A64]">
                    <Package className="w-6 h-6 mx-auto mb-2 text-[#9B998F]" />
                    <p className="font-medium text-xs text-[#272727]">
                      Nenhum pedido encontrado com estes filtros
                    </p>
                    <p className="text-[11px] text-[#9B998F] mt-0.5">
                      Tente alterar os termos de busca ou filtros selecionados.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
