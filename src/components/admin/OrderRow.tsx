import React from "react";
import { Order, OrderStatus } from "../../types";
import { StatusBadge } from "./StatusBadge";
import { FiscalBadge } from "./FiscalBadge";
import { OrderActions } from "./OrderActions";
import { Gift } from "lucide-react";

export interface OrderRowProps {
  order: Order;
  onPrintLabel?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
  onManageDispatch?: (orderId?: string) => void;
  onEmitNFe?: (orderId: string) => void;
  onViewDetails?: (order: Order) => void;
  onUpdateStatus?: (status: OrderStatus) => void;
  onShowNotification?: (type: string, msg: string) => void;
}

export const OrderRow: React.FC<OrderRowProps> = ({
  order,
  onPrintLabel,
  onCancelOrder,
  onManageDispatch,
  onEmitNFe,
  onViewDetails,
}) => {
  const isCancellable =
    order.status === "PEDIDO_REALIZADO" ||
    order.status === "PAGAMENTO_CONFIRMADO" ||
    (order.status as string) === "pendente";

  const firstItem = order.items?.[0];
  const otherItemsCount = (order.items?.length || 1) - 1;

  // Format date DD mmm, AA
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(order.createdAt);
      if (isNaN(d.getTime())) return order.createdAt || "Hoje";
      const day = String(d.getDate()).padStart(2, "0");
      const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
      const month = monthNames[d.getMonth()];
      const year = String(d.getFullYear()).slice(-2);
      return `${day} ${month}, ${year}`;
    } catch {
      return "Hoje";
    }
  }, [order.createdAt]);

  const paymentLabel = React.useMemo(() => {
    if (order.paymentMethod === "pix" || order.paymentMethod === "PIX") return "Pix (Mercado Pago)";
    if (order.paymentMethod === "credit_card" || order.paymentMethod === "cartao") return "Cartão de Crédito";
    if (order.paymentMethod === "boleto") return "Boleto";
    return order.paymentMethod || "Cartão";
  }, [order.paymentMethod]);

  const customerName = order.customer?.name || "Cliente da Loja";
  const customerCpf = order.customer?.cpf ? `CPF: ${order.customer.cpf}` : "";

  // Simulação de status fiscal
  const fiscalStatus = (order as any).fiscalStatus || (order.status === "PAGAMENTO_CONFIRMADO" || order.status === "ENTREGUE" || (order.status as string) === "pago" ? "EMITIDA" : "PENDENTE");
  const nfeNumber = (order as any).nfeNumber || (fiscalStatus === "EMITIDA" ? String(order.id.replace(/\D/g, "").slice(-4) || "1042") : undefined);

  return (
    <div
      id={`order-row-${order.id}`}
      className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E3E5E9] hover:border-[#CBD0D8] transition-all space-y-3 shadow-xs"
    >
      {/* Bloco superior: Identificação do Comprador, CPF, Data e ID */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#ECEEF1] text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[#1A1F27] font-semibold">
            {customerName}
          </span>
          {customerCpf && (
            <>
              <span className="text-[#8A8F98]">•</span>
              <span className="text-[#5B6270] font-mono text-[11px]">{customerCpf}</span>
            </>
          )}
          <span className="text-[#8A8F98]">•</span>
          <span className="text-[#5B6270]">
            Data: <strong className="text-[#1A1F27] font-medium">{formattedDate}</strong>
          </span>
          {order.giftWrap && (
            <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 flex items-center gap-1">
              <Gift className="w-3 h-3" /> Presente
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {order.trackingCode && (
            <span className="font-mono text-[11px] text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded border border-[#A7F3D0]">
              Rastreio: {order.trackingCode}
            </span>
          )}
          <span className="font-mono text-[#5B6270] text-[11px] bg-[#F1F3F6] px-2 py-0.5 rounded border border-[#E3E5E9]">
            ID: #{order.id.slice(-8)}
          </span>
        </div>
      </div>

      {/* Grid das 6 Colunas: Produto · Preço · Pagamento · Situação · Fiscal · Ação */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
        {/* Produto (4 cols) */}
        <div className="md:col-span-4 flex items-center gap-3">
          <img
            src={firstItem?.image || "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&auto=format&fit=crop&q=80"}
            alt={firstItem?.name || "Produto"}
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-lg object-cover border border-[#E3E5E9] shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&auto=format&fit=crop&q=80";
            }}
          />
          <div className="space-y-0.5 truncate">
            <h4
              className="text-xs font-semibold text-[#1A1F27] truncate cursor-pointer hover:text-[#2E5BFF]"
              onClick={() => onViewDetails?.(order)}
              title={firstItem?.name}
            >
              {firstItem?.name || "Item do Pedido"}
            </h4>
            <p className="text-[11px] text-[#5B6270]">
              Qtd: <strong className="text-[#1A1F27] font-semibold">{firstItem?.quantity || 1}</strong>
              {firstItem?.variantName ? ` · ${firstItem.variantName}` : " · Padrão"}
              {otherItemsCount > 0 && (
                <span className="ml-1 text-[#2E5BFF] font-semibold">
                  (+{otherItemsCount} {otherItemsCount === 1 ? "item" : "itens"})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Preço (2 cols) */}
        <div className="md:col-span-2">
          <span className="text-[10px] uppercase font-semibold text-[#8A8F98] block md:hidden">Preço</span>
          <span className="text-sm font-bold text-[#1A1F27] tabular-nums">
            R$ {order.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Pagamento (2 cols) */}
        <div className="md:col-span-2">
          <span className="text-[10px] uppercase font-semibold text-[#8A8F98] block md:hidden">Pagamento</span>
          <span className="text-xs text-[#5B6270] font-medium">
            {paymentLabel}
          </span>
        </div>

        {/* Situação & Prazo (2 cols) */}
        <div className="md:col-span-2">
          <span className="text-[10px] uppercase font-semibold text-[#8A8F98] block md:hidden">Situação</span>
          <StatusBadge
            status={order.status}
            subtext={
              order.status === "PEDIDO_REALIZADO"
                ? "Aguardando pagamento"
                : order.status === "PAGAMENTO_CONFIRMADO"
                ? "Enviar hoje até 17h"
                : undefined
            }
          />
        </div>

        {/* Fiscal (1 col) */}
        <div className="md:col-span-1">
          <span className="text-[10px] uppercase font-semibold text-[#8A8F98] block md:hidden">Fiscal</span>
          <FiscalBadge
            status={fiscalStatus}
            nfeNumber={nfeNumber}
            danfeUrl={fiscalStatus === "EMITIDA" ? "#" : undefined}
            onClick={() => onEmitNFe?.(order.id)}
          />
        </div>

        {/* Ação (1 col / justify end) */}
        <div className="md:col-span-1 flex justify-start md:justify-end">
          <OrderActions
            orderId={order.id}
            isCancellable={isCancellable}
            onPrintLabel={() => {
              if (onPrintLabel) onPrintLabel(order.id);
              else window.print();
            }}
            onManageDispatch={() => onManageDispatch?.(order.id)}
            onEmitNFe={() => onEmitNFe?.(order.id)}
            onCancelOrder={() => onCancelOrder?.(order.id)}
          />
        </div>
      </div>

      {/* Cartão de Mensagem de Presente se houver */}
      {order.giftCardMessage && (
        <div className="pt-2 border-t border-[#ECEEF1] text-[11px] text-[#5B6270] flex items-center gap-1.5 bg-[#FAF9F5] p-2 rounded-md">
          <Gift className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Mensagem do cartão: <em>"{order.giftCardMessage}"</em></span>
        </div>
      )}
    </div>
  );
};
