import React, { useState } from "react";
import { ShieldCheck, Server, Key, Lock, CheckCircle2 } from "lucide-react";

export interface FiscalConfig {
  regime: "simples_nacional" | "lucro_presumido" | "mei";
  stateRegistration: string; // Inscrição Estadual
  environment: "homologacao" | "producao";
  series: number;
  lastNfeNumber: number;
  emissorProvider: "spedy" | "nfe_io" | "plugnotas" | "focus_nfe";
  hasCertificateA1: boolean;
}

export interface FiscalConfigFormProps {
  onSave?: (config: FiscalConfig) => void;
  onShowNotification?: (type: "success" | "error", message: string) => void;
}

export const FiscalConfigForm: React.FC<FiscalConfigFormProps> = ({
  onSave,
  onShowNotification,
}) => {
  const [config, setConfig] = useState<FiscalConfig>({
    regime: "simples_nacional",
    stateRegistration: "123.456.789.110",
    environment: "producao",
    series: 1,
    lastNfeNumber: 1042,
    emissorProvider: "focus_nfe",
    hasCertificateA1: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(config);
    onShowNotification?.("success", "Configurações fiscais da NF-e salvas com sucesso!");
  };

  return (
    <form onSubmit={handleSave} className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-5 sm:p-6 shadow-xs space-y-5 text-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF1]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2E5BFF]" />
          <h3 className="text-sm font-bold text-[#1A1F27]">
            Configurações do Emissor de NF-e (Modelo 55)
          </h3>
        </div>
        <span className="text-[11px] text-[#047857] font-semibold bg-[#D1FAE5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
          ● Emissor Ativo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Regime Tributário */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#1A1F27]">Regime Tributário</label>
          <select
            value={config.regime}
            onChange={(e) => setConfig({ ...config, regime: e.target.value as any })}
            className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] focus:border-[#2E5BFF] focus:outline-hidden"
          >
            <option value="simples_nacional">Simples Nacional (Padrão)</option>
            <option value="mei">MEI (Microempreendedor)</option>
            <option value="lucro_presumido">Lucro Presumido</option>
          </select>
        </div>

        {/* Inscrição Estadual */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#1A1F27]">Inscrição Estadual (IE)</label>
          <input
            type="text"
            value={config.stateRegistration}
            onChange={(e) => setConfig({ ...config, stateRegistration: e.target.value })}
            className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-mono focus:border-[#2E5BFF] focus:outline-hidden"
          />
        </div>

        {/* Provedor de Emissão API */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#1A1F27]">Emissor Integrado via API</label>
          <select
            value={config.emissorProvider}
            onChange={(e) => setConfig({ ...config, emissorProvider: e.target.value as any })}
            className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] focus:border-[#2E5BFF] focus:outline-hidden"
          >
            <option value="focus_nfe">Focus NF-e (Reforma Tributária Ready)</option>
            <option value="plugnotas">PlugNotas / TecnoSpeed</option>
            <option value="nfe_io">NFE.io</option>
            <option value="spedy">Spedy</option>
          </select>
        </div>

        {/* Ambiente SEFAZ */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#1A1F27]">Ambiente SEFAZ</label>
          <select
            value={config.environment}
            onChange={(e) => setConfig({ ...config, environment: e.target.value as any })}
            className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] focus:border-[#2E5BFF] focus:outline-hidden"
          >
            <option value="producao">Produção (Validade Jurídica)</option>
            <option value="homologacao">Homologação (Testes SEFAZ)</option>
          </select>
        </div>

        {/* Série e Numeração */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#1A1F27]">Série da NF-e</label>
          <input
            type="number"
            value={config.series}
            onChange={(e) => setConfig({ ...config, series: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-mono focus:border-[#2E5BFF] focus:outline-hidden"
          />
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-[#1A1F27]">Último Número Emitido</label>
          <input
            type="number"
            value={config.lastNfeNumber}
            onChange={(e) => setConfig({ ...config, lastNfeNumber: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] font-mono focus:border-[#2E5BFF] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Bloco Certificado Digital A1 */}
      <div className="p-3.5 rounded-lg bg-[#F1F3F6] border border-[#E3E5E9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Key className="w-4 h-4 text-[#2E5BFF]" />
          <div>
            <span className="font-bold text-[#1A1F27] block">Certificado Digital A1 (.pfx)</span>
            <span className="text-[11px] text-[#5B6270]">
              Segurança garantida: armazenado exclusivamente nas variáveis de ambiente do servidor.
            </span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#047857] bg-[#D1FAE5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Certificado A1 Válido até 12/2026</span>
        </span>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-[#2E5BFF] hover:bg-[#1E45D6] text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Salvar Parâmetros Fiscais</span>
        </button>
      </div>
    </form>
  );
};
