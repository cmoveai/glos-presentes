import React from "react";
import { OrderStatus } from "../../types";

export interface StatusBadgeProps {
  status: OrderStatus | string;
  subtext?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, subtext }) => {
  const normalized = (status || "").toUpperCase();

  let bgClass = "bg-stone-100 text-stone-700 border-stone-200";
  let dotClass = "bg-stone-500";
  let label = status;

  if (
    normalized === "ENTREGUE" ||
    normalized === "CONCLUIDO" ||
    normalized === "CONCLUÍDO"
  ) {
    bgClass = "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]";
    dotClass = "bg-[#047857]";
    label = "Concluído";
  } else if (
    normalized === "PAGAMENTO_CONFIRMADO" ||
    normalized === "PAGO" ||
    normalized === "EM_PROCESSAMENTO" ||
    normalized === "PROCESSANDO" ||
    normalized === "ENVIADO"
  ) {
    bgClass = "bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]";
    dotClass = "bg-[#1D4ED8]";
    label = normalized === "ENVIADO" ? "Enviado" : "Em processamento";
  } else if (
    normalized === "PEDIDO_REALIZADO" ||
    normalized === "PENDENTE" ||
    normalized === "AGUARDANDO_PAGAMENTO"
  ) {
    bgClass = "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
    dotClass = "bg-[#B45309]";
    label = "Pendente";
  } else if (
    normalized === "CANCELADO" ||
    normalized === "REJEITADO" ||
    normalized === "ESTORNADO"
  ) {
    bgClass = "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]";
    dotClass = "bg-[#B91C1C]";
    label = "Cancelado";
  }

  return (
    <div className="flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${bgClass}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotClass} mr-1.5`} />
        {label}
      </span>
      {subtext && (
        <span className="text-[10px] text-[#5B6270] font-medium tracking-tight pl-0.5">
          {subtext}
        </span>
      )}
    </div>
  );
};

