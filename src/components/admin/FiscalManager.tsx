import React, { useState } from "react";
import { Order } from "../../types";
import { NFeRow, NFeItem } from "./NFeRow";
import { FiscalConfigForm } from "./FiscalConfigForm";
import { InsightBanner } from "./InsightBanner";
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  Download,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from "lucide-react";

export interface FiscalManagerProps {
  orders: Order[];
  onShowNotification?: (type: "success" | "error", message: string) => void;
}

export const FiscalManager: React.FC<FiscalManagerProps> = ({
  orders,
  onShowNotification,
}) => {
  const [activeTab, setActiveTab] = useState<"notas" | "config">("notas");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Mock de notas fiscais coerente com pedidos da loja
  const [nfeList, setNfeList] = useState<NFeItem[]>([
    {
      id: "nfe-1",
      orderId: "ord-98214",
      nfeNumber: "1042",
      series: "1",
      customerName: "Camila Guimarães Rocha",
      customerCpf: "248.910.334-01",
      total: 379.8,
      status: "EMITIDA",
      issuedAt: "22 ago, 26 • 10:14",
      danfeUrl: "#",
      xmlUrl: "#",
    },
    {
      id: "nfe-2",
      orderId: "ord-98212",
      nfeNumber: "1041",
      series: "1",
      customerName: "Lucas Mendonça Ferreira",
      customerCpf: "109.822.450-88",
      total: 189.0,
      status: "EMITIDA",
      issuedAt: "22 ago, 26 • 09:30",
      danfeUrl: "#",
      xmlUrl: "#",
    },
    {
      id: "nfe-3",
      orderId: "ord-98209",
      nfeNumber: "",
      series: "1",
      customerName: "Mariana Albuquerque Prado",
      customerCpf: "340.551.789-22",
      total: 249.9,
      status: "PENDENTE",
      issuedAt: "22 ago, 26 • 08:45",
    },
    {
      id: "nfe-4",
      orderId: "ord-98195",
      nfeNumber: "",
      series: "1",
      customerName: "Rodrigo Vasconcelos",
      customerCpf: "098.223.114-55",
      total: 412.0,
      status: "ERRO",
      issuedAt: "21 ago, 26 • 18:20",
      errorMessage: "Rejeição 204: Duplicidade de NF-e no banco SEFAZ",
    },
    {
      id: "nfe-5",
      orderId: "ord-98180",
      nfeNumber: "1039",
      series: "1",
      customerName: "Beatriz Silveira Lima",
      customerCpf: "455.901.233-10",
      total: 129.0,
      status: "EMITIDA",
      issuedAt: "21 ago, 26 • 14:10",
      danfeUrl: "#",
      xmlUrl: "#",
    },
  ]);

  const handleEmitOrRetry = (nfeId: string) => {
    setNfeList((prev) =>
      prev.map((item) => {
        if (item.id === nfeId) {
          const nextNumber = String(1043 + Math.floor(Math.random() * 20));
          return {
            ...item,
            status: "EMITIDA",
            nfeNumber: nextNumber,
            errorMessage: undefined,
            danfeUrl: "#",
            xmlUrl: "#",
          };
        }
        return item;
      })
    );
    onShowNotification?.("success", "NF-e autorizada com sucesso pela SEFAZ!");
  };

  const filteredNfe = nfeList.filter((nfe) => {
    const matchesSearch =
      nfe.customerName.toLowerCase().includes(search.toLowerCase()) ||
      nfe.customerCpf.includes(search) ||
      nfe.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (nfe.nfeNumber && nfe.nfeNumber.includes(search));

    const matchesStatus =
      statusFilter === "ALL" || nfe.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = nfeList.filter((n) => n.status === "PENDENTE" || n.status === "ERRO").length;

  return (
    <div id="fiscal-manager-root" className="space-y-6">
      {/* Faixa de Insight IA */}
      <InsightBanner
        title="IA Fiscal: Automação SEFAZ & Emissão Obrigatória"
        insight={`${pendingCount > 0 ? `Você possui ${pendingCount} pedido(s) aguardando emissão ou correção de NF-e.` : "Todas as notas fiscais dos pedidos pagos estão devidamente emitidas e autorizadas."} O Mercado Pago atua como intermediador financeiro; a emissão do documento fiscal modelo 55 é obrigatória para transporte interestadual.`}
        actionLabel={pendingCount > 0 ? "Emitir Pendentes" : "Ver Parâmetros"}
        onAction={() => {
          if (pendingCount > 0) {
            setStatusFilter("PENDENTE");
          } else {
            setActiveTab("config");
          }
        }}
        badge="SEFAZ Mod. 55"
        type={pendingCount > 0 ? "alert" : "growth"}
      />

      {/* Tabs: Lista de Notas vs. Configurações */}
      <div className="flex items-center gap-2 border-b border-[#ECEEF1] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("notas")}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
            activeTab === "notas"
              ? "bg-[#EDF1FF] text-[#2E5BFF]"
              : "text-[#5B6270] hover:text-[#1A1F27]"
          }`}
        >
          Notas Fiscais Emitidas ({nfeList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("config")}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
            activeTab === "config"
              ? "bg-[#EDF1FF] text-[#2E5BFF]"
              : "text-[#5B6270] hover:text-[#1A1F27]"
          }`}
        >
          Configurações do Emissor & Certificado A1
        </button>
      </div>

      {activeTab === "config" ? (
        <FiscalConfigForm onShowNotification={onShowNotification} />
      ) : (
        <div className="space-y-4">
          {/* Filtros e Busca */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FFFFFF] p-3.5 rounded-lg border border-[#E3E5E9] shadow-xs text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8A8F98] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por cliente, CPF, pedido ou nº da nota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] focus:border-[#2E5BFF] focus:outline-hidden text-xs"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-semibold text-xs focus:border-[#2E5BFF] focus:outline-hidden"
              >
                <option value="ALL">Todos os Status</option>
                <option value="EMITIDA">Emitidas / Autorizadas</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="ERRO">Com Erro / Rejeitadas</option>
              </select>
            </div>
          </div>

          {/* Cabeçalho da Tabela */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-semibold text-[#8A8F98] uppercase">
            <div className="col-span-3">NF-e / Pedido</div>
            <div className="col-span-3">Destinatário & CPF</div>
            <div className="col-span-2">Valor & Data</div>
            <div className="col-span-2">Status SEFAZ</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          {/* Lista de NF-e */}
          <div className="space-y-2.5">
            {filteredNfe.map((nfe) => (
              <NFeRow
                key={nfe.id}
                nfe={nfe}
                onEmitOrRetry={handleEmitOrRetry}
                onDownloadDanfe={() =>
                  onShowNotification?.("success", `Download do DANFE da NF-e #${nfe.nfeNumber} iniciado.`)
                }
                onDownloadXml={() =>
                  onShowNotification?.("success", `Download do XML da NF-e #${nfe.nfeNumber} iniciado.`)
                }
              />
            ))}

            {filteredNfe.length === 0 && (
              <div className="bg-[#FFFFFF] p-12 text-center rounded-lg border border-[#E3E5E9] text-xs text-[#5B6270]">
                Nenhuma nota fiscal encontrada para o filtro selecionado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
