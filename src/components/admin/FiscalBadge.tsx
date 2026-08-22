import React from "react";
import { FileCheck, FileClock, FileX, AlertCircle } from "lucide-react";

export type NFeStatus = "EMITIDA" | "PENDENTE" | "ERRO" | "CANCELADA" | "NAO_APLICAVEL";

export interface FiscalBadgeProps {
  status?: NFeStatus | string;
  nfeNumber?: string;
  danfeUrl?: string;
  xmlUrl?: string;
  onClick?: () => void;
}

export const FiscalBadge: React.FC<FiscalBadgeProps> = ({
  status = "PENDENTE",
  nfeNumber,
  danfeUrl,
  onClick,
}) => {
  const norm = (status || "").toUpperCase();

  if (norm === "EMITIDA" || norm === "AUTORIZADA") {
    return (
      <div className="flex items-center gap-1.5">
        <span
          onClick={onClick}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] cursor-pointer hover:bg-[#A7F3D0]/60 transition-colors"
          title="NF-e Autorizada pela SEFAZ"
        >
          <FileCheck className="w-3 h-3" />
          <span>NF-e {nfeNumber ? `#${nfeNumber}` : "Emitida"}</span>
        </span>
        {danfeUrl && (
          <a
            href={danfeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#2E5BFF] hover:underline font-semibold"
            title="Baixar DANFE (PDF)"
          >
            DANFE
          </a>
        )}
      </div>
    );
  }

  if (norm === "ERRO" || norm === "REJEITADA") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] hover:bg-[#FECACA] transition-colors cursor-pointer"
        title="Erro na emissão da NF-e. Clique para ver detalhes e reemitir."
      >
        <AlertCircle className="w-3 h-3" />
        <span>NF-e Erro</span>
      </button>
    );
  }

  if (norm === "CANCELADA") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-stone-100 text-[#5B6270] border border-stone-200">
        <FileX className="w-3 h-3" />
        <span>NF-e Cancelada</span>
      </span>
    );
  }

  // PENDENTE
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] hover:bg-[#FDE68A] transition-colors cursor-pointer"
      title="NF-e pendente de emissão"
    >
      <FileClock className="w-3 h-3" />
      <span>NF-e Pendente</span>
    </button>
  );
};
