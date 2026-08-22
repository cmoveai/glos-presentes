import React from "react";
import { FileCheck, FileClock, AlertCircle, FileX, Download, RefreshCw, XCircle } from "lucide-react";
import { FiscalBadge, NFeStatus } from "./FiscalBadge";

export interface NFeItem {
  id: string;
  orderId: string;
  nfeNumber: string;
  series: string;
  customerName: string;
  customerCpf: string;
  total: number;
  status: NFeStatus;
  issuedAt: string;
  danfeUrl?: string;
  xmlUrl?: string;
  errorMessage?: string;
}

export interface NFeRowProps {
  nfe: NFeItem;
  onEmitOrRetry: (nfeId: string) => void;
  onCancelNFe?: (nfeId: string) => void;
  onDownloadXml?: (nfeId: string) => void;
  onDownloadDanfe?: (nfeId: string) => void;
}

export const NFeRow: React.FC<NFeRowProps> = ({
  nfe,
  onEmitOrRetry,
  onCancelNFe,
  onDownloadDanfe,
  onDownloadXml,
}) => {
  return (
    <div className="p-4 rounded-lg bg-[#FFFFFF] border border-[#E3E5E9] hover:border-[#CBD0D8] transition-all grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs shadow-xs">
      {/* Dados da NF-e & Pedido */}
      <div className="md:col-span-3 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1A1F27] font-mono">
            {nfe.nfeNumber ? `NF-e #${nfe.nfeNumber}` : "Pendente"}
          </span>
          <span className="text-[10px] text-[#8A8F98]">Série {nfe.series || "1"}</span>
        </div>
        <div className="text-[11px] text-[#5B6270]">
          Pedido: <strong className="text-[#1A1F27] font-mono">#{nfe.orderId.slice(-8)}</strong>
        </div>
      </div>

      {/* Destinatário */}
      <div className="md:col-span-3 space-y-0.5">
        <div className="font-semibold text-[#1A1F27] truncate">{nfe.customerName}</div>
        <div className="text-[11px] text-[#8A8F98] font-mono">{nfe.customerCpf}</div>
      </div>

      {/* Valor & Data */}
      <div className="md:col-span-2 space-y-0.5">
        <div className="font-bold text-[#1A1F27] tabular-nums">
          R$ {nfe.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>
        <div className="text-[10px] text-[#8A8F98]">{nfe.issuedAt}</div>
      </div>

      {/* Situação Fiscal */}
      <div className="md:col-span-2">
        <FiscalBadge
          status={nfe.status}
          nfeNumber={nfe.nfeNumber}
          danfeUrl={nfe.danfeUrl}
        />
        {nfe.errorMessage && (
          <p className="text-[10px] text-[#B91C1C] mt-1 truncate" title={nfe.errorMessage}>
            {nfe.errorMessage}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="md:col-span-2 flex items-center justify-start md:justify-end gap-1.5">
        {nfe.status === "EMITIDA" ? (
          <>
            <button
              type="button"
              onClick={() => onDownloadDanfe?.(nfe.id)}
              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-[#1A1F27] rounded text-[11px] font-semibold flex items-center gap-1 border border-stone-200 cursor-pointer"
              title="Baixar DANFE em PDF"
            >
              <Download className="w-3 h-3" />
              <span>DANFE</span>
            </button>
            <button
              type="button"
              onClick={() => onDownloadXml?.(nfe.id)}
              className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-[#5B6270] rounded text-[11px] font-medium flex items-center gap-1 border border-stone-200 cursor-pointer"
              title="Baixar XML da NF-e"
            >
              <span>XML</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => onEmitOrRetry(nfe.id)}
            className="px-2.5 py-1 bg-[#2E5BFF] hover:bg-[#1E45D6] text-white rounded text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Emitir SEFAZ</span>
          </button>
        )}
      </div>
    </div>
  );
};
