import React from "react";
import { HeroCarousel } from "../components/home/HeroCarousel";
import { BenefitsBar } from "../components/home/BenefitsBar";
import { EditorialBanners } from "../components/home/EditorialBanners";
import { CategoryGrid } from "../components/home/CategoryGrid";
import { GiftKitsSection } from "../components/home/GiftKitsSection";
import { OccasionsSection } from "../components/home/OccasionsSection";
import { TrustFeatures } from "../components/home/TrustFeatures";
import { InstagramPreview } from "../components/home/InstagramPreview";
import { ProductCard } from "../components/common/ProductCard";
import { PRODUCTS, getBestsellers, getNewArrivals } from "../data/products";
import { ProductCategory, ProductOccasion, Product } from "../types";
import { ArrowRight, Sparkles, Utensils, Headphones, Flame } from "lucide-react";

interface HomePageProps {
  onNavigateCatalog: (category?: ProductCategory, occasion?: ProductOccasion, tag?: string, search?: string) => void;
  onNavigateProduct: (slug: string) => void;
  onQuickView: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateCatalog,
  onNavigateProduct,
  onQuickView,
}) => {
  const newArrivals = getNewArrivals(4);
  const bestsellers = getBestsellers(4);
  const kitchenProducts = PRODUCTS.filter((p) => p.category === "cozinha").slice(0, 4);
  const techProducts = PRODUCTS.filter((p) => p.category === "eletronicos").slice(0, 4);

  return (
    <div className="space-y-0">
      {/* 1. HERO EM CARROSSEL */}
      <HeroCarousel onNavigateCatalog={onNavigateCatalog} />

      {/* 2. FAIXA DE BENEFÍCIOS */}
      <BenefitsBar />

      {/* 3. LANÇAMENTOS (VITRINE) */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-wider text-emerald-800 uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Acabaram de Chegar</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
                Lançamentos Selecionados
              </h2>
            </div>
            <button
              onClick={() => onNavigateCatalog("novidades")}
              className="text-xs font-bold text-stone-900 hover:text-stone-600 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas as novidades</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={onQuickView}
                onNavigateToProduct={onNavigateProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. COLEÇÕES EM DESTAQUE (3 BANNERS EDITORIAIS) */}
      <EditorialBanners onNavigateCatalog={onNavigateCatalog} />

      {/* 5. COMPRE POR CATEGORIA (GRID VISUAL) */}
      <CategoryGrid onNavigateCatalog={onNavigateCatalog} />

      {/* 6. MAIS VENDIDOS */}
      <section className="py-12 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-wider text-amber-900 uppercase flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-700" />
                <span>Os Favoritos da Loja</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
                Mais Vendidos & Amados
              </h2>
            </div>
            <button
              onClick={() => onNavigateCatalog(undefined, undefined, "mais-vendidos")}
              className="text-xs font-bold text-stone-900 hover:text-stone-600 flex items-center gap-1 transition-colors"
            >
              <span>Ver todos os mais vendidos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {bestsellers.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={onQuickView}
                onNavigateToProduct={onNavigateProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRESENTES POR OCASIÃO */}
      <OccasionsSection onNavigateCatalogByOccasion={(occ) => onNavigateCatalog(undefined, occ)} />

      {/* 8. COZINHA E CASA (VITRINE) */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-wider text-stone-700 uppercase flex items-center gap-1">
                <Utensils className="w-3.5 h-3.5 text-stone-900" />
                <span>Gastronomia & Mesa Posta</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
                Cozinha Bonita e Funcional
              </h2>
            </div>
            <button
              onClick={() => onNavigateCatalog("cozinha")}
              className="text-xs font-bold text-stone-900 hover:text-stone-600 flex items-center gap-1 transition-colors"
            >
              <span>Ver coleção cozinha</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {kitchenProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={onQuickView}
                onNavigateToProduct={onNavigateProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 9. ELETRÔNICOS E TECH (VITRINE) */}
      <section className="py-12 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold tracking-wider text-stone-700 uppercase flex items-center gap-1">
                <Headphones className="w-3.5 h-3.5 text-stone-900" />
                <span>Smart Living & Produtividade</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
                Eletrônicos com Design
              </h2>
            </div>
            <button
              onClick={() => onNavigateCatalog("eletronicos")}
              className="text-xs font-bold text-stone-900 hover:text-stone-600 flex items-center gap-1 transition-colors"
            >
              <span>Ver eletrônicos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {techProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={onQuickView}
                onNavigateToProduct={onNavigateProduct}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 10. KITS PARA PRESENTEAR (APRESENTAÇÃO COMPLETA) */}
      <GiftKitsSection
        onNavigateProduct={onNavigateProduct}
        onQuickView={onQuickView}
      />

      {/* 11. DIFERENCIAIS */}
      <TrustFeatures />

      {/* 12. INSTAGRAM */}
      <InstagramPreview />
    </div>
  );
};
