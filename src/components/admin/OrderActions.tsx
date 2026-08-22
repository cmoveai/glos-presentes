import React from "react";
import { Printer, Truck, FileText, XCircle } from "lucide-react";

export interface OrderActionsProps {
  orderId: string;
  isCancellable: boolean;
  onPrintLabel: (orderId: string) => void;
  onManageDispatch?: (orderId: string) => void;
  onEmitNFe?: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export const OrderActions: React.FC<OrderActionsProps> = ({
  orderId,
  isCancellable,
  onPrintLabel,
  onManageDispatch,
  onEmitNFe,
  onCancelOrder,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
      {/* Imprimir Etiqueta */}
      <button
        type="button"
        onClick={() => onPrintLabel(orderId)}
        className="px-2.5 py-1 bg-[#2E5BFF] hover:bg-[#1E45D6] text-white text-xs font-semibold rounded-md transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
        title="Gerar e imprimir etiqueta de frete dos Correios / Melhor Envio"
      >
        <Printer className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Etiqueta</span>
      </button>

      {/* Despacho */}
      {onManageDispatch && (
        <button
          type="button"
          onClick={() => onManageDispatch(orderId)}
          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-[#1A1F27] text-xs font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer border border-stone-200"
          title="Inserir rastreio e atualizar despacho"
        >
          <Truck className="w-3.5 h-3.5 text-[#5B6270]" />
          <span className="hidden sm:inline">Despacho</span>
        </button>
      )}

      {/* Cancelar */}
      {isCancellable && (
        <button
          type="button"
          onClick={() => onCancelOrder(orderId)}
          className="px-2 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 text-[#B91C1C] hover:bg-[#FEE2E2] cursor-pointer"
          title="Cancelar pedido"
        >
          <XCircle className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
