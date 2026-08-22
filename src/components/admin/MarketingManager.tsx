import React, { useState } from "react";
import {
  Activity,
  Globe,
  Tag,
  Share2,
  Code,
  Save,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  HelpCircle,
  BarChart3,
} from "lucide-react";
import { MarketingSettings } from "../../types";
import { saveAdminMarketingSettings } from "../../services/api";
import { applyMarketingAndTracking } from "../../services/marketing";
import { useToast } from "../../context/ToastContext";

interface MarketingManagerProps {
  settings: MarketingSettings;
  onSettingsUpdated: (updated: MarketingSettings) => void;
  activeSubTab?: "trackers" | "seo" | "scripts";
  onSubTabChange?: (tab: "trackers" | "seo" | "scripts") => void;
}

export const MarketingManager: React.FC<MarketingManagerProps> = ({
  settings,
  onSettingsUpdated,
  activeSubTab: propActiveSubTab,
  onSubTabChange,
}) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<MarketingSettings>({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [localSubTab, setLocalSubTab] = useState<"trackers" | "seo" | "scripts">("trackers");

  const activeSubTab = propActiveSubTab || localSubTab;
  const setActiveSubTab = onSubTabChange || setLocalSubTab;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ok = await saveAdminMarketingSettings(form);
      if (ok) {
        onSettingsUpdated(form);
        applyMarketingAndTracking(form);
        showToast("Configurações de Marketing, SEO e Pixels salvas!", "success");
      } else {
        showToast("Falha ao salvar no banco de dados.", "error");
      }
    } catch {
      showToast("Erro ao gravar parâmetros.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getSectionHeaderInfo = () => {
    switch (activeSubTab) {
      case "trackers":
        return {
          title: "1. Pixels & Tags de Conversão",
          subtitle: "Google Tag Manager, Google Analytics 4 (GA4), Google Ads e Meta Pixel (Facebook & Instagram).",
          icon: <Zap className="w-5 h-5 text-amber-600" />,
        };
      case "seo":
        return {
          title: "2. SEO Global & Redes Sociais",
          subtitle: "Metadados de busca no Google e prévias para compartilhamento no WhatsApp, Facebook e Instagram.",
          icon: <Globe className="w-5 h-5 text-amber-600" />,
        };
      case "scripts":
        return {
          title: "3. Scripts Personalizados",
          subtitle: "Injeção customizada no cabeçalho (<head>) e rodapé (<body>) para chats, Clarity e ferramentas externas.",
          icon: <Code className="w-5 h-5 text-amber-600" />,
        };
      default:
        return {
          title: "Marketing, SEO & Pixels",
          subtitle: "Gerencie tags de conversão e metadados da loja.",
          icon: <Activity className="w-5 h-5 text-amber-600" />,
        };
    }
  };

  const headerInfo = getSectionHeaderInfo();

  return (
    <div className="space-y-6">
      {/* HEADER */}
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
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: TRACKERS (GTM, GA4, ADS, META) */}
        {/* ========================================================================= */}
        {activeSubTab === "trackers" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GOOGLE TAG MANAGER */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    GTM
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Google Tag Manager</h3>
                    <p className="text-[11px] text-stone-500">Contêiner para injeção centralizada de scripts</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.gtmEnabled || false}
                    onChange={(e) => setForm({ ...form, gtmEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-950"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ID do Contêiner GTM (GTM-XXXXXXX)
                </label>
                <input
                  type="text"
                  placeholder="GTM-N9XXXXX"
                  value={form.gtmId || ""}
                  onChange={(e) => setForm({ ...form, gtmId: e.target.value.trim() })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 space-y-1">
                <p className="font-semibold text-stone-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Disparos Automáticos DataLayer:</span>
                </p>
                <p className="text-stone-500">
                  A loja dispara eventos <code className="text-stone-800 font-mono font-bold">view_item</code>, <code className="text-stone-800 font-mono font-bold">add_to_cart</code>, <code className="text-stone-800 font-mono font-bold">begin_checkout</code> e <code className="text-stone-800 font-mono font-bold">purchase</code> para o dataLayer.
                </p>
              </div>
            </div>

            {/* GOOGLE ANALYTICS 4 */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                    GA4
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Google Analytics 4</h3>
                    <p className="text-[11px] text-stone-500">Métricas de tráfego, audiência e conversões</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.gaEnabled || false}
                    onChange={(e) => setForm({ ...form, gaEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-950"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ID de Medição do GA4 (G-XXXXXXXXXX)
                </label>
                <input
                  type="text"
                  placeholder="G-ABC123XYZ"
                  value={form.gaMeasurementId || ""}
                  onChange={(e) => setForm({ ...form, gaMeasurementId: e.target.value.trim() })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 space-y-1">
                <p className="text-stone-500">
                  Encontrado no painel do Google Analytics em: <em>Administrador &gt; Fluxo de Dados &gt; ID da Métrica</em>.
                </p>
              </div>
            </div>

            {/* GOOGLE ADS */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    ADS
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Google Ads (Campanhas)</h3>
                    <p className="text-[11px] text-stone-500">Acompanhamento de conversões e ROAS</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.googleAdsEnabled || false}
                    onChange={(e) => setForm({ ...form, googleAdsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-950"></div>
                </label>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    ID da Conta Google Ads (AW-XXXXXXXXXX)
                  </label>
                  <input
                    type="text"
                    placeholder="AW-123456789"
                    value={form.googleAdsId || ""}
                    onChange={(e) => setForm({ ...form, googleAdsId: e.target.value.trim() })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:border-stone-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Rótulo de Conversão de Compra (Conversion Label)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: AbCdEfGhIjKlMnOpQrS"
                    value={form.googleAdsConversionLabel || ""}
                    onChange={(e) => setForm({ ...form, googleAdsConversionLabel: e.target.value.trim() })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:border-stone-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* META PIXEL (FACEBOOK & INSTAGRAM) */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    META
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-stone-900">Meta Pixel (Facebook / Insta)</h3>
                    <p className="text-[11px] text-stone-500">Rastreamento de público, retargeting e DPA</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.metaPixelEnabled || false}
                    onChange={(e) => setForm({ ...form, metaPixelEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-stone-950"></div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ID do Pixel da Meta (15 ou 16 dígitos)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 987654321098765"
                  value={form.metaPixelId || ""}
                  onChange={(e) => setForm({ ...form, metaPixelId: e.target.value.trim() })}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-xl text-[11px] text-stone-600 space-y-1">
                <p className="text-stone-500">
                  Eventos padrão disparados: <code className="text-stone-800 font-mono font-bold">PageView</code>, <code className="text-stone-800 font-mono font-bold">ViewContent</code>, <code className="text-stone-800 font-mono font-bold">AddToCart</code>, <code className="text-stone-800 font-mono font-bold">InitiateCheckout</code> e <code className="text-stone-800 font-mono font-bold">Purchase</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SEO & METADATA */}
        {/* ========================================================================= */}
        {activeSubTab === "seo" && (
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-600" />
                <span>Metadados Globais para Google (SEO) e Compartilhamento Social (OpenGraph)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Essas informações aparecem nos resultados de busca do Google e quando o link da loja é enviado no WhatsApp ou redes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-800 mb-1">
                  Título Principal da Página (Tag Title & OG:Title) *
                </label>
                <input
                  type="text"
                  value={form.seoTitle || ""}
                  onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                  placeholder="Ex: glos. | Presentes Criativos & Design Autoral"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-800 mb-1">
                  Descrição nos Buscadores (Meta Description & OG:Description)
                </label>
                <textarea
                  rows={3}
                  value={form.seoDescription || ""}
                  onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
                  placeholder="Ex: Curadoria autoral de presentes criativos, utilidades para casa, café gourmet e kits especiais..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Recomendado entre 140 e 160 caracteres para visualização perfeita no Google.
                </span>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Palavras-chave (Keywords separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={form.seoKeywords || ""}
                  onChange={(e) => setForm({ ...form, seoKeywords: e.target.value })}
                  placeholder="Ex: presentes criativos, design, xicaras, kits gourmet"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  URL da Imagem de Compartilhamento (OG:Image 1200x630px)
                </label>
                <input
                  type="text"
                  value={form.ogImage || ""}
                  onChange={(e) => setForm({ ...form, ogImage: e.target.value })}
                  placeholder="https://sua-loja.com/og-image.jpg"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>
            </div>

            {/* LIVE PREVIEW OF GOOGLE SNIPPET */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
              <span className="text-xs font-bold text-stone-700 block">Prévia no Google Search:</span>
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
                <div className="text-[11px] text-stone-500 truncate">https://sua-loja.com.br</div>
                <div className="text-sm font-semibold text-blue-800 hover:underline cursor-pointer">
                  {form.seoTitle || "glos. | Presentes Criativos & Design Autoral"}
                </div>
                <div className="text-xs text-stone-600 line-clamp-2">
                  {form.seoDescription || "Curadoria autoral de presentes criativos e kits especiais feitos para surpreender..."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CUSTOM SCRIPTS */}
        {/* ========================================================================= */}
        {activeSubTab === "scripts" && (
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-2xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Code className="w-4 h-4 text-amber-600" />
                <span>Scripts Personalizados Adicionais (Header & Body)</span>
              </h3>
              <p className="text-xs text-stone-500">
                Insira códigos extras para ferramentas como Hotjar, Clarity, Chat ao Vivo (Zendesk/JivoChat) ou TikTok Pixel.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Scripts no Cabeçalho (&lt;head&gt;)
                </label>
                <textarea
                  rows={4}
                  value={form.customHeadScript || ""}
                  onChange={(e) => setForm({ ...form, customHeadScript: e.target.value })}
                  placeholder="<!-- Exemplo de script de verificação de domínio ou chat -->"
                  className="w-full p-3 bg-stone-950 text-amber-400 font-mono text-xs border border-stone-800 rounded-xl focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Scripts no Rodapé (&lt;body&gt;)
                </label>
                <textarea
                  rows={4}
                  value={form.customBodyScript || ""}
                  onChange={(e) => setForm({ ...form, customBodyScript: e.target.value })}
                  placeholder="<!-- Scripts adicionais para o final do carregamento -->"
                  className="w-full p-3 bg-stone-950 text-amber-400 font-mono text-xs border border-stone-800 rounded-xl focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* FOOTER SAVE BAR */}
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
            <span>Salvar Todas as Configurações de Marketing</span>
          </button>
        </div>
      </form>
    </div>
  );
};
