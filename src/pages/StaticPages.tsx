import React from "react";
import { BRAND_CONFIG } from "../config/brand";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  QrCode,
  HelpCircle,
  Mail,
  Phone,
  Clock,
  Sparkles,
  ChevronRight,
} from "lucide-react";

interface StaticPagesProps {
  pageId: "sobre" | "trocas" | "privacidade" | "termos" | "ajuda" | "entregas" | "pagamentos";
  onNavigateCatalog: () => void;
}

export const StaticPages: React.FC<StaticPagesProps> = ({ pageId, onNavigateCatalog }) => {
  return (
    <div className="bg-stone-50 min-h-screen py-10 sm:py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-8">
          {/* PAGE: SOBRE A MARCA */}
          {pageId === "sobre" && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Nossa História & Propósito
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                  Sobre {BRAND_CONFIG.name}
                </h1>
              </div>

              <div className="prose prose-stone text-xs sm:text-sm text-stone-700 space-y-4 leading-relaxed">
                <p>
                  A <strong>{BRAND_CONFIG.name}</strong> nasceu com a missão de transformar o ato de presentear em uma experiência memorável, descomplicada e repleta de afeto. Acreditamos que um bom presente une estética refinada, utilidade no dia a dia e um acabamento impecável.
                </p>
                <p>
                  Nossa equipe de curadoria pesquisa continuamente tendências globais de design para casa, gastronomia, tecnologia e bem-estar, selecionando produtos que se destacam pela autenticidade e qualidade construtiva superior.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6 not-prose">
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                    <Sparkles className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                    <h3 className="font-bold text-xs text-stone-900">Curadoria Rigorosa</h3>
                    <p className="text-[11px] text-stone-500 mt-1">Cada item é testado e aprovado antes de entrar no catálogo.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                    <h3 className="font-bold text-xs text-stone-900">Origem & Garantia</h3>
                    <p className="text-[11px] text-stone-500 mt-1">Produtos originais com garantia de procedência e nota fiscal.</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-center">
                    <RotateCcw className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-bold text-xs text-stone-900">Embalagem Nobre</h3>
                    <p className="text-[11px] text-stone-500 mt-1">Caixas de presente projetadas para emocionar no unboxing.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: TROCAS E DEVOLUÇÕES */}
          {pageId === "trocas" && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Garantia & Respeito ao Cliente
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                  Política de Trocas e Devoluções
                </h1>
              </div>

              <div className="text-xs sm:text-sm text-stone-700 space-y-4 leading-relaxed">
                <p>
                  Conforme o Código de Defesa do Consumidor (Art. 49), você tem até <strong>7 (sete) dias corridos</strong> a partir da data de recebimento do pedido para solicitar a devolução ou troca por arrependimento ou desistência.
                </p>

                <h3 className="font-bold text-stone-950 text-sm mt-4">1. Como solicitar a troca ou devolução</h3>
                <p>
                  Entre em contato com nossa equipe pelo WhatsApp <strong>{BRAND_CONFIG.whatsappDisplay}</strong> ou pelo e-mail <strong>{BRAND_CONFIG.email}</strong> informando o número do seu pedido e o motivo.
                </p>

                <h3 className="font-bold text-stone-950 text-sm mt-4">2. Custos de Frete (Logística Reversa)</h3>
                <p>
                  A primeira troca ou devolução dentro do prazo de 7 dias é <strong>totalmente gratuita</strong>. Nós fornecemos a etiqueta de postagem pré-paga para envio nos Correios.
                </p>

                <h3 className="font-bold text-stone-950 text-sm mt-4">3. Condições do Produto</h3>
                <p>
                  O item deve ser devolvido em sua embalagem original, sem indícios de uso indevido, acompanhado de todos os acessórios, manuais e nota fiscal.
                </p>

                <h3 className="font-bold text-stone-950 text-sm mt-4">4. Reembolso dos Valores</h3>
                <p>
                  Em caso de devolução, o estorno no cartão de crédito ocorre em até 2 faturas subsequentes, ou transferência via Pix em até 2 dias úteis após a conferência do produto em nosso centro de distribuição.
                </p>
              </div>
            </div>
          )}

          {/* PAGE: ENTREGAS E PRAZOS */}
          {pageId === "entregas" && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Logística Nacional
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                  Prazos e Formas de Envio
                </h1>
              </div>

              <div className="text-xs sm:text-sm text-stone-700 space-y-4 leading-relaxed">
                <p>
                  Enviamos para todo o território brasileiro através dos Correios (Sedex e PAC) e transportadoras parceiras homologadas com rastreamento integral.
                </p>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-950 my-4">
                  <h4 className="font-bold text-xs flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    Frete Grátis
                  </h4>
                  <p className="text-xs mt-1">
                    Válido automaticamente para compras a partir de <strong>R$ {BRAND_CONFIG.freeShippingThreshold.toFixed(2)}</strong>.
                  </p>
                </div>

                <h3 className="font-bold text-stone-950 text-sm">Prazos Médios de Entrega:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Capitais do Sudeste e Sul:</strong> 1 a 4 dias úteis</li>
                  <li><strong>Interior do Sudeste e Sul:</strong> 3 a 6 dias úteis</li>
                  <li><strong>Capitais do Centro-Oeste e Nordeste:</strong> 3 a 7 dias úteis</li>
                  <li><strong>Interior e Região Norte:</strong> 5 a 10 dias úteis</li>
                </ul>
              </div>
            </div>
          )}

          {/* PAGE: PAGAMENTOS */}
          {pageId === "pagamentos" && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Condições Comerciais
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                  Formas de Pagamento & Parcelamento
                </h1>
              </div>

              <div className="text-xs sm:text-sm text-stone-700 space-y-4 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose my-4">
                  <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                    <QrCode className="w-6 h-6 text-emerald-600 mb-2" />
                    <h3 className="font-bold text-sm text-stone-900">Pix com {BRAND_CONFIG.pixDiscountPercentage}% OFF</h3>
                    <p className="text-xs text-stone-600 mt-1">
                      Aprovação instantânea 24 horas por dia. O desconto é calculado automaticamente no checkout.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                    <CreditCard className="w-6 h-6 text-stone-900 mb-2" />
                    <h3 className="font-bold text-sm text-stone-900">Cartão até 10x sem juros</h3>
                    <p className="text-xs text-stone-600 mt-1">
                      Aceitamos Visa, Mastercard, Elo, Hipercard e American Express com processamento seguro criptografado.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PAGE: CENTRAL DE AJUDA / FAQ */}
          {pageId === "ajuda" && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Suporte & Dúvidas
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                  Perguntas Frequentes (FAQ)
                </h1>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                {[
                  {
                    q: "Como enviar um presente diretamente para outra pessoa?",
                    a: "Basta cadastrar o endereço de quem vai receber na etapa de entrega do checkout. Você também pode marcar a opção de 'Embalagem de Presente' e escrever uma dedicatória personalizada no cartão sem custos extras.",
                  },
                  {
                    q: "A nota fiscal vai com o valor do presente dentro da caixa?",
                    a: "Não! Para encomendas com embalagem de presente, enviamos a declaração simplificada sem valores aparentes, e a NF-e oficial é enviada apenas para o e-mail de quem comprou.",
                  },
                  {
                    q: "Os produtos possuem garantia?",
                    a: "Sim, todos os nossos produtos possuem garantia mínima legal de 90 dias contra qualquer defeito de fabricação.",
                  },
                  {
                    q: "Posso rastrear meu pedido?",
                    a: "Sim, assim que o pedido for despachado você receberá o código de rastreamento por e-mail e poderá acompanhar na sua página 'Meus Pedidos'.",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <h3 className="font-bold text-stone-950 mb-1.5">{item.q}</h3>
                    <p className="text-stone-600 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGE: PRIVACIDADE */}
          {pageId === "privacidade" && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  LGPD & Proteção de Dados
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                  Política de Privacidade
                </h1>
              </div>

              <div className="text-xs sm:text-sm text-stone-700 space-y-3 leading-relaxed">
                <p>
                  A <strong>{BRAND_CONFIG.name}</strong> valoriza sua privacidade e protege seus dados pessoais de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
                </p>
                <p>
                  Seus dados de pagamento são transmitidos diretamente para as instituições financeiras através de canais criptografados SSL 256-bit e nunca são armazenados em nossos servidores.
                </p>
              </div>
            </div>
          )}

          {/* PAGE: TERMOS DE USO */}
          {pageId === "termos" && (
            <div className="space-y-6">
              <div className="border-b border-stone-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  Regulamento
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-stone-950 mt-1">
                  Termos e Condições de Uso
                </h1>
              </div>

              <div className="text-xs sm:text-sm text-stone-700 space-y-3 leading-relaxed">
                <p>
                  Ao navegar e realizar compras no site de <strong>{BRAND_CONFIG.name}</strong>, você concorda com nossos termos de prestação de serviços de comércio eletrônico B2C.
                </p>
                <p>
                  As ofertas e preços anunciados são válidos enquanto durarem nossos estoques e estão sujeitos a alterações sem aviso prévio.
                </p>
              </div>
            </div>
          )}

          <div className="pt-6 border-t border-stone-200 flex justify-between items-center">
            <button
              onClick={onNavigateCatalog}
              className="px-6 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition-colors"
            >
              Explorar Produtos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
