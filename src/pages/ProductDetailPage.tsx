import React, { useState, useEffect, useMemo } from "react";
import { getProductBySlug, getRelatedProducts, PRODUCTS } from "../data/products";
import { Product, ProductVariant, ShippingOption } from "../types";
import { ProductCard } from "../components/common/ProductCard";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useToast } from "../context/ToastContext";
import { BRAND_CONFIG } from "../config/brand";
import { calculateShipping, getStoreProductBySlugOrId } from "../services/api";
import { trackEcommerceEvent } from "../services/marketing";
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  Check,
  Sparkles,
  Share2,
  ChevronRight,
  Sliders,
  CreditCard,
  Plus,
  Minus,
  MessageCircle,
  CheckCircle2,
  PackageCheck,
  FileText,
  Info,
  Layers,
  Clock,
  Lock,
} from "lucide-react";

interface ProductDetailPageProps {
  slug: string;
  onNavigateProduct: (slug: string) => void;
  onNavigateCheckout: () => void;
  onNavigateCatalog: (category?: any) => void;
  onQuickView: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  slug,
  onNavigateProduct,
  onNavigateCheckout,
  onNavigateCatalog,
  onQuickView,
}) => {
  const [product, setProduct] = useState<Product | undefined>(() => getProductBySlug(slug));
  const [isLoadingProduct, setIsLoadingProduct] = useState(!product);

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { showToast } = useToast();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "reviews">("desc");

  // Shipping Calculator State
  const [cepInput, setCepInput] = useState("");
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingResults, setShippingResults] = useState<ShippingOption[] | null>(null);
  const [shippingLocation, setShippingLocation] = useState<string | null>(null);

  // Fetch product from Firestore / Fallback if not immediately found
  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      setIsLoadingProduct(true);
      const found = await getStoreProductBySlugOrId(slug);
      if (isMounted) {
        setProduct(found);
        setIsLoadingProduct(false);
      }
    }
    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Set default variant & color when product loads
  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        const initialVar = product.variants[0];
        setSelectedVariant(initialVar);
        setSelectedColor(initialVar.colorHex || initialVar.name || null);
      } else {
        setSelectedVariant(undefined);
        setSelectedColor(null);
      }
      setActiveImageIndex(0);
      setCustomText("");
      setQuantity(1);

      trackEcommerceEvent("view_item", {
        productId: product.id,
        productName: product.name,
        category: product.categoryName || product.category,
        price: product.promotionalPrice ?? product.price,
      });
    }
  }, [product?.id]);

  // Determine product nature: 'personalizavel' | 'licenciado' | 'simples'
  const productNature: "personalizavel" | "licenciado" = useMemo(() => {
    if (!product) return "personalizavel";
    if (product.productType === "licenciado") return "licenciado";
    if (product.productType === "personalizavel") return "personalizavel";
    if (
      product.customizationOptions?.allowName ||
      product.customizationOptions?.allowPhoto ||
      product.customizationOptions?.allowMessage ||
      product.isKit ||
      product.category === "kits-presenteaveis" ||
      product.name.toLowerCase().includes("personaliz") ||
      product.name.toLowerCase().includes("foto")
    ) {
      return "personalizavel";
    }
    return "licenciado";
  }, [product]);

  if (isLoadingProduct) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white">
        <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mb-4" />
        <p className="text-xs text-stone-600 font-medium">Carregando detalhes do presente...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 bg-white">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Produto não encontrado</h2>
        <p className="text-xs text-stone-600 mb-6 max-w-sm">
          O presente que você procura pode ter sido movido ou não está mais disponível no momento.
        </p>
        <button
          onClick={() => onNavigateCatalog()}
          className="px-6 py-2.5 bg-stone-950 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Explorar Outros Presentes
        </button>
      </div>
    );
  }

  const isFav = isFavorite(product.id);

  // Price calculations with variant modifier
  const priceModifier = selectedVariant?.priceModifier || 0;
  const basePrice = (product.promotionalPrice ?? product.price) + priceModifier;
  const currentPrice = basePrice;
  const originalPrice = product.price + priceModifier;
  const hasDiscount = !!product.promotionalPrice && product.promotionalPrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - (product.promotionalPrice || 0)) / product.price) * 100)
    : 0;

  const pixPrice = currentPrice * (1 - BRAND_CONFIG.pixDiscountPercentage / 100);
  const installmentCount = product.installments || 6;
  const installmentValue = currentPrice / installmentCount;

  // Check if variants have varying prices
  const hasMultiplePriceVariants =
    product.variants && product.variants.some((v) => (v.priceModifier || 0) > 0);

  const relatedProducts = getRelatedProducts(product, 4);

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCep = cepInput.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      showToast("Digite um CEP válido com 8 dígitos.", "error");
      return;
    }

    setIsCalculatingShipping(true);
    try {
      const result = await calculateShipping(cleanCep, currentPrice * quantity);
      setShippingResults(result.options);
      if (result.locationLabel) {
        setShippingLocation(result.locationLabel);
      }
      showToast("Opções de entrega calculadas!", "success");
    } catch {
      showToast("Erro ao calcular frete.", "error");
    } finally {
      setIsCalculatingShipping(false);
    }
  };

  const handleAddToCart = () => {
    // 1. Build canonical item object requested in COMANDO 7
    const itemPayload = {
      productId: product.id,
      nome: product.name,
      precoUnitario: currentPrice,
      quantidade: quantity,
      natureza: productNature,
      variacaoSelecionada: selectedVariant
        ? {
            id: selectedVariant.id,
            nome: selectedVariant.name,
            cor: selectedVariant.colorHex || selectedColor,
            priceModifier: selectedVariant.priceModifier || 0,
          }
        : null,
      cor: selectedColor || selectedVariant?.name || null,
      textoCurto: customText.trim() || null,
      requerArquivo: productNature === "personalizavel",
    };

    console.log("[Storefront Glos] Objeto do item adicionado:", itemPayload);

    // 2. Add to cart context preserving all customization fields intact
    addToCart(product, quantity, selectedVariant, {
      wrap: false,
      message: customText.trim() ? `Texto gravado: "${customText.trim()}"` : undefined,
      cor: selectedColor || selectedVariant?.name || null,
      textoCurto: customText.trim() || null,
      natureza: productNature,
      precoUnitario: currentPrice,
      variacaoSelecionada: selectedVariant
        ? {
            id: selectedVariant.id,
            nome: selectedVariant.name,
            cor: selectedVariant.colorHex || selectedColor,
            priceModifier: selectedVariant.priceModifier || 0,
          }
        : null,
      requerArquivo: productNature === "personalizavel",
    });

    // 3. Track marketing event
    trackEcommerceEvent("add_to_cart", {
      productId: product.id,
      productName: product.name,
      category: product.categoryName || product.category,
      price: currentPrice,
      quantity,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    onNavigateCheckout();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${product.name} | ${BRAND_CONFIG.name}`,
        text: product.shortDescription,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link do produto copiado!", "success");
    }
  };

  // Active displayed image
  const displayImage =
    (selectedVariant?.image && activeImageIndex === 0 ? selectedVariant.image : null) ||
    product.images[activeImageIndex] ||
    product.images[0];

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 1. BREADCRUMB */}
        <nav
          aria-label="Navegação estrutural"
          className="flex items-center gap-2 text-xs text-stone-600 mb-6 overflow-x-auto whitespace-nowrap pb-1"
        >
          <button
            type="button"
            onClick={() => onNavigateCatalog()}
            className="hover:text-stone-900 transition-colors focus:outline-none"
          >
            Início
          </button>
          <span className="text-stone-300">/</span>
          <button
            type="button"
            onClick={() => onNavigateCatalog(product.category)}
            className="hover:text-stone-900 capitalize transition-colors focus:outline-none"
          >
            {product.categoryName}
          </button>
          <span className="text-stone-300">/</span>
          <span className="text-stone-900 font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* 2. BLOCO PRINCIPAL (2 COLUNAS NO DESKTOP, EMPILHADO NO MOBILE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* COLUNA A — GALERIA & PRÉVIA AO VIVO (5 ou 6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Imagem Principal com Prévia ao Vivo */}
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-100/70 border border-stone-200/80 group">
              <img
                src={displayImage}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-300"
              />

              {/* CAMADA DE PRÉVIA AO VIVO (RENDERIZAÇÃO SOBRE A FOTO BASE) */}
              {productNature === "personalizavel" && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                  {/* Selo superior de Prévia */}
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-stone-900/85 text-white backdrop-blur-xs shadow-xs">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Prévia em Tempo Real</span>
                    </span>
                    {hasDiscount && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white shadow-xs">
                        -{discountPercentage}%
                      </span>
                    )}
                  </div>

                  {/* Visual Overlay de Texto/Personalização no Produto */}
                  <div className="w-full max-w-[280px] sm:max-w-xs flex flex-col items-center justify-center text-center transition-all duration-300">
                    <div
                      className={`px-4 py-2.5 rounded-xl transition-all duration-300 backdrop-blur-xs border ${
                        customText.trim()
                          ? "bg-stone-950/75 text-white border-white/20 shadow-lg scale-100"
                          : "bg-white/70 text-stone-600 border-dashed border-stone-400/80 scale-95 opacity-80"
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-widest font-semibold opacity-75 mb-0.5">
                        {customText.trim() ? "Personalização" : "Sua Frase / Nome Aqui"}
                      </p>
                      <p
                        className="text-sm sm:text-base font-semibold tracking-wide font-sans break-words line-clamp-2"
                        style={{
                          color: selectedColor && selectedColor !== "#f8fafc" ? selectedColor : undefined,
                        }}
                      >
                        {customText.trim() ? customText : "Digite abaixo para ver ao vivo"}
                      </p>
                      {selectedVariant && (
                        <p className="text-[10px] text-stone-300 mt-1 font-mono">
                          {selectedVariant.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Badges para produtos licenciados */}
              {productNature === "licenciado" && (
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-800 text-white shadow-xs">
                    <Check className="w-3 h-3" />
                    <span>Pronto pra enviar</span>
                  </span>
                  {hasDiscount && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-600 text-white shadow-xs">
                      -{discountPercentage}%
                    </span>
                  )}
                </div>
              )}

              {/* Botão de Favoritar Flutuante */}
              <button
                type="button"
                onClick={() => toggleFavorite(product)}
                className={`absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isFav
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 border border-stone-200/80"
                }`}
                title={isFav ? "Remover dos favoritos" : "Salvar nos favoritos"}
              >
                <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Legenda Obrigatória Discreta para Personalizáveis */}
            {productNature === "personalizavel" && (
              <p className="text-center text-xs text-stone-500 italic">
                Prévia ilustrativa. A arte final é finalizada com você pelo WhatsApp.
              </p>
            )}

            {/* Fileira de Thumbnails Clicáveis */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx
                        ? "border-[#004AAD] ring-2 ring-[#004AAD]/20"
                        : "border-stone-200 hover:border-stone-400 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Bloco de Confiança & Garantias Rápidas */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-stone-800 mb-1" />
                <span className="font-semibold text-stone-900">Garantia glos.</span>
                <span className="text-[11px] text-stone-500">
                  {product.specifications.warranty || "90 dias"}
                </span>
              </div>
              <div className="flex flex-col items-center border-x border-stone-200 px-2">
                <Truck className="w-5 h-5 text-stone-800 mb-1" />
                <span className="font-semibold text-stone-900">Envio Seguro</span>
                <span className="text-[11px] text-stone-500">Com rastreamento</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="w-5 h-5 text-stone-800 mb-1" />
                <span className="font-semibold text-stone-900">Troca Fácil</span>
                <span className="text-[11px] text-stone-500">7 dias garantidos</span>
              </div>
            </div>
          </div>

          {/* COLUNA B — COMPRA & PERSONALIZAÇÃO (6 ou 7 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Topo do Bloco de Compra: Categoria, Selo e Título */}
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-stone-500 mb-2">
                <span className="font-medium text-[#004AAD] uppercase tracking-wider">
                  {product.categoryName}
                </span>
                <span className="font-mono text-stone-600">SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-stone-950 leading-tight">
                {product.name}
              </h1>

              {/* Avaliações & Selo de Natureza */}
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {/* Selo de Natureza Obrigatório */}
                {productNature === "personalizavel" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#004AAD]/10 text-[#004AAD] border border-[#004AAD]/20">
                    <Sparkles className="w-3.5 h-3.5 text-[#004AAD]" />
                    Personalizável
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    Pronto pra enviar
                  </span>
                )}

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1.5 text-xs text-stone-600">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="font-semibold text-stone-900">{product.rating.toFixed(1)}</span>
                    <span className="text-stone-500">
                      ({product.reviewCount || 24} avaliações)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Preços com tabular-nums e condições de pagamento */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
              <div className="flex items-baseline gap-2.5">
                {productNature === "personalizavel" && hasMultiplePriceVariants && (
                  <span className="text-xs font-medium text-stone-500">A partir de</span>
                )}
                <span className="text-2xl sm:text-3xl font-bold text-stone-950 tabular-nums">
                  R$ {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-stone-600 line-through tabular-nums">
                    R$ {originalPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              <div className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <span>
                  R$ {pixPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no Pix ({BRAND_CONFIG.pixDiscountPercentage}% de desconto)
                </span>
              </div>

              <div className="text-xs text-stone-600">
                ou <span className="font-medium text-stone-900">{installmentCount}x</span> de{" "}
                <span className="font-semibold text-stone-900 tabular-nums">
                  R$ {installmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>{" "}
                sem juros no cartão
              </div>
            </div>

            {/* SE PERSONALIZÁVEL: PAINEL DE PERSONALIZAÇÃO LEVE */}
            {productNature === "personalizavel" && (
              <div className="p-5 bg-white rounded-2xl border border-stone-200/90 shadow-xs space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
                  <Sliders className="w-4 h-4 text-[#004AAD]" />
                  <h2 className="text-sm font-bold text-stone-950">
                    Personalize seu presente
                  </h2>
                </div>

                {/* 1. Variação de Modelo / Acabamento */}
                {product.variants && product.variants.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-2">
                      1. Escolha a Variação / Modelo:{" "}
                      <span className="font-semibold text-stone-950">{selectedVariant?.name}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => {
                        const isSelected = selectedVariant?.id === variant.id;
                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariant(variant);
                              if (variant.colorHex) {
                                setSelectedColor(variant.colorHex);
                              }
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                              isSelected
                                ? "border-[#004AAD] bg-[#004AAD]/5 text-[#004AAD] ring-1 ring-[#004AAD]"
                                : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800"
                            }`}
                          >
                            {variant.colorHex && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                                style={{ backgroundColor: variant.colorHex }}
                              />
                            )}
                            <span>{variant.name}</span>
                            {variant.priceModifier && variant.priceModifier > 0 ? (
                              <span className="text-[10px] text-stone-500 font-mono">
                                (+R$ {variant.priceModifier.toFixed(2)})
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Cores (quando aplicável) */}
                {product.variants && product.variants.some((v) => v.colorHex) && (
                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-2">
                      2. Cor / Tom da gravação:{" "}
                      <span className="font-semibold text-stone-950">
                        {selectedVariant?.name || "Padrão"}
                      </span>
                    </label>
                    <div className="flex items-center gap-2.5">
                      {product.variants
                        .filter((v) => v.colorHex)
                        .map((v) => {
                          const isSelected = selectedVariant?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                setSelectedVariant(v);
                                setSelectedColor(v.colorHex || null);
                              }}
                              className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center ${
                                isSelected
                                  ? "ring-2 ring-stone-950 ring-offset-2 scale-110"
                                  : "border-stone-300 hover:scale-105"
                              }`}
                              style={{ backgroundColor: v.colorHex }}
                              title={v.name}
                            >
                              {isSelected && (
                                <Check
                                  className={`w-3.5 h-3.5 ${
                                    v.colorHex === "#f8fafc" || v.colorHex === "#ffffff"
                                      ? "text-stone-900"
                                      : "text-white"
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* 3. Campo de Texto Curto com Contador (0/24) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="custom-text-input"
                      className="text-xs font-medium text-stone-700"
                    >
                      3. Texto ou Nome para gravação:
                    </label>
                    <span className="text-[11px] font-mono text-stone-500">
                      {customText.length}/24
                    </span>
                  </div>
                  <input
                    id="custom-text-input"
                    type="text"
                    maxLength={24}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Ex: Carlos & Marina • 2024"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-300 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-950 focus:bg-white transition-all"
                  />
                  <p className="text-[11px] text-stone-500 mt-1">
                    Digite o nome ou frase curta para ver a prévia ao vivo na foto ao lado.
                  </p>
                </div>

                {/* Aviso Obrigatório de Arquivo Pesado (WhatsApp) */}
                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-start gap-3 text-xs text-emerald-950">
                  <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <MessageCircle className="w-4 h-4 fill-current" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-900">
                      Tem foto, vídeo ou áudio pra colocar?
                    </h4>
                    <p className="text-emerald-800 text-[11px] leading-relaxed mt-0.5">
                      Sem problema — depois da compra a gente finaliza sua arte pelo WhatsApp, sem
                      travar aqui. Você aprova o mockup oficial antes de produzirmos!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SE LICENCIADO: ESCOLHA DE VARIAÇÃO SIMPLES (SE HOUVER) */}
            {productNature === "licenciado" && product.variants && product.variants.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-stone-700">
                  Opções disponíveis:{" "}
                  <span className="font-semibold text-stone-950">{selectedVariant?.name}</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => {
                    const isSelected = selectedVariant?.id === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariant(v)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                          isSelected
                            ? "border-stone-950 bg-stone-950 text-white"
                            : "border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800"
                        }`}
                      >
                        {v.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SELETOR DE QUANTIDADE & BOTÕES DE AÇÃO */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:text-stone-950 disabled:opacity-30 transition-colors"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center text-xs font-semibold text-stone-950 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock || 50, q + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-stone-500">
                  <span className="font-medium text-emerald-700">Em estoque</span> (
                  {product.stock || 20} unidades)
                </div>
              </div>

              {/* Botões CTA de Compra */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  id="pdp-add-to-cart-button"
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3.5 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Adicionar ao Carrinho</span>
                </button>

                <button
                  id="pdp-buy-now-button"
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-4 rounded-xl border border-stone-300 hover:border-stone-950 bg-white text-stone-900 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Comprar Agora</span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs text-stone-500">
                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 hover:text-stone-900 transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar este presente</span>
                </button>
                <span className="flex items-center gap-1 text-stone-600">
                  <Lock className="w-3 h-3 text-stone-400" />
                  Compra 100% Segura
                </span>
              </div>
            </div>

            {/* SIMULADOR DE FRETE (CEP) */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-900">
                <Truck className="w-4 h-4 text-stone-700" />
                <span>Simular Prazo & Frete:</span>
              </div>

              <form onSubmit={handleCalculateShipping} className="flex gap-2">
                <input
                  type="text"
                  maxLength={9}
                  value={cepInput}
                  onChange={(e) => setCepInput(e.target.value)}
                  placeholder="00000-000"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-stone-950"
                />
                <button
                  type="submit"
                  disabled={isCalculatingShipping}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-900 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isCalculatingShipping ? "Calculando..." : "Calcular"}
                </button>
              </form>

              {shippingResults && (
                <div className="space-y-1.5 pt-1 border-t border-stone-200 text-xs">
                  {shippingLocation && (
                    <p className="text-[11px] text-stone-500 font-medium">
                      Entrega para: {shippingLocation}
                    </p>
                  )}
                  {shippingResults.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between py-1 border-b border-stone-100 last:border-none"
                    >
                      <span className="text-stone-700">
                        {opt.name} ({opt.deadline})
                      </span>
                      <span className="font-semibold text-stone-900 tabular-nums">
                        {opt.price === 0 ? (
                          <span className="text-emerald-700 font-bold">Grátis</span>
                        ) : (
                          `R$ ${opt.price.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BLOCO DE CONFIANÇA RÁPIDO */}
            <div className="pt-2 border-t border-stone-200/80 space-y-1.5 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>
                  {productNature === "personalizavel"
                    ? "Prazo de produção rápida: 2 a 3 dias úteis após aprovação da arte."
                    : "Envio imediato: postagem em até 24 horas úteis."}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span>Pagamento facilitado via Mercado Pago com proteção ao comprador.</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. COMO FUNCIONA A PERSONALIZAÇÃO (APENAS PARA PRODUTOS PERSONALIZÁVEIS) */}
        {productNature === "personalizavel" && (
          <section className="mt-14 pt-10 border-t border-stone-200">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-xs font-semibold text-[#004AAD] uppercase tracking-wider">
                Passo a Passo Simples
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-950 mt-1">
                Como funciona a personalização?
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Sem complicação: você garante seu presente agora e nós cuidamos de cada detalhe com
                você pelo WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Passo 1 */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-900 mb-3 shadow-xs">
                    <Sliders className="w-5 h-5 text-[#004AAD]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#004AAD] uppercase tracking-wider">
                    Passo 1
                  </span>
                  <h3 className="text-sm font-bold text-stone-900 mt-0.5 mb-1.5">
                    1. Escolha o básico aqui
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Selecione a variação, cor e digite o texto curto na página do produto.
                  </p>
                </div>
              </div>

              {/* Passo 2 */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-900 mb-3 shadow-xs">
                    <MessageCircle className="w-5 h-5 text-emerald-700" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Passo 2
                  </span>
                  <h3 className="text-sm font-bold text-stone-900 mt-0.5 mb-1.5">
                    2. Envie sua foto pelo WhatsApp
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Após a compra, nossa equipe te chama para receber foto, vídeo ou áudio em alta
                    resolução.
                  </p>
                </div>
              </div>

              {/* Passo 3 */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-900 mb-3 shadow-xs">
                    <CheckCircle2 className="w-5 h-5 text-[#004AAD]" />
                  </div>
                  <span className="text-[11px] font-bold text-[#004AAD] uppercase tracking-wider">
                    Passo 3
                  </span>
                  <h3 className="text-sm font-bold text-stone-900 mt-0.5 mb-1.5">
                    3. Aprove o Mockup Final
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Você confere a prévia digital final com o design ajustado antes de mandarmos para
                    produção.
                  </p>
                </div>
              </div>

              {/* Passo 4 */}
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-col justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-900 mb-3 shadow-xs">
                    <PackageCheck className="w-5 h-5 text-stone-900" />
                  </div>
                  <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                    Passo 4
                  </span>
                  <h3 className="text-sm font-bold text-stone-900 mt-0.5 mb-1.5">
                    4. Produção e Envio
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Produzimos seu presente com todo o carinho, embalamos para presente e enviamos
                    com rastreio.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 4. DESCRIÇÃO E ESPECIFICAÇÕES TÉCNICAS */}
        <section className="mt-14 pt-10 border-t border-stone-200">
          {/* Navegação por Abas */}
          <div className="flex items-center gap-4 border-b border-stone-200 mb-6 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("desc")}
              className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "desc"
                  ? "border-[#004AAD] text-[#004AAD]"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Descrição do Presente
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("specs")}
              className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "specs"
                  ? "border-[#004AAD] text-[#004AAD]"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Ficha Técnica & Especificações
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reviews")}
              className={`pb-3 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "reviews"
                  ? "border-[#004AAD] text-[#004AAD]"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              Avaliações de Clientes ({product.reviewCount || 24})
            </button>
          </div>

          {/* Conteúdo da Aba Ativa */}
          <div className="max-w-4xl">
            {activeTab === "desc" && (
              <div className="space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
                <p className="font-medium text-stone-900 text-sm sm:text-base">
                  {product.shortDescription}
                </p>
                <p>{product.description}</p>

                {product.kitItems && product.kitItems.length > 0 && (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 mt-4 space-y-2">
                    <h4 className="font-bold text-stone-950 text-xs sm:text-sm">
                      Itens inclusos neste kit especial:
                    </h4>
                    <ul className="space-y-1.5">
                      {product.kitItems.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-stone-700">
                          <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.specifications.careInstructions && (
                  <div className="pt-2">
                    <h4 className="font-semibold text-stone-900 text-xs mb-1">
                      Cuidados recomendados:
                    </h4>
                    <p className="text-xs text-stone-600">
                      {product.specifications.careInstructions}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "specs" && (
              <div className="rounded-2xl border border-stone-200/80 overflow-hidden bg-stone-50/50">
                <table className="w-full text-left text-xs border-collapse">
                  <tbody>
                    {product.specifications.material && (
                      <tr className="border-b border-stone-200/60">
                        <th className="py-3 px-4 font-semibold text-stone-900 bg-stone-100/60 w-1/3">
                          Material
                        </th>
                        <td className="py-3 px-4 text-stone-700">
                          {product.specifications.material}
                        </td>
                      </tr>
                    )}
                    {product.specifications.dimensions && (
                      <tr className="border-b border-stone-200/60">
                        <th className="py-3 px-4 font-semibold text-stone-900 bg-stone-100/60">
                          Dimensões
                        </th>
                        <td className="py-3 px-4 text-stone-700">
                          {product.specifications.dimensions}
                        </td>
                      </tr>
                    )}
                    {product.specifications.weight && (
                      <tr className="border-b border-stone-200/60">
                        <th className="py-3 px-4 font-semibold text-stone-900 bg-stone-100/60">
                          Peso Aproximado
                        </th>
                        <td className="py-3 px-4 text-stone-700">
                          {product.specifications.weight}
                        </td>
                      </tr>
                    )}
                    {product.specifications.packageContents && (
                      <tr className="border-b border-stone-200/60">
                        <th className="py-3 px-4 font-semibold text-stone-900 bg-stone-100/60">
                          Conteúdo da Embalagem
                        </th>
                        <td className="py-3 px-4 text-stone-700">
                          {product.specifications.packageContents}
                        </td>
                      </tr>
                    )}
                    {product.specifications.warranty && (
                      <tr className="border-b border-stone-200/60">
                        <th className="py-3 px-4 font-semibold text-stone-900 bg-stone-100/60">
                          Garantia
                        </th>
                        <td className="py-3 px-4 text-stone-700">
                          {product.specifications.warranty}
                        </td>
                      </tr>
                    )}
                    {product.sku && (
                      <tr>
                        <th className="py-3 px-4 font-semibold text-stone-900 bg-stone-100/60">
                          Código SKU
                        </th>
                        <td className="py-3 px-4 text-stone-700 font-mono">{product.sku}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center gap-4">
                  <div className="text-3xl font-bold text-stone-950 tabular-nums">
                    {product.rating ? product.rating.toFixed(1) : "5.0"}
                  </div>
                  <div>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Baseado em {product.reviewCount || 24} avaliações verificadas de clientes
                    </p>
                  </div>
                </div>

                {/* Lista de Avaliações Modelo */}
                <div className="space-y-3">
                  <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900">Mariana Costa</span>
                      <span className="text-stone-500">Há 3 dias • Compra verificada</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-stone-700 pt-1">
                      "Fiquei emocionada quando chegou! A gravação ficou super nítida e o atendimento
                      pelo WhatsApp foi muito gentil e rápido para aprovar a arte. Recomendo demais!"
                    </p>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-stone-200/70 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-900">Lucas Silveira</span>
                      <span className="text-stone-500">Há 1 semana • Compra verificada</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-stone-700 pt-1">
                      "Acabamento impecável e embalagem para presente muito bonita. Chegou antes do
                      prazo previsto."
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 5. "COMPLETE O PRESENTE" / PRODUTOS RELACIONADOS */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-stone-200">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-xs font-bold tracking-wider text-[#004AAD] uppercase">
                  Sugestões da Curadoria
                </span>
                <h2 className="text-2xl font-bold text-stone-950 mt-1">
                  Complete o Presente
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigateCatalog(product.category)}
                className="text-xs font-bold text-stone-900 hover:text-stone-600 flex items-center gap-1 transition-colors"
              >
                <span>Ver mais em {product.categoryName}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {relatedProducts.map((relProduct) => (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  onQuickView={onQuickView}
                  onNavigateToProduct={onNavigateProduct}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
