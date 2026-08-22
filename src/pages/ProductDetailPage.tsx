import React, { useState } from "react";
import { getProductBySlug, getRelatedProducts, PRODUCTS } from "../data/products";
import { Product, ProductVariant, ShippingOption } from "../types";
import { ProductCard } from "../components/common/ProductCard";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../../src/context/FavoritesContext";
import { useToast } from "../context/ToastContext";
import { BRAND_CONFIG } from "../config/brand";
import { calculateShipping } from "../services/api";
import { trackEcommerceEvent } from "../services/marketing";
import {
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
  Check,
  Gift,
  Sparkles,
  Share2,
  ChevronRight,
  ZoomIn,
  Package,
  Cpu,
  Sliders,
  CreditCard,
  Plus,
  MapPin,
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
  const product = getProductBySlug(slug);
  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { showToast } = useToast();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product?.variants && product.variants.length > 0 ? product.variants[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "shipping" | "warranty">("desc");
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  // Shipping Calculator State
  const [cepInput, setCepInput] = useState("");
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingResults, setShippingResults] = useState<ShippingOption[] | null>(null);
  const [shippingLocation, setShippingLocation] = useState<string | null>(null);

  // Compre Junto Bundle Add-on State
  const [bundleChecked, setBundleChecked] = useState(true);

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Produto não encontrado</h2>
        <p className="text-xs text-stone-600 mb-6">
          O produto que você procura pode ter sido movido ou não está mais disponível.
        </p>
        <button
          onClick={() => onNavigateCatalog()}
          className="px-6 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-semibold"
        >
          Voltar ao Catálogo
        </button>
      </div>
    );
  }

  const isFav = isFavorite(product.id);
  const currentPrice = product.promotionalPrice ?? product.price;
  const hasDiscount = !!product.promotionalPrice && product.promotionalPrice < product.price;
  const pixPrice = currentPrice * (1 - BRAND_CONFIG.pixDiscountPercentage / 100);
  const installmentValue = currentPrice / (product.installments || 1);

  const relatedProducts = getRelatedProducts(product, 4);

  // Bundle cross-sell product
  const bundleAddonProduct = PRODUCTS.find(
    (p) => p.id !== product.id && (p.category === "copos-garrafas" || p.category === "organizacao")
  ) || PRODUCTS[0];

  const bundleAddonPrice = bundleAddonProduct.promotionalPrice ?? bundleAddonProduct.price;
  const bundleCombinedTotal = (currentPrice + (bundleChecked ? bundleAddonPrice : 0)) * 0.95; // 5% bundle discount

  // Track ViewContent / view_item on mount
  React.useEffect(() => {
    if (product) {
      trackEcommerceEvent("view_item", {
        productId: product.id,
        productName: product.name,
        category: product.categoryName || product.category,
        price: currentPrice,
      });
    }
  }, [product?.id]);

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
    addToCart(product, quantity, selectedVariant, {
      wrap: giftWrap,
      message: giftMessage,
    });
    trackEcommerceEvent("add_to_cart", {
      productId: product.id,
      productName: product.name,
      category: product.categoryName || product.category,
      price: currentPrice,
      quantity,
    });
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariant, {
      wrap: giftWrap,
      message: giftMessage,
    });
    trackEcommerceEvent("add_to_cart", {
      productId: product.id,
      productName: product.name,
      category: product.categoryName || product.category,
      price: currentPrice,
      quantity,
    });
    onNavigateCheckout();
  };

  const handleBuyBundle = () => {
    addToCart(product, 1, selectedVariant);
    if (bundleChecked && bundleAddonProduct) {
      addToCart(bundleAddonProduct, 1);
    }
    onNavigateCheckout();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.shortDescription,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("Link do produto copiado!", "success");
    }
  };

  return (
    <div className="bg-white min-h-screen py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-stone-500 mb-6 overflow-x-auto whitespace-nowrap pb-1">
          <button onClick={() => onNavigateCatalog()} className="hover:text-stone-900">
            Início
          </button>
          <span>/</span>
          <button
            onClick={() => onNavigateCatalog(product.category)}
            className="hover:text-stone-900 capitalize"
          >
            {product.categoryName}
          </button>
          <span>/</span>
          <span className="font-semibold text-stone-950 truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Container (Gallery + Info) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT: IMAGE GALLERY (5 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-stone-50 border border-stone-200">
              <img
                src={product.images[activeImageIndex] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />

              {hasDiscount && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                  Economize R$ {(product.price - (product.promotionalPrice || 0)).toFixed(2)}
                </div>
              )}

              <button
                onClick={() => toggleFavorite(product)}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
                  isFav
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-white/90 hover:bg-white text-stone-700"
                }`}
                title="Favoritar produto"
              >
                <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Thumbnail Selectors */}
            {product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx
                        ? "border-stone-950 ring-2 ring-stone-950/20"
                        : "border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Guarantees Box */}
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="flex flex-col items-center">
                <ShieldCheck className="w-5 h-5 text-stone-800 mb-1" />
                <span className="font-bold text-stone-900">Garantia</span>
                <span className="text-[11px] text-stone-500">{product.specifications.warranty || "90 dias"}</span>
              </div>
              <div className="flex flex-col items-center border-x border-stone-200 px-2">
                <Truck className="w-5 h-5 text-stone-800 mb-1" />
                <span className="font-bold text-stone-900">Envio Seguro</span>
                <span className="text-[11px] text-stone-500">Rastreio nacional</span>
              </div>
              <div className="flex flex-col items-center">
                <RotateCcw className="w-5 h-5 text-stone-800 mb-1" />
                <span className="font-bold text-stone-900">Troca Fácil</span>
                <span className="text-[11px] text-stone-500">7 dias grátis</span>
              </div>
            </div>
          </div>

          {/* RIGHT: BUYING PANEL & INFORMATION (7 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                <span className="font-semibold text-amber-900 uppercase tracking-wider">
                  {product.categoryName}
                </span>
                <span className="font-mono">SKU: {product.sku}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-stone-950 leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-bold text-stone-900">{product.rating.toFixed(1)}</span>
                  <span className="text-stone-500">({product.reviewCount} avaliações reais de clientes)</span>
                </div>
              )}
            </div>

            {/* Price Box */}
            <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-stone-950">
                  R$ {currentPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-stone-500 line-through">
                    R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>

              <div className="mt-2 space-y-1">
                <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                  <span>R$ {pixPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} no Pix</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-md">
                    {BRAND_CONFIG.pixDiscountPercentage}% de desconto
                  </span>
                </p>
                <p className="text-xs text-stone-600 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-stone-500" />
                  <span>
                    ou até {product.installments}x de R${" "}
                    {installmentValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} sem juros no cartão
                  </span>
                </p>
              </div>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {product.shortDescription}
            </p>

            {/* Variants Selector */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-stone-900 mb-2">
                  Escolha o Modelo / Cor:{" "}
                  <span className="font-normal text-stone-600">{selectedVariant?.name}</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => {
                        setSelectedVariant(variant);
                        if (variant.image) {
                          const idx = product.images.indexOf(variant.image);
                          if (idx >= 0) setActiveImageIndex(idx);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all ${
                        selectedVariant?.id === variant.id
                          ? "bg-stone-950 text-white border-stone-950 shadow-xs"
                          : "bg-white text-stone-800 border-stone-300 hover:border-stone-400"
                      }`}
                    >
                      {variant.image ? (
                        <img
                          src={variant.image}
                          alt={variant.name}
                          className="w-4 h-4 rounded-full object-cover border border-stone-300 shrink-0"
                        />
                      ) : variant.colorHex ? (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                          style={{ backgroundColor: variant.colorHex }}
                        />
                      ) : null}
                      <span>{variant.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector & Stock Info */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-stone-300 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center text-sm font-bold text-stone-950">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="w-10 h-10 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold"
                >
                  +
                </button>
              </div>

              <div className="text-xs">
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Em estoque ({product.stock} unidades disponíveis)
                </span>
                <span className="text-stone-500">Pronta entrega para envio imediato</span>
              </div>
            </div>

            {/* Gift Wrap & Message Option */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="rounded border-amber-400 text-stone-900 focus:ring-stone-900 mt-0.5"
                />
                <div>
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5 text-amber-700" />
                    Adicionar Embalagem de Presente Premium (+R$ 14,90)
                  </span>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Caixa rígida preta fosca com laço de cetim e berço aveludado.
                  </p>
                </div>
              </label>

              <div>
                <label className="block text-[11px] font-bold text-amber-950 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  <span>Dedicatória no Cartão de Presente (Grátis):</span>
                </label>
                <textarea
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                  placeholder="Escreva aqui a mensagem que será impressa em papel nobre..."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-white placeholder-stone-400 text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                id="pdp-add-to-cart-btn"
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-stone-300"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Adicionar ao Carrinho</span>
              </button>

              <button
                id="pdp-buy-now-btn"
                type="button"
                onClick={handleBuyNow}
                className="w-full py-3.5 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center transition-all shadow-md hover:shadow-lg"
              >
                Comprar Agora
              </button>
            </div>

            {/* Shipping Calculator by CEP */}
            <div className="p-5 bg-white rounded-2xl border border-stone-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
                <Truck className="w-4 h-4 text-stone-700" />
                <span>Calcular Frete e Prazo de Entrega:</span>
              </div>

              <form onSubmit={handleCalculateShipping} className="flex gap-2">
                <input
                  type="text"
                  maxLength={9}
                  value={cepInput}
                  onChange={(e) => setCepInput(e.target.value)}
                  placeholder="Digite seu CEP (ex: 01310-100)"
                  className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-stone-900"
                />
                <button
                  type="submit"
                  disabled={isCalculatingShipping}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isCalculatingShipping ? "Calculando..." : "Calcular"}
                </button>
              </form>

              {shippingResults && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  {shippingLocation && (
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-700 pb-1">
                      <MapPin className="w-3 h-3 text-stone-900" />
                      <span>{shippingLocation}</span>
                    </div>
                  )}
                  {shippingResults.map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 text-xs border border-stone-200/80"
                    >
                      <div>
                        <span className="font-bold text-stone-900">{opt.name}</span>
                        <p className="text-[11px] text-stone-500">Prazo estimado: {opt.deadline}</p>
                      </div>
                      <span className="font-bold text-stone-950">
                        {opt.price === 0 ? (
                          <span className="text-emerald-700">Grátis</span>
                        ) : (
                          `R$ ${opt.price.toFixed(2)}`
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Share link */}
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleShare}
                className="text-xs text-stone-500 hover:text-stone-900 flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Compartilhar este produto</span>
              </button>
            </div>
          </div>
        </div>

        {/* "COMPRE JUNTO" (BUNDLE CROSS-SELL) */}
        <section className="mt-14 p-6 sm:p-8 bg-stone-50 rounded-3xl border border-stone-200">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg sm:text-xl font-bold text-stone-950">
              Compre Junto e Ganhe 5% OFF Extra
            </h3>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Products in bundle */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              {/* Product 1 */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-stone-200 max-w-xs shadow-2xs">
                <img
                  src={product.images[0]}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 line-clamp-1">{product.name}</h4>
                  <p className="text-xs font-bold text-stone-950 mt-0.5">
                    R$ {currentPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              <Plus className="w-5 h-5 text-stone-400 shrink-0" />

              {/* Product 2 (Addon) */}
              <label className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-stone-200 max-w-xs shadow-2xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={bundleChecked}
                  onChange={(e) => setBundleChecked(e.target.checked)}
                  className="rounded text-stone-950 focus:ring-stone-950"
                />
                <img
                  src={bundleAddonProduct.images[0]}
                  alt=""
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h4 className="text-xs font-bold text-stone-900 line-clamp-1">
                    {bundleAddonProduct.name}
                  </h4>
                  <p className="text-xs font-bold text-stone-950 mt-0.5">
                    R$ {bundleAddonPrice.toFixed(2)}
                  </p>
                </div>
              </label>
            </div>

            {/* Bundle Checkout Box */}
            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <div className="text-center sm:text-right">
                <span className="text-xs text-stone-500">Valor dos 2 produtos com 5% OFF:</span>
                <div className="text-xl font-black text-stone-950">
                  R$ {bundleCombinedTotal.toFixed(2)}
                </div>
              </div>
              <button
                type="button"
                onClick={handleBuyBundle}
                className="px-6 py-3 bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all shadow-md"
              >
                Comprar Combo Junto
              </button>
            </div>
          </div>
        </section>

        {/* TECHNICAL SPECIFICATIONS & TABS */}
        <section className="mt-14">
          <div className="border-b border-stone-200 flex gap-2 sm:gap-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("desc")}
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "desc"
                  ? "border-stone-950 text-stone-950"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              Descrição Completa
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "specs"
                  ? "border-stone-950 text-stone-950"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              Especificações Técnicas
            </button>
            <button
              onClick={() => setActiveTab("shipping")}
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "shipping"
                  ? "border-stone-950 text-stone-950"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              Envio e Prazos
            </button>
            <button
              onClick={() => setActiveTab("warranty")}
              className={`pb-3 text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === "warranty"
                  ? "border-stone-950 text-stone-950"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              Trocas & Devoluções
            </button>
          </div>

          <div className="py-8">
            {activeTab === "desc" && (
              <div className="max-w-3xl space-y-4 text-xs sm:text-sm text-stone-700 leading-relaxed">
                <p>{product.description}</p>
                {product.isKit && product.kitItems && (
                  <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                    <h4 className="font-bold text-stone-950 mb-2">Composição deste Kit:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-stone-700">
                      {product.kitItems.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "specs" && (
              <div className="max-w-2xl">
                <dl className="divide-y divide-stone-200 text-xs sm:text-sm">
                  {product.specifications.dimensions && (
                    <div className="py-2.5 grid grid-cols-3">
                      <dt className="font-bold text-stone-900">Dimensões</dt>
                      <dd className="col-span-2 text-stone-600">{product.specifications.dimensions}</dd>
                    </div>
                  )}
                  {product.specifications.weight && (
                    <div className="py-2.5 grid grid-cols-3">
                      <dt className="font-bold text-stone-900">Peso</dt>
                      <dd className="col-span-2 text-stone-600">{product.specifications.weight}</dd>
                    </div>
                  )}
                  {product.specifications.material && (
                    <div className="py-2.5 grid grid-cols-3">
                      <dt className="font-bold text-stone-900">Material</dt>
                      <dd className="col-span-2 text-stone-600">{product.specifications.material}</dd>
                    </div>
                  )}
                  {product.specifications.packageContents && (
                    <div className="py-2.5 grid grid-cols-3">
                      <dt className="font-bold text-stone-900">Itens Inclusos</dt>
                      <dd className="col-span-2 text-stone-600">
                        {product.specifications.packageContents}
                      </dd>
                    </div>
                  )}
                  {product.specifications.power && (
                    <div className="py-2.5 grid grid-cols-3">
                      <dt className="font-bold text-stone-900">Alimentação / Potência</dt>
                      <dd className="col-span-2 text-stone-600">{product.specifications.power}</dd>
                    </div>
                  )}
                  {product.specifications.warranty && (
                    <div className="py-2.5 grid grid-cols-3">
                      <dt className="font-bold text-stone-900">Garantia</dt>
                      <dd className="col-span-2 text-stone-600">{product.specifications.warranty}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {activeTab === "shipping" && (
              <div className="max-w-2xl space-y-3 text-xs sm:text-sm text-stone-700">
                <p>
                  Todos os produtos são despachados em até 24 horas úteis após a confirmação do pagamento.
                </p>
                <p>
                  O prazo de entrega varia conforme a região de destino, com envios via Sedex, PAC ou transportadoras parceiras rastreáveis.
                </p>
                <p className="font-bold text-stone-900">
                  Frete Grátis disponível para compras acima de R$ {BRAND_CONFIG.freeShippingThreshold.toFixed(0)}.
                </p>
              </div>
            )}

            {activeTab === "warranty" && (
              <div className="max-w-2xl space-y-3 text-xs sm:text-sm text-stone-700">
                <p>
                  Oferecemos <strong>7 dias corridos</strong> após o recebimento para troca ou devolução por desistência ou arrependimento, com frete de logística reversa por nossa conta.
                </p>
                <p>
                  Caso o produto apresente qualquer vício ou defeito de fabricação, nossa garantia cobre a substituição imediata sem burocracia.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-stone-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl sm:text-2xl font-bold text-stone-950">
                Você Também Pode Gostar
              </h3>
              <button
                onClick={() => onNavigateCatalog(product.category)}
                className="text-xs font-bold text-stone-900 hover:underline"
              >
                Ver mais da categoria
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
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
