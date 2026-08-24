import React, { useState } from "react";
import { BRAND_CONFIG } from "../../config/brand";
import {
  Phone,
  Mail,
  Clock,
  MapPin,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  QrCode,
  Lock,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { subscribeNewsletter } from "../../services/api";
import { BrandLogo } from "../admin/BrandLogo";

interface FooterProps {
  onNavigateStaticPage: (pageId: "sobre" | "trocas" | "privacidade" | "termos" | "ajuda" | "entregas" | "pagamentos") => void;
  onNavigateCatalog: (category?: any) => void;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateStaticPage,
  onNavigateCatalog,
  onNavigateAdmin,
}) => {
  const { showToast } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      showToast("Por favor, digite um e-mail válido.", "error");
      return;
    }
    setIsSubmitting(true);
    const res = await subscribeNewsletter(newsletterEmail);
    setIsSubmitting(false);
    showToast(res.message, "success");
    setNewsletterEmail("");
  };

  return (
    <footer className="bg-stone-950 text-stone-300 pt-14 pb-8 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-stone-800">
          {/* Column 1: Brand & Manifesto */}
          <div className="lg:col-span-2 space-y-4">
            <BrandLogo size="md" variant="light" />

            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              {BRAND_CONFIG.description}
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Receba Novidades & Cupons Exclusivos</span>
              </h4>
              <p className="text-xs text-stone-400 mb-3">
                Cadastre-se para receber em primeira mão lançamentos, coleções afetivas e novidades.
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Seu melhor e-mail"
                  className="flex-1 bg-stone-900 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-stone-400"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-white hover:bg-stone-200 text-stone-950 text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1 disabled:opacity-50"
                >
                  <span>{isSubmitting ? "..." : "Cadastrar"}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>

          {/* Column 2: Categorias */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Categorias
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => onNavigateCatalog("presentes-criativos")}
                  className="hover:text-white transition-colors"
                >
                  Presentes Criativos
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateCatalog("cozinha")}
                  className="hover:text-white transition-colors"
                >
                  Cozinha & Café Gourmet
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateCatalog("eletronicos")}
                  className="hover:text-white transition-colors"
                >
                  Eletrônicos & Áudio
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateCatalog("kits-presenteaveis")}
                  className="hover:text-white transition-colors"
                >
                  Kits Presenteáveis
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateCatalog("copos-garrafas")}
                  className="hover:text-white transition-colors"
                >
                  Copos & Garrafas Térmicas
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateCatalog("decoracao")}
                  className="hover:text-white transition-colors"
                >
                  Decoração & Aromas
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Atendimento & Ajuda */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Atendimento & Suporte
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li className="flex items-start gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{BRAND_CONFIG.whatsappDisplay}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                <span>{BRAND_CONFIG.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{BRAND_CONFIG.openingHours}</span>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => onNavigateStaticPage("ajuda")}
                  className="text-stone-300 hover:text-white underline"
                >
                  Central de Dúvidas Frequentes
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Institucional & Políticas */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Políticas & Segurança
            </h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => onNavigateStaticPage("sobre")}
                  className="hover:text-white transition-colors"
                >
                  Sobre a Nossa Curadoria
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStaticPage("trocas")}
                  className="hover:text-white transition-colors"
                >
                  Trocas e Devoluções (7 dias)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStaticPage("entregas")}
                  className="hover:text-white transition-colors"
                >
                  Prazos e Formas de Envio
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStaticPage("pagamentos")}
                  className="hover:text-white transition-colors"
                >
                  Formas de Pagamento & Parcelamento
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStaticPage("privacidade")}
                  className="hover:text-white transition-colors"
                >
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStaticPage("termos")}
                  className="hover:text-white transition-colors"
                >
                  Termos e Condições de Uso
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Payment Methods & Security Seals Row */}
        <div className="py-8 border-b border-stone-800 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="text-stone-400 font-medium">Formas de Pagamento:</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md font-bold text-emerald-400 flex items-center gap-1">
                <QrCode className="w-3 h-3" /> Pix ({BRAND_CONFIG.pixDiscountPercentage}% OFF)
              </span>
              <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md font-semibold text-stone-300 flex items-center gap-1">
                <CreditCard className="w-3 h-3" /> Cartão até 10x
              </span>
              <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-md font-semibold text-stone-300">
                Boleto Bancário
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Ambiente 256-bit SSL Seguro</span>
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Compra 100% Protegida</span>
            </span>
          </div>
        </div>

        {/* Legal Disclaimer & Identification */}
        <div className="pt-6 text-center space-y-2 text-[11px] text-stone-500">
          <p>
            {BRAND_CONFIG.name} © {new Date().getFullYear()} — Todos os direitos reservados.
          </p>
          <p>
            CNPJ: {BRAND_CONFIG.cnpjPlaceholder} | Endereço: {BRAND_CONFIG.addressPlaceholder}
          </p>
          <p className="text-[10px] text-stone-600">
            * Ambiente de comércio eletrônico B2C. "{BRAND_CONFIG.name}" é um identificador editável de forma centralizada em <code>src/config/brand.ts</code>.
          </p>
        </div>
      </div>
    </footer>
  );
};
