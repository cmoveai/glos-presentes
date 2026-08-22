import React, { useState } from "react";
import {
  Store,
  Truck,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Instagram,
  ShieldCheck,
  Save,
  RefreshCw,
  Clock,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertCircle,
  QrCode,
  MapPin,
  Megaphone,
  Zap,
} from "lucide-react";
import { StoreOperationsSettings } from "../../types";
import { saveAdminStoreOperationsSettings } from "../../services/api";
import { useToast } from "../../context/ToastContext";

interface StoreOperationsManagerProps {
  settings: StoreOperationsSettings;
  onSettingsUpdated: (updated: StoreOperationsSettings) => void;
  activeSection?: "identity" | "shipping" | "payment" | "announcement" | "database";
  onSectionChange?: (section: "identity" | "shipping" | "payment" | "announcement" | "database") => void;
}

export const StoreOperationsManager: React.FC<StoreOperationsManagerProps> = ({
  settings,
  onSettingsUpdated,
  activeSection: propActiveSection,
  onSectionChange,
}) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<StoreOperationsSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [localSection, setLocalSection] = useState<"identity" | "shipping" | "payment" | "announcement" | "database">("identity");

  const activeSection = propActiveSection || localSection;
  const setActiveSection = onSectionChange || setLocalSection;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ok = await saveAdminStoreOperationsSettings(form);
      if (ok) {
        onSettingsUpdated(form);
        showToast("Configurações da operação salvas com sucesso!", "success");
      } else {
        showToast("Falha ao gravar configurações no banco de dados.", "error");
      }
    } catch {
      showToast("Erro de comunicação ao salvar parâmetros.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getSectionHeaderInfo = () => {
    switch (activeSection) {
      case "identity":
        return {
          title: "1. Identidade & Contato da Loja",
          subtitle: "Nome da marca, CNPJ, WhatsApp de atendimento, e-mail e endereço institucional.",
          icon: <Building2 className="w-5 h-5 text-amber-600" />,
        };
      case "shipping":
        return {
          title: "2. Frete & Regras de Logística",
          subtitle: "CEP de origem, regras de frete grátis por valor mínimo e prazos operacionais.",
          icon: <Truck className="w-5 h-5 text-amber-600" />,
        };
      case "payment":
        return {
          title: "3. Pagamento, PIX & Mercado Pago",
          subtitle: "Chave PIX da loja, credenciais de produção do Mercado Pago e desconto à vista.",
          icon: <CreditCard className="w-5 h-5 text-amber-600" />,
        };
      case "announcement":
        return {
          title: "4. Barra de Avisos & Políticas da Loja",
          subtitle: "Faixa de destaque no topo do site e termos de privacidade, envio e devoluções.",
          icon: <Megaphone className="w-5 h-5 text-amber-600" />,
        };
      case "database":
        return {
          title: "5. Status do Banco de Dados Firestore",
          subtitle: "Monitoramento das coleções em nuvem, sincronização em tempo real e integridade.",
          icon: <ShieldCheck className="w-5 h-5 text-amber-600" />,
        };
      default:
        return {
          title: "Configurações da Operação",
          subtitle: "Gerencie parâmetros de envio, pagamentos e dados da marca.",
          icon: <Store className="w-5 h-5 text-amber-600" />,
        };
    }
  };

  const headerInfo = getSectionHeaderInfo();

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
              {headerInfo.icon}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-stone-950 flex items-center gap-2">
                <span>{headerInfo.title}</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5 max-w-2xl">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-colors shrink-0"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Save className="w-4 h-4 text-amber-400" />
            )}
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* FORM BODY */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* SECTION 1: IDENTIDADE & CONTATO */}
        {/* ========================================================================= */}
        {activeSection === "identity" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Dados da Marca & Contato com o Cliente</span>
              </h3>
              <p className="text-xs text-stone-500">
                Essas informações alimentam o topo do site, rodapé, mensagens de suporte e comprovantes de pedido.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-800 mb-1">
                  Nome Oficial da Loja / Marca *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: NOME DA MARCA"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-semibold text-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Nome Curto (Abreviado)
                </label>
                <input
                  type="text"
                  value={form.shortName}
                  onChange={(e) => setForm({ ...form, shortName: e.target.value })}
                  placeholder="Ex: MARCA"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-stone-800 mb-1">
                  Slogan / Tagline da Loja
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Ex: Presentes e objetos de design que transformam o dia a dia"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-bold text-stone-800 mb-1">
                  Descrição Institucional (Apresentação no Rodapé)
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Curadoria autoral de presentes criativos..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  WhatsApp (Apenas números com DDI + DDD) *
                </label>
                <input
                  type="text"
                  required
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value.replace(/\D/g, "") })}
                  placeholder="Ex: 5511999999999"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-mono"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Ex: 5511999999999 (usado no botão flutuante de WhatsApp)</span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  WhatsApp Visual (Exibição Formatada)
                </label>
                <input
                  type="text"
                  value={form.whatsappDisplay}
                  onChange={(e) => setForm({ ...form, whatsappDisplay: e.target.value })}
                  placeholder="Ex: (11) 99999-9999"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  E-mail Oficial do SAC / Atendimento *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@nomedamarca.com.br"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Telefone Comercial / SAC
                </label>
                <input
                  type="text"
                  value={form.phoneDisplay}
                  onChange={(e) => setForm({ ...form, phoneDisplay: e.target.value })}
                  placeholder="Ex: (11) 4002-8922"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Instagram Oficial da Loja
                </label>
                <input
                  type="text"
                  value={form.instagramHandle}
                  onChange={(e) => setForm({ ...form, instagramHandle: e.target.value })}
                  placeholder="Ex: @nomedamarca"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  CNPJ da Loja
                </label>
                <input
                  type="text"
                  value={form.cnpj}
                  onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                  placeholder="00.000.000/0001-00"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-800 mb-1">
                  Endereço da Sede / Centro de Distribuição
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Horário de Atendimento
                </label>
                <input
                  type="text"
                  value={form.openingHours}
                  onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                  placeholder="Seg a Sex: 09h às 18h | Sáb: 09h às 13h"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 2: FRETE & LOGÍSTICA */}
        {/* ========================================================================= */}
        {activeSection === "shipping" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>Regras de Frete, Envio e Distribuição</span>
              </h3>
              <p className="text-xs text-stone-500">
                Configure a regra de frete grátis automática, CEP de saída das mercadorias e prazos de postagem.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Frete Grátis Automático</span>
                  </span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-md uppercase">
                    Ativo em todo o Brasil
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-emerald-900 mb-1">
                    Valor Mínimo do Carrinho para Frete Grátis (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-emerald-700 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={form.freeShippingThreshold}
                      onChange={(e) => setForm({ ...form, freeShippingThreshold: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-emerald-300 rounded-xl focus:border-emerald-700 focus:outline-none font-bold text-stone-950 text-sm"
                    />
                  </div>
                  <span className="text-[11px] text-emerald-800 mt-1 block">
                    Pedidos que atingirem ou ultrapassarem esse subtotal recebem a opção <strong>Frete Grátis</strong> no cálculo automático.
                  </span>
                </div>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                <span className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-stone-700" />
                  <span>Origem & Expedição</span>
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      CEP de Origem (Saída dos Pedidos)
                    </label>
                    <input
                      type="text"
                      value={form.originCep}
                      onChange={(e) => setForm({ ...form, originCep: e.target.value })}
                      placeholder="01310-100"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Prazo Adicional de Manuseio / Expedição (Dias Úteis)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={form.handlingDays}
                      onChange={(e) => setForm({ ...form, handlingDays: parseInt(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-bold"
                    />
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      Somado ao prazo estimado das transportadoras (Correios / Jadlog / Loggi).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 3: PAGAMENTO & PIX */}
        {/* ========================================================================= */}
        {activeSection === "payment" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Gateways de Pagamento, PIX e Parcelamento</span>
              </h3>
              <p className="text-xs text-stone-500">
                Controle o desconto do PIX, chaves bancárias e parâmetros do Mercado Pago.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* PIX CONFIGURATION */}
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-stone-950 font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
                    PIX
                  </div>
                  <span>Configurações do Pagamento PIX</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Desconto para Pagamento via PIX (%) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="1"
                        value={form.pixDiscountPercentage}
                        onChange={(e) => setForm({ ...form, pixDiscountPercentage: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-bold text-sm"
                      />
                      <span className="absolute right-3 top-2.5 font-bold text-stone-600">% OFF</span>
                    </div>
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      Aplicado automaticamente na finalização de compra quando o cliente seleciona PIX.
                    </span>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Chave PIX da Empresa (Para Transferência/QR Direto)
                    </label>
                    <input
                      type="text"
                      value={form.pixKey}
                      onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                      placeholder="CNPJ, E-mail, Celular ou Chave Aleatória"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        Titular / Razão Social
                      </label>
                      <input
                        type="text"
                        value={form.pixReceiverName}
                        onChange={(e) => setForm({ ...form, pixReceiverName: e.target.value })}
                        placeholder="Nome do Titular"
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        Banco / Instituição
                      </label>
                      <input
                        type="text"
                        value={form.pixBankName}
                        onChange={(e) => setForm({ ...form, pixBankName: e.target.value })}
                        placeholder="Ex: Banco Inter / Nubank"
                        className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* MERCADO PAGO & CARTÃO */}
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-stone-950 font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    MP
                  </div>
                  <span>Mercado Pago & Parcelamento</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Parcelamento Máximo Sem Juros (Cartão de Crédito)
                    </label>
                    <select
                      value={form.maxInstallmentsWithoutInterest}
                      onChange={(e) => setForm({ ...form, maxInstallmentsWithoutInterest: parseInt(e.target.value) || 1 })}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-bold"
                    >
                      <option value="1">1x à vista</option>
                      <option value="2">Até 2x sem juros</option>
                      <option value="3">Até 3x sem juros</option>
                      <option value="4">Até 4x sem juros</option>
                      <option value="6">Até 6x sem juros</option>
                      <option value="10">Até 10x sem juros</option>
                      <option value="12">Até 12x sem juros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Ambiente de Operação do Mercado Pago
                    </label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mpMode"
                          value="production"
                          checked={form.mercadoPagoMode === "production"}
                          onChange={() => setForm({ ...form, mercadoPagoMode: "production" })}
                          className="accent-stone-950"
                        />
                        <span className="font-bold text-emerald-700">Produção (Vendas Reais)</span>
                      </label>

                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mpMode"
                          value="sandbox"
                          checked={form.mercadoPagoMode === "sandbox"}
                          onChange={() => setForm({ ...form, mercadoPagoMode: "sandbox" })}
                          className="accent-stone-950"
                        />
                        <span className="font-bold text-amber-700">Sandbox (Ambiente de Testes)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Chave Pública (Public Key do Mercado Pago)
                    </label>
                    <input
                      type="text"
                      value={form.mercadoPagoPublicKey || ""}
                      onChange={(e) => setForm({ ...form, mercadoPagoPublicKey: e.target.value })}
                      placeholder="APP_USR-xxxx-xxxx-xxxx ou TEST-xxxx-xxxx"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-mono text-xs"
                    />
                    <span className="text-[10px] text-stone-500 mt-1 block">
                      A chave secreta de servidor (Access Token) permanece protegida nas variáveis de ambiente seguras.
                    </span>
                  </div>

                  {/* Interactive Diagnostic / Test Connection Button */}
                  <div className="pt-2 border-t border-stone-200">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/mercadopago/test-connection");
                          const data = await res.json();
                          if (data.success) {
                            alert(`✅ CONEXÃO APROVADA!\n\n${data.message}\nModo: ${data.mode.toUpperCase()}\nToken: ${data.maskedToken}`);
                          } else {
                            alert(`⚠️ AVISO: ${data.message || data.error}\n\nSe já adicionou a chave em Settings > Secrets, reinicie o servidor para carregar.`);
                          }
                        } catch (err: any) {
                          alert(`Erro ao testar conexão: ${err.message}`);
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Zap className="w-4 h-4 text-amber-400" />
                      Testar Conexão Live com Mercado Pago
                    </button>
                    <p className="text-[10px] text-stone-500 mt-1.5">
                      Gera uma requisição de autenticação em tempo real para validar se o servidor aceitou suas credenciais.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 4: BARRA DE AVISOS & POLÍTICAS */}
        {/* ========================================================================= */}
        {activeSection === "announcement" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-600" />
                <span>Barra de Avisos do Topo & Políticas Comerciais</span>
              </h3>
              <p className="text-xs text-stone-500">
                Personalize o banner fixo no topo da loja e prazos oficiais de troca e garantia.
              </p>
            </div>

            <div className="space-y-5 text-xs">
              {/* TOP ANNOUNCEMENT BAR */}
              <div className="p-5 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900 text-sm">
                    Barra de Destaques / Avisos no Topo da Loja
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.announcementBarEnabled}
                      onChange={(e) => setForm({ ...form, announcementBarEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-950"></div>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Texto do Anúncio do Topo
                  </label>
                  <input
                    type="text"
                    value={form.announcementBarText}
                    onChange={(e) => setForm({ ...form, announcementBarText: e.target.value })}
                    placeholder="Ex: Frete Grátis para todo o Brasil acima de R$ 249 | 5% OFF no PIX"
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-semibold text-stone-900"
                  />
                </div>

                {/* PREVIEW BAR */}
                {form.announcementBarEnabled && (
                  <div className="pt-2">
                    <span className="text-[11px] text-stone-500 font-semibold block mb-1">Prévia da Barra:</span>
                    <div className="bg-stone-950 text-white text-[11px] font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-center shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{form.announcementBarText || "Frete Grátis para todo o Brasil"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* POLICIES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                  <label className="block font-bold text-stone-800">
                    Prazo Oficial para Trocas e Devoluções (Dias Corridos)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="90"
                    value={form.returnPolicyDays}
                    onChange={(e) => setForm({ ...form, returnPolicyDays: parseInt(e.target.value) || 30 })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-stone-500 block">
                    Padrão do e-commerce: 30 dias após o recebimento.
                  </span>
                </div>

                <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                  <label className="block font-bold text-stone-800">
                    Prazo de Garantia contra Defeitos (Dias Corridos)
                  </label>
                  <input
                    type="number"
                    min="30"
                    max="365"
                    value={form.warrantyDays}
                    onChange={(e) => setForm({ ...form, warrantyDays: parseInt(e.target.value) || 90 })}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none font-bold"
                  />
                  <span className="text-[10px] text-stone-500 block">
                    Garantia legal do Código de Defesa do Consumidor: 90 dias.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SECTION 5: STATUS DO FIRESTORE */}
        {/* ========================================================================= */}
        {activeSection === "database" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-2xs space-y-6">
            <div className="border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Status da Conexão com o Firebase Firestore</span>
              </h3>
              <p className="text-xs text-stone-500">
                Monitoramento das coleções persistentes e sincronização de dados da plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-950">Banco de Dados em Nuvem Ativo</span>
                </div>
                <p className="text-emerald-800 text-[11px] leading-relaxed">
                  Todas as operações de produtos, pedidos, cupons de desconto, banners da hero, categorias e configurações estão sincronizadas em tempo real com o Firestore.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <span className="font-bold text-stone-900 block">Coleções Ativas no Projeto:</span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-stone-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>products</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>orders</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>coupons</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>categories</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>collections</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>hero_banners</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>editorial_banners</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>store_settings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM SAVE ACTION BAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <Save className="w-4 h-4 text-amber-400" />
            )}
            <span>Salvar Todas as Configurações da Loja</span>
          </button>
        </div>
      </form>
    </div>
  );
};
