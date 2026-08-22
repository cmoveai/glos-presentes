import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "./Card";
import { RecentOrderItem, OrderStatus } from "../../services/briefingService";

interface RecentOrdersPreviewProps {
  orders: RecentOrderItem[];
  onViewAll?: () => void;
  onSelectOrder?: (orderId: string) => void;
  className?: string;
}

/**
 * 5) Pedidos Recentes (Prévia) — glos.
 * Tabela enxuta de 5 linhas: Cliente · Produto · Valor · Situação (diferenciada por rótulo + ponto discreto).
 */
export const RecentOrdersPreview: React.FC<RecentOrdersPreviewProps> = ({
  orders,
  onViewAll,
  onSelectOrder,
  className = "",
}) => {
  const getStatusIndicator = (status: OrderStatus) => {
    switch (status) {
      case "concluido":
        return {
          dotColor: "bg-[#0F7A4F]",
          label: "Concluído",
          textColor: "text-[#272727]",
        };
      case "processando":
        return {
          dotColor: "bg-[#004AAD]",
          label: "Em processamento",
          textColor: "text-[#272727]",
        };
      case "pendente":
        return {
          dotColor: "bg-[#9B998F]",
          label: "Pendente",
          textColor: "text-[#6B6A64]",
        };
      case "cancelado":
        return {
          dotColor: "bg-[#9B2C2C]",
          label: "Cancelado",
          textColor: "text-[#6B6A64]",
        };
    }
  };

  return (
    <Card padding="md" className={`w-full overflow-hidden ${className}`}>
      {/* Header do Bloco */}
      <div className="flex items-center justify-between pb-4 border-b border-[#D6D3CC]">
        <div>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#004AAD] block">
            Fluxo de Vendas
          </span>
          <h3 className="text-base font-medium text-[#272727]">
            Pedidos recentes
          </h3>
        </div>

        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#004AAD] hover:underline"
        >
          <span>Ver todos os pedidos</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabela Enxuta */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#272727]">
          <thead>
            <tr className="border-b border-[#D6D3CC] text-[11px] text-[#9B998F] uppercase tracking-wider">
              <th className="py-3 font-normal">Pedido / Cliente</th>
              <th className="py-3 font-normal">Produto / Personalização</th>
              <th className="py-3 font-normal text-right">Valor</th>
              <th className="py-3 font-normal text-right">Data</th>
              <th className="py-3 font-normal text-right">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6D3CC]">
            {orders.map((order) => {
              const statusConfig = getStatusIndicator(order.status);
              return (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder && onSelectOrder(order.id)}
                  className="hover:bg-[#EEEDE8] transition-colors cursor-pointer"
                >
                  {/* Pedido / Cliente */}
                  <td className="py-3.5 pr-3">
                    <div className="font-medium text-[#272727]">{order.customerName}</div>
                    <span className="text-[11px] text-[#9B998F] tabular-nums">
                      {order.orderNumber}
                    </span>
                  </td>

                  {/* Produto */}
                  <td className="py-3.5 px-3 max-w-[280px]">
                    <span className="text-[#6B6A64] font-normal line-clamp-1">
                      {order.productSummary}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="py-3.5 px-3 text-right font-medium tabular-nums text-[#272727]">
                    R$ {order.amount.toFixed(2).replace(".", ",")}
                  </td>

                  {/* Data */}
                  <td className="py-3.5 px-3 text-right text-[11px] text-[#9B998F] tabular-nums">
                    {order.date}
                  </td>

                  {/* Situação (Ponto + Rótulo, sem caixa colorida) */}
                  <td className="py-3.5 pl-3 text-right">
                    <span className="inline-flex items-center gap-1.5 justify-end">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}
                      />
                      <span className={`text-xs ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
