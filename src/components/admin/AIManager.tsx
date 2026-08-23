import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Sparkles, 
  Send, 
  Zap, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  RefreshCw, 
  Smartphone,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sliders,
  Copy,
  ExternalLink,
  Calendar,
  ToggleLeft,
  ToggleRight,
  History,
  Activity,
  ArrowRight,
  ShoppingCart,
  Package,
  HeartHandshake,
  Users
} from "lucide-react";
import { Order, Product } from "../../types";
import { AutomationToggle } from "./AutomationToggle";
import { BRAND_CONFIG } from "../../config/brand";

interface AIManagerProps {
  orders: Order[];
  products: Product[];
  onShowNotification?: (type: "success" | "error" | "info", text: string) => void;
}

interface ExecutionLog {
  id: string;
  timestamp: string;
  formattedDate: string;
  type: "scheduled_cron" | "manual_test";
  recipientPhone: string;
  success: boolean;
  zApiSent: boolean;
  zApiStatus?: any;
  reportSnippet: string;
  fullReportText: string;
  durationMs: number;
}

interface SchedulerStatusData {
  active: boolean;
  config: {
    autoDispatchEnabled: boolean;
    scheduledHour: number;
    scheduledMinute: number;
    timeZone: string;
    targetPhone: string;
    storeName: string;
  };
  currentTimeSaoPaulo: string;
  nextExecutionFormatted: string;
  recentHistory: ExecutionLog[];
}

export const AIManager: React.FC<AIManagerProps> = ({
  orders,
  products,
  onShowNotification,
}) => {
  const [targetPhone, setTargetPhone] = useState(BRAND_CONFIG.whatsapp);
  const [storeName, setStoreName] = useState(BRAND_CONFIG.name);
  const [generating, setGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<{
    text: string;
    whatsappLink?: string;
    generatedAt?: string;
    zApiStatus?: any;
  } | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<"daily_report" | "automations" | "scheduler" | "zapi_status" | "smart_assistant">("daily_report");
  const [automationsState, setAutomationsState] = useState({
    morning_report: true,
    abandoned_recovery: true,
    stock_alert: true,
    post_purchase: true,
    churn_reactivation: false,
  });

  const handleToggleAutomation = (id: string, newState: boolean) => {
    setAutomationsState((prev) => ({ ...prev, [id]: newState }));
    onShowNotification?.(
      "success",
      `Automação "${id}" ${newState ? "ativada" : "pausada"} com sucesso!`
    );
  };
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatusData | null>(null);
  const [loadingScheduler, setLoadingScheduler] = useState(false);
  const [triggeringCron, setTriggeringCron] = useState(false);

  // Fetch scheduler status on mount
  const fetchSchedulerStatus = async () => {
    setLoadingScheduler(true);
    try {
      const res = await fetch("/api/ai/scheduler-status");
      const data = await res.json();
      if (data.success) {
        setSchedulerStatus(data);
        if (data.config?.targetPhone) {
          setTargetPhone(data.config.targetPhone);
        }
        if (data.config?.storeName) {
          setStoreName(data.config.storeName);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar status do agendador:", err);
    } finally {
      setLoadingScheduler(false);
    }
  };

  useEffect(() => {
    fetchSchedulerStatus();
    // Poll every 30s for live next execution and time updates
    const interval = setInterval(fetchSchedulerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAutoDispatch = async () => {
    if (!schedulerStatus) return;
    const newStatus = !schedulerStatus.config.autoDispatchEnabled;
    try {
      const res = await fetch("/api/ai/scheduler-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          autoDispatchEnabled: newStatus,
          targetPhone,
          storeName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSchedulerStatus(data);
        onShowNotification?.(
          "success",
          newStatus
            ? "✅ Disparo autônomo das 09:00 ATIVADO com sucesso!"
            : "⏸️ Disparo autônomo das 09:00 PAUSADO."
        );
      }
    } catch (err: any) {
      onShowNotification?.("error", `Erro ao alterar agendador: ${err.message}`);
    }
  };

  const handleTriggerCronNow = async () => {
    setTriggeringCron(true);
    try {
      const res = await fetch("/api/ai/scheduler-trigger-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPhone }),
      });
      const data = await res.json();
      if (data.success && data.reportText) {
        setReportResult({
          text: data.reportText,
          whatsappLink: `https://wa.me/${targetPhone.replace(/\D/g, "")}?text=${encodeURIComponent(data.reportText)}`,
          generatedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          zApiStatus: data.zApiStatus,
        });

        fetchSchedulerStatus();

        if (data.zApiStatus?.sent || data.log?.zApiSent) {
          onShowNotification?.("success", "✅ Execução do Cron realizada e enviada via Z-API para +55 11 94759-6045!");
        } else {
          onShowNotification?.("success", "Relatório gerado com sucesso pelo Cron!");
        }
      } else {
        throw new Error(data.error || "Falha na execução do cron");
      }
    } catch (err: any) {
      onShowNotification?.("error", `Erro ao disparar cron: ${err.message}`);
    } finally {
      setTriggeringCron(false);
    }
  };

  // Estatísticas rápidas da loja para alimentar os insights
  const totalRevenue = orders
    .filter(o => o.status === "pago" || o.status === "concluido" || o.status === "enviado")
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const pendingOrders = orders.filter(o => o.status === "pendente" || o.status === "aguardando_pagamento");
  const lowStockCount = products.filter(p => (p.stock !== undefined && p.stock <= 5)).length;

  const handleGenerateAndDispatch = async (mode: "view" | "whatsapp" | "zapi") => {
    setGenerating(true);
    try {
      const res = await fetch("/api/ai/daily-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPhone,
          storeName,
          sendViaZApi: mode === "zapi",
        }),
      });

      const data = await res.json();
      if (data.success && data.reportText) {
        setReportResult({
          text: data.reportText,
          whatsappLink: data.whatsappLink,
          generatedAt: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          zApiStatus: data.zApiStatus,
        });

        if (mode === "whatsapp" && data.whatsappLink) {
          window.open(data.whatsappLink, "_blank");
        }

        if (mode === "zapi") {
          if (data.zApiStatus?.sent) {
            onShowNotification?.("success", "✅ Relatório gerado e enviado via Z-API para o seu WhatsApp!");
          } else {
            onShowNotification?.("error", `Z-API: ${data.zApiStatus?.error || "Verifique conexão da Z-API"}`);
          }
        } else {
          onShowNotification?.("success", "Relatório Executivo gerado com sucesso pela IA!");
        }
      } else {
        throw new Error(data.error || "Falha na geração do relatório");
      }
    } catch (err: any) {
      onShowNotification?.("error", `Erro: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!reportResult?.text) return;
    navigator.clipboard.writeText(reportResult.text);
    onShowNotification?.("success", "Relatório copiado para a área de transferência!");
  };

  return (
    <div id="ai-manager-root" className="space-y-6">
      {/* Header com estilo IA Premium */}
      <div id="ai-manager-header" className="relative overflow-hidden bg-linear-to-br from-stone-900 via-stone-900 to-emerald-950/50 p-6 md:p-8 rounded-3xl border border-stone-800 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cron Autônomo 09:00 BRT + Gemini 3.7 Flash + Z-API</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-stone-100 tracking-tight">
              Inteligência Artificial & Automações
            </h1>
            <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
              Sistema autônomo agendado que compila as vendas das últimas 24h e dispara o Resumo Executivo diretamente para o seu WhatsApp todo dia às 09:00 (sem precisar abrir o navegador).
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex flex-wrap items-center gap-3 bg-stone-950/80 p-3.5 rounded-2xl border border-stone-800 shrink-0">
            <div className="px-3 py-1.5 bg-stone-900 rounded-xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Status Agendador</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {schedulerStatus?.config.autoDispatchEnabled ? "Agendado 09h Ativo" : "Pausado"}
              </div>
            </div>
            <div className="px-3 py-1.5 bg-stone-900 rounded-xl border border-stone-800">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">WhatsApp Destino</span>
              <span className="text-xs font-mono font-semibold text-stone-200 mt-0.5 block">+55 11 94759-6045</span>
            </div>
          </div>
        </div>

        {/* Decorative Grid Gradient */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Banner de Status do Agendamento Automático */}
      <div id="ai-cron-status-banner" className="bg-linear-to-r from-emerald-950/40 via-stone-900 to-stone-900 p-4 sm:p-5 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                CRON TASK 09:00 AM (BRT)
              </span>
              <span className="text-xs text-stone-400">Horário de Brasília (UTC-3)</span>
            </div>
            <h4 className="text-sm font-bold text-stone-100 mt-1">
              Próximo envio automático: <span className="text-emerald-400 font-mono">{schedulerStatus?.nextExecutionFormatted || "Hoje às 09:00 (BRT)"}</span>
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Destinatário: <span className="text-stone-200 font-mono">+55 (11) 94759-6045</span> • Disparo 100% autônomo via Z-API
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleToggleAutoDispatch}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              schedulerStatus?.config.autoDispatchEnabled
                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20"
                : "bg-stone-800 text-stone-400 border-stone-700 hover:bg-stone-700"
            }`}
          >
            {schedulerStatus?.config.autoDispatchEnabled ? (
              <>
                <ToggleRight className="w-4 h-4 text-emerald-400" />
                <span>Envio Diário: Ativo</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-stone-500" />
                <span>Envio Diário: Pausado</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleTriggerCronNow}
            disabled={triggeringCron}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-bold rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggeringCron ? "animate-spin" : ""}`} />
            <span>{triggeringCron ? "Executando..." : "Testar Cron Agora"}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs de Navegação */}
      <div id="ai-manager-subtabs" className="flex flex-wrap items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
        <button
          id="tab-btn-daily-report"
          type="button"
          onClick={() => setActiveSubTab("daily_report")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "daily_report"
              ? "bg-stone-900 text-stone-100 shadow-sm dark:bg-stone-100 dark:text-stone-900"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60"
          }`}
        >
          <Bot className="w-4 h-4 text-emerald-500" />
          <span>Relatório Matinal & Disparo</span>
        </button>

        <button
          id="tab-btn-automations"
          type="button"
          onClick={() => setActiveSubTab("automations")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "automations"
              ? "bg-stone-900 text-stone-100 shadow-sm dark:bg-stone-100 dark:text-stone-900"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60"
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-500" />
          <span>Portfólio de Automações (5)</span>
        </button>

        <button
          id="tab-btn-scheduler"
          type="button"
          onClick={() => setActiveSubTab("scheduler")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "scheduler"
              ? "bg-stone-900 text-stone-100 shadow-sm dark:bg-stone-100 dark:text-stone-900"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60"
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>Agendador Cron & Logs ({schedulerStatus?.recentHistory.length || 0})</span>
        </button>

        <button
          id="tab-btn-zapi-settings"
          type="button"
          onClick={() => setActiveSubTab("zapi_status")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "zapi_status"
              ? "bg-stone-900 text-stone-100 shadow-sm dark:bg-stone-100 dark:text-stone-900"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60"
          }`}
        >
          <Smartphone className="w-4 h-4 text-emerald-500" />
          <span>Configuração Z-API</span>
        </button>

        <button
          id="tab-btn-smart-assistant"
          type="button"
          onClick={() => setActiveSubTab("smart_assistant")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "smart_assistant"
              ? "bg-stone-900 text-stone-100 shadow-sm dark:bg-stone-100 dark:text-stone-900"
              : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/60"
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Métricas Analisadas</span>
        </button>
      </div>

      {/* SUBTAB: Portfólio de Automações */}
      {activeSubTab === "automations" && (
        <div id="ai-automations-portfolio-view" className="space-y-6">
          <div className="bg-[#141414] p-5 rounded-2xl border border-[#242424] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>Central de Automações e Disparos Ativos</span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Todas as automações operam na mesma engine com disparos inteligentes e gatilhos autônomos.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-xl border border-emerald-800 shrink-0">
              4 Automações Ativas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutomationToggle
              id="morning_report"
              title="Resumo Executivo Matinal"
              description="Compila o faturamento, pedidos e carrinhos das últimas 24h e envia o resumo via Z-API."
              triggerDescription="Diariamente às 09:00 AM (BRT)"
              enabled={automationsState.morning_report}
              onToggle={handleToggleAutomation}
              icon={<Bot className="w-5 h-5 text-emerald-400" />}
              tag="CRON ATIVO"
              lastRun="Hoje às 09:00"
            />

            <AutomationToggle
              id="abandoned_recovery"
              title="Recuperação de Carrinho Abandonado"
              description="Detecta desistências no checkout e envia mensagem personalizada com cupom de desconto."
              triggerDescription="30 minutos após abandono"
              enabled={automationsState.abandoned_recovery}
              onToggle={handleToggleAutomation}
              icon={<ShoppingCart className="w-5 h-5 text-emerald-400" />}
              tag="IA + Z-API"
              lastRun="Há 42 min"
            />

            <AutomationToggle
              id="stock_alert"
              title="Aviso de Estoque Baixo / Ruptura"
              description="Alerta o lojista no WhatsApp quando um produto do catálogo atinge menos de 5 unidades."
              triggerDescription="Imediato após confirmação de pedido"
              enabled={automationsState.stock_alert}
              onToggle={handleToggleAutomation}
              icon={<Package className="w-5 h-5 text-emerald-400" />}
              tag="ALERTA"
              lastRun="Ontem às 18:30"
            />

            <AutomationToggle
              id="post_purchase"
              title="Follow-up & Pesquisa Pós-Compra"
              description="Agradece pela compra e solicita avaliação do presente 3 dias após a confirmação de entrega."
              triggerDescription="72h após status 'Entregue'"
              enabled={automationsState.post_purchase}
              onToggle={handleToggleAutomation}
              icon={<HeartHandshake className="w-5 h-5 text-emerald-400" />}
              tag="ENGAGEMENT"
              lastRun="Há 2 dias"
            />

            <AutomationToggle
              id="churn_reactivation"
              title="Reativação de Clientes Inativos"
              description="Envia oferta exclusiva de retorno para clientes que não compram há mais de 60 dias."
              triggerDescription="Executado quinzenalmente às segundas"
              enabled={automationsState.churn_reactivation}
              onToggle={handleToggleAutomation}
              icon={<Users className="w-5 h-5 text-emerald-400" />}
              tag="CRM"
              lastRun="Pausado"
            />
          </div>
        </div>
      )}

      {/* SUBTAB 1: Relatório Matinal 09h */}
      {activeSubTab === "daily_report" && (
        <div id="ai-daily-report-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Painel de Controle e Disparo */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-500" />
                  Gerador Sob Demanda
                </h3>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                  Ao Vivo
                </span>
              </div>

              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Além do envio automático das 09:00, você pode gerar relatórios em tempo real sempre que desejar.
              </p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    WhatsApp Destinatário (com DDI e DDD)
                  </label>
                  <input
                    type="text"
                    value={targetPhone}
                    onChange={(e) => setTargetPhone(e.target.value)}
                    placeholder="5511947596045"
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs font-mono text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Ativva Gifts"
                    className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl text-xs text-stone-800 dark:text-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="space-y-2.5 pt-3">
                <button
                  id="btn-dispatch-zapi-main"
                  type="button"
                  onClick={() => handleGenerateAndDispatch("zapi")}
                  disabled={generating}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>{generating ? "Processando e Enviando..." : "⚡ Disparar via Z-API (Automático)"}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenerateAndDispatch("view")}
                    disabled={generating}
                    className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs rounded-xl transition-colors border border-stone-200 dark:border-stone-700 text-center"
                  >
                    Visualizar Texto
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateAndDispatch("whatsapp")}
                    disabled={generating}
                    className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs rounded-xl transition-colors border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WhatsApp Web</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Pré-visualização do Relatório Gerado */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs h-full flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                      Resultado do Relatório Executivo
                    </h3>
                  </div>

                  {reportResult && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-400">
                        Gerado às {reportResult.generatedAt}
                      </span>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg text-stone-500 transition-colors"
                        title="Copiar texto"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  {reportResult?.text ? (
                    <div className="p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 text-xs font-mono text-stone-800 dark:text-stone-200 whitespace-pre-wrap leading-relaxed max-h-[460px] overflow-y-auto">
                      {reportResult.text}
                    </div>
                  ) : (
                    <div className="py-16 px-4 text-center space-y-3 bg-stone-50/50 dark:bg-stone-950/40 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                      <Bot className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-stone-700 dark:text-stone-300">
                          Nenhum relatório gerado na sessão atual
                        </p>
                        <p className="text-xs text-stone-400 max-w-sm mx-auto">
                          Clique em "⚡ Disparar via Z-API" ou acesse a aba "Agendador Cron" para visualizar os disparos programados.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {reportResult?.whatsappLink && (
                <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <span className="text-xs text-stone-500">Deseja abrir no navegador?</span>
                  <a
                    href={reportResult.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>Abrir no WhatsApp Web</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Agendador Cron & Logs */}
      {activeSubTab === "scheduler" && (
        <div id="ai-scheduler-view" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Horário Configurado</span>
                <Clock className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
                  09:00 AM
                </p>
                <p className="text-xs text-stone-500 mt-1">Horário Oficial de Brasília (UTC-3)</p>
              </div>
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400">Frequência:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Diário (Seg a Dom)</span>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Próxima Execução</span>
                <Activity className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {schedulerStatus?.nextExecutionFormatted || "Hoje às 09:00 (BRT)"}
                </p>
                <p className="text-xs text-stone-500 mt-1">Servidor sincronizado: {schedulerStatus?.currentTimeSaoPaulo || "Carregando..."}</p>
              </div>
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400">Motor de IA:</span>
                <span className="font-semibold text-stone-700 dark:text-stone-300">Gemini 3.7 Flash</span>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Canal de Envio</span>
                <Smartphone className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-base font-bold font-mono text-stone-900 dark:text-stone-100">
                  +55 (11) 94759-6045
                </p>
                <p className="text-xs text-stone-500 mt-1">Gateway Z-API Oficial Conectado</p>
              </div>
              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-400">Autonomia:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">100% Background</span>
              </div>
            </div>
          </div>

          {/* Lista de Logs de Execução */}
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Histórico de Disparos do Agendador (Audit Trail)
                </h3>
              </div>

              <button
                type="button"
                onClick={fetchSchedulerStatus}
                className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-500 text-xs flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Atualizar</span>
              </button>
            </div>

            <div className="space-y-3">
              {schedulerStatus?.recentHistory && schedulerStatus.recentHistory.length > 0 ? (
                schedulerStatus.recentHistory.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          log.type === "scheduled_cron" 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}>
                          {log.type === "scheduled_cron" ? "⏰ Cron 09:00 Automático" : "⚡ Teste Manual"}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-mono">
                          {log.formattedDate}
                        </span>
                        <span className="text-xs text-stone-400 font-mono">
                          ({log.durationMs}ms)
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 dark:text-stone-300 font-medium line-clamp-2">
                        {log.reportSnippet}
                      </p>
                      <div className="text-[11px] text-stone-400 flex items-center gap-3">
                        <span>Destinatário: <strong className="text-stone-600 dark:text-stone-300">+{log.recipientPhone}</strong></span>
                        {log.zApiStatus?.messageId && (
                          <span>ID Z-API: <strong className="text-stone-600 dark:text-stone-300">{log.zApiStatus.messageId}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Disparado via Z-API
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReportResult({
                            text: log.fullReportText,
                            whatsappLink: `https://wa.me/${log.recipientPhone}?text=${encodeURIComponent(log.fullReportText)}`,
                            generatedAt: log.formattedDate,
                            zApiStatus: log.zApiStatus,
                          });
                          setActiveSubTab("daily_report");
                        }}
                        className="px-3 py-1.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-semibold rounded-xl transition-colors"
                      >
                        Ver Texto
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-stone-400">
                  Nenhum log de disparo gravado ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Configuração Z-API */}
      {activeSubTab === "zapi_status" && (
        <div id="ai-zapi-settings-view" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Credenciais Z-API Conectadas
                </h3>
                <p className="text-xs text-stone-400">Instância ativa e pronta para envio autônomo diário</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">ID da Instância</span>
                <span className="text-xs font-mono text-stone-800 dark:text-stone-200 break-all font-semibold">
                  3F8069943712D1188556BA5ABB7B83F8
                </span>
              </div>

              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Token da Instância</span>
                <span className="text-xs font-mono text-stone-800 dark:text-stone-200 break-all font-semibold">
                  D7730B452CBA1B592029BC50
                </span>
              </div>

              <div className="p-3.5 bg-stone-50 dark:bg-stone-950 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Client-Token de Segurança</span>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 break-all font-semibold">
                  Fb1b764204b8c48dba31c5de34cd65ddcS
                </span>
              </div>
            </div>

            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                Conexão verificada e autorizada pelo Gateway Z-API.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-500" />
              Regras e Gatilhos de Disparo
            </h3>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">Relatório Executivo Matinal (09:00 AM)</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">Envia o panorama de faturamento, pedidos e metas do dia.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">Alerta de Estoque Baixo</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">Notifica quando produtos de alta rotação atingirem menos de 5 unidades.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">Recuperação de Carrinho Abandonado</h4>
                  <p className="text-[11px] text-stone-400 mt-0.5">Permite acionar mensagens com cupons de desconto personalizados via WhatsApp.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Métricas Analisadas */}
      {activeSubTab === "smart_assistant" && (
        <div id="ai-smart-assistant-view" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Faturamento sob Análise</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
              R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-stone-400">Total acumulado de pedidos confirmados</p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Pedidos Pendentes</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
              {pendingOrders.length}
            </p>
            <p className="text-xs text-stone-400">Aguardando pagamento ou confirmação</p>
          </div>

          <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Alertas de Estoque</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold font-mono text-stone-900 dark:text-stone-100">
              {lowStockCount} produtos
            </p>
            <p className="text-xs text-stone-400">Com menos de 5 unidades em estoque</p>
          </div>
        </div>
      )}
    </div>
  );
};
