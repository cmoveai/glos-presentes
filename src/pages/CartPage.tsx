import React, { useState } from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Check,
  ShieldCheck,
  Truck,
  MessageCircle,
  AlertCircle,
  Gift,
  Heart,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { BRAND_CONFIG } from "../config/brand";
import { PRODUCTS } from "../data/products";
import { Product } from "../types";

interface CartPageProps {
  onNavigateHome: () => void;
  onNavigateCatalog: () => void;
  onNavigateProduct: (slug: string) => void;
  onNavigateCheckout: () => void;
  onQuickView?: (product: Product) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigateHome,
  onNavigateCatalog,
  onNavigateProduct,
  onNavigateCheckout,
}) => {
  const {
    items,
    itemCount,
    subtotal,
    hasPersonalizavelItems,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const [itemToRemove, setItemToRemove] = useState<string | null>(null);

  // Sugestões de presentes para estado vazio ou complemento
  const curatedSuggestions = React.useMemo(() => {
    return PRODUCTS.filter((p) => p.bestseller || p.featured).slice(0, 4);
  }, []);

  return (
    <div className="min-h-[80vh] bg-[#E4E2DD] text-[#272727] font-['Montserrat'] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho da Página */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#D6D3CC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F4F3EF] border border-[#D6D3CC] flex items-center justify-center text-[#004AAD]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-medium text-[#272727] tracking-tight">
                Seu Carrinho de Presentes
              </h1>
              <p className="text-xs sm:text-sm text-[#6B6A64]">
                {itemCount === 0
                  ? "Nenhum item adicionado no momento"
                  : `${itemCount} ${itemCount === 1 ? "presente escolhido" : "presentes escolhidos"}`}
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="self-start sm:self-auto text-xs text-[#6B6A64] hover:text-[#9B2C2C] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D6D3CC] hover:border-[#9B2C2C]/30 bg-[#F4F3EF] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar carrinho</span>
            </button>
          )}
        </div>

        {/* ESTADO VAZIO */}
        {items.length === 0 ? (
          <div className="space-y-12">
            <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-lg p-8 sm:p-14 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-center mx-auto mb-5 text-[#6B6A64]">
                <Gift className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h2 className="text-lg sm:text-xl font-medium text-[#272727] mb-2">
                Seu carrinho ainda está vazio
              </h2>
              <p className="text-sm text-[#6B6A64] max-w-md mx-auto mb-8 leading-relaxed">
                Que tal encontrar um presente especial para emocionar quem você ama? Explore nossa curadoria de presentes personalizados e prontos pra encantar.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onNavigateCatalog}
                  className="w-full sm:w-auto px-6 py-3 bg-[#004AAD] hover:bg-[#003882] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>Ver presentes</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="w-full sm:w-auto px-6 py-3 bg-[#EEEDE8] hover:bg-[#E4E2DD] text-[#272727] border border-[#D6D3CC] text-sm font-medium rounded-lg transition-colors"
                >
                  Voltar para a página inicial
                </button>
              </div>
            </div>

            {/* Sugestões de presentes */}
            {curatedSuggestions.length > 0 && (
              <div className="pt-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-medium text-[#272727]">
                      Presentes mais amados
                    </h3>
                    <p className="text-xs text-[#6B6A64]">
                      Destaques que nossos clientes adoram presentear
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateCatalog}
                    className="text-xs text-[#004AAD] hover:underline font-medium flex items-center gap-1"
                  >
                    <span>Ver todos</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {curatedSuggestions.map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => onNavigateProduct(prod.slug)}
                      className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-lg p-3 hover:border-[#004AAD] transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div className="aspect-square rounded-md overflow-hidden bg-[#EEEDE8] mb-3">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6B6A64] block mb-1">
                          {prod.categoryName}
                        </span>
                        <h4 className="text-xs font-medium text-[#272727] line-clamp-2 mb-2">
                          {prod.name}
                        </h4>
                        <div className="flex items-baseline justify-between mt-auto">
                          <span className="text-xs sm:text-sm font-medium text-[#272727] tabular-nums">
                            R$ {(prod.promotionalPrice ?? prod.price).toFixed(2)}
                          </span>
                          <span className="text-[10px] text-[#004AAD] font-medium">
                            Ver detalhes
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CARRINHO COM ITENS (2 COLUNAS NO DESKTOP, EMPILHADO NO MOBILE) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUNA ESQUERDA: LISTA DE ITENS (7 colunas) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between text-xs text-[#6B6A64] px-1">
                <span>Itens selecionados ({itemCount})</span>
                <span>Preço unitário & subtotal</span>
              </div>

              {items.map((item) => {
                const isPersonalizavel =
                  item.natureza === "personalizavel" || item.requerArquivo === true;
                const itemSubtotal = item.precoUnitario * item.quantidade;

                return (
                  <div
                    key={item.cartLineId}
                    className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row gap-4 relative transition-colors hover:border-[#BDB9B0]"
                  >
                    {/* Imagem do Produto */}
                    <div
                      onClick={() =>
                        onNavigateProduct(item.product?.slug || item.productId)
                      }
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-md overflow-hidden bg-[#EEEDE8] border border-[#D6D3CC] shrink-0 cursor-pointer group"
                    >
                      <img
                        src={item.imagem || item.product?.images?.[0]}
                        alt={item.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>

                    {/* Conteúdo Central e Detalhes de Personalização */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onNavigateProduct(item.product?.slug || item.productId)
                            }
                            className="text-sm font-medium text-[#272727] hover:text-[#004AAD] transition-colors text-left line-clamp-2"
                          >
                            {item.nome}
                          </button>

                          {/* Botão Remover Linha */}
                          <button
                            type="button"
                            onClick={() => {
                              if (itemToRemove === item.cartLineId) {
                                removeFromCart(item.cartLineId);
                                setItemToRemove(null);
                              } else {
                                setItemToRemove(item.cartLineId);
                              }
                            }}
                            className="text-[#6B6A64] hover:text-[#9B2C2C] p-1.5 rounded hover:bg-[#EEEDE8] transition-colors shrink-0"
                            title="Remover presente do carrinho"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Confirmação de remoção inline se ativada */}
                        {itemToRemove === item.cartLineId && (
                          <div className="mb-2 p-2 bg-[#EEEDE8] border border-[#D6D3CC] rounded text-xs flex items-center justify-between gap-2 text-[#9B2C2C]">
                            <span>Deseja remover este item?</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  removeFromCart(item.cartLineId);
                                  setItemToRemove(null);
                                }}
                                className="px-2 py-0.5 bg-[#9B2C2C] text-white text-[11px] rounded"
                              >
                                Sim, remover
                              </button>
                              <button
                                type="button"
                                onClick={() => setItemToRemove(null)}
                                className="px-2 py-0.5 bg-white border border-[#D6D3CC] text-[#272727] text-[11px] rounded"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Selo de Natureza */}
                        <div className="mb-2.5">
                          {isPersonalizavel ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#004AAD]/10 text-[#004AAD] border border-[#004AAD]/20">
                              <Sparkles className="w-3 h-3" />
                              <span>Personalizável</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3" />
                              <span>Pronto pra enviar</span>
                            </span>
                          )}
                        </div>

                        {/* Resumo da Personalização ou Variação */}
                        <div className="space-y-1 text-xs text-[#6B6A64]">
                          {/* Variação / Modelo */}
                          {item.variacaoSelecionada && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#9B998F]">Modelo:</span>
                              <span className="text-[#272727]">
                                {item.variacaoSelecionada.nome}
                              </span>
                            </div>
                          )}

                          {/* Cor Selecionada com Swatch */}
                          {item.cor && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[#9B998F]">Cor / Acabamento:</span>
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-[#D6D3CC] inline-block shrink-0"
                                style={{
                                  backgroundColor:
                                    item.variacaoSelecionada?.cor ||
                                    (item.cor.toLowerCase().includes("ouro")
                                      ? "#D4AF37"
                                      : item.cor.toLowerCase().includes("prata")
                                      ? "#C0C0C0"
                                      : item.cor.toLowerCase().includes("rose")
                                      ? "#B76E79"
                                      : item.cor.toLowerCase().includes("preto")
                                      ? "#272727"
                                      : item.cor.toLowerCase().includes("branco")
                                      ? "#FFFFFF"
                                      : "#6B6A64"),
                                }}
                              />
                              <span className="text-[#272727]">{item.cor}</span>
                            </div>
                          )}

                          {/* Texto Curto Gravado */}
                          {item.textoCurto && (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-[#9B998F]">Texto gravado:</span>
                              <span className="text-[#272727] italic">
                                “{item.textoCurto}”
                              </span>
                            </div>
                          )}

                          {/* Mensagem de presente adicional, se houver */}
                          {item.customGiftMessage &&
                            !item.customGiftMessage.startsWith("Texto gravado:") &&
                            item.customGiftMessage !== item.textoCurto && (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[#9B998F]">Cartão:</span>
                                <span className="text-[#272727] italic">
                                  “{item.customGiftMessage}”
                                </span>
                              </div>
                            )}

                          {/* Lembrete discreto de envio de arquivos na conta */}
                          {isPersonalizavel && (
                            <div className="pt-1 flex items-start gap-1.5 text-[11px] text-[#004AAD]">
                              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="leading-snug">
                                Após a confirmação da compra, envie seus arquivos e fotos em Minha Conta → Meus Pedidos.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Linha Inferior: Controles de Quantidade e Preço */}
                      <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#D6D3CC]/60">
                        {/* Seletor de Quantidade Inline */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#6B6A64]">Qtd:</span>
                          <div className="flex items-center border border-[#D6D3CC] rounded bg-white overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.cartLineId, item.quantidade - 1)
                              }
                              className="p-1.5 text-[#272727] hover:bg-[#EEEDE8] transition-colors"
                              aria-label="Diminuir quantidade"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-medium text-[#272727] tabular-nums min-w-[28px] text-center">
                              {item.quantidade}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(item.cartLineId, item.quantidade + 1)
                              }
                              className="p-1.5 text-[#272727] hover:bg-[#EEEDE8] transition-colors"
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Preço Unitário e Subtotal da Linha */}
                        <div className="text-right">
                          <div className="text-[11px] text-[#6B6A64] tabular-nums">
                            {item.quantidade > 1 && (
                              <span>
                                {item.quantidade}x R$ {item.precoUnitario.toFixed(2)} ={" "}
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-medium text-[#272727] tabular-nums">
                            R$ {itemSubtotal.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Ações de Continuidade abaixo da lista */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onNavigateCatalog}
                  className="text-xs text-[#004AAD] hover:underline font-medium flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Continuar comprando</span>
                </button>
                <button
                  type="button"
                  onClick={onNavigateHome}
                  className="text-xs text-[#6B6A64] hover:text-[#272727]"
                >
                  Ir para a Home
                </button>
              </div>
            </div>

            {/* COLUNA DIREITA: RESUMO DO PEDIDO (5 colunas, sticky no desktop) */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24">
              <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-lg p-5 sm:p-6 space-y-5">
                <h2 className="text-base font-medium text-[#272727] pb-3 border-b border-[#D6D3CC]">
                  Resumo do pedido
                </h2>

                {/* Discriminação de Valores */}
                <div className="space-y-2.5 text-xs text-[#6B6A64]">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between">
                    <span>Subtotal ({itemCount} {itemCount === 1 ? "item" : "itens"})</span>
                    <span className="text-[#272727] font-medium tabular-nums">
                      R$ {subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Frete */}
                  <div className="flex items-center justify-between">
                    <span>Frete</span>
                    <span className="text-[#6B6A64] italic">
                      Calculado no checkout
                    </span>
                  </div>
                </div>

                {/* Divisória hairline */}
                <div className="border-t border-[#D6D3CC] pt-4 space-y-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-[#272727]">
                      Total estimado
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-medium text-[#272727] tabular-nums">
                        R$ {subtotal.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-[#6B6A64] block mt-0.5">
                        ou até {BRAND_CONFIG.maxInstallmentsWithoutInterest}x de R${" "}
                        {(subtotal / (BRAND_CONFIG.maxInstallmentsWithoutInterest || 10)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#9B998F] pt-1">
                    * O frete final e eventuais cupons serão selecionados na etapa de checkout.
                  </p>
                </div>

                {/* Aviso condicional para itens personalizáveis */}
                {hasPersonalizavelItems && (
                  <div className="p-3 bg-[#EEEDE8] border border-[#D6D3CC] rounded text-xs text-[#272727] flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#004AAD] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-[#272727]">
                      <strong>Envio de fotos e arquivos:</strong> Após a confirmação da compra, envie seus arquivos e fotos em Minha Conta → Meus Pedidos.
                    </p>
                  </div>
                )}

                {/* Botão Primário: Ir para o Checkout */}
                <button
                  type="button"
                  id="cart-checkout-cta-btn"
                  onClick={onNavigateCheckout}
                  className="w-full py-3.5 px-4 bg-[#004AAD] hover:bg-[#003882] text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-none"
                >
                  <span>Ir para o checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Link secundário */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={onNavigateCatalog}
                    className="text-xs text-[#004AAD] hover:underline font-medium"
                  >
                    Continuar comprando outros presentes
                  </button>
                </div>
              </div>

              {/* Selos de Confiança e Garantia */}
              <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-lg p-4 grid grid-cols-2 gap-3 text-xs text-[#6B6A64]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#004AAD] shrink-0" />
                  <span className="text-[11px]">Compra 100% segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#004AAD] shrink-0" />
                  <span className="text-[11px]">Envio rastreado</span>
                </div>
                <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-[#D6D3CC]/50">
                  <MessageCircle className="w-4 h-4 text-[#004AAD] shrink-0" />
                  <span className="text-[11px]">Suporte humanizado no WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BARRA FIXA INFERIOR NO MOBILE QUANDO HOUVER ITENS */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F4F3EF] border-t border-[#D6D3CC] p-3 sm:p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-[#6B6A64] block leading-none">
                Total estimado
              </span>
              <span className="text-base font-medium text-[#272727] tabular-nums">
                R$ {subtotal.toFixed(2)}
              </span>
            </div>

            <button
              type="button"
              id="mobile-cart-checkout-btn"
              onClick={onNavigateCheckout}
              className="flex-1 max-w-[200px] py-2.5 px-4 bg-[#004AAD] hover:bg-[#003882] text-white text-xs sm:text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Ir para checkout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
