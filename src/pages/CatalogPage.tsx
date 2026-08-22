import React, { useState, useMemo } from "react";
import { PRODUCTS } from "../data/products";
import { CATEGORIES } from "../data/categories";
import { OCCASIONS } from "../data/occasions";
import { Product, ProductCategory, ProductOccasion } from "../types";
import { ProductCard } from "../components/common/ProductCard";
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";

interface CatalogPageProps {
  initialCategory?: ProductCategory;
  initialOccasion?: ProductOccasion;
  initialTag?: string;
  initialSearch?: string;
  onNavigateProduct: (slug: string) => void;
  onQuickView: (product: Product) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  initialCategory,
  initialOccasion,
  initialTag,
  initialSearch,
  onNavigateProduct,
  onQuickView,
}) => {
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [selectedOccasion, setSelectedOccasion] = useState<string>(initialOccasion || "all");
  const [selectedRecipient, setSelectedRecipient] = useState<string>(
    initialTag && initialTag.startsWith("para-") ? initialTag : "all"
  );
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch || "");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 600 });
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyKits, setOnlyKits] = useState(false);
  const [selectedSort, setSelectedSort] = useState<"relevance" | "price-asc" | "price-desc" | "bestseller" | "newest">(
    initialTag === "mais-vendidos" ? "bestseller" : initialCategory === "novidades" ? "newest" : "relevance"
  );
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Filter logic
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(q);
        const matchDesc = product.description.toLowerCase().includes(q);
        const matchCat = product.categoryName.toLowerCase().includes(q);
        const matchSku = product.sku.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat && !matchSku) return false;
      }

      // 2. Category
      if (selectedCategory !== "all") {
        if (selectedCategory === "novidades" && !product.new) return false;
        if (selectedCategory !== "novidades" && product.category !== selectedCategory) return false;
      }

      // 3. Occasion
      if (selectedOccasion !== "all") {
        if (!product.occasions || !product.occasions.includes(selectedOccasion as ProductOccasion)) {
          return false;
        }
      }

      // 4. Recipient
      if (selectedRecipient !== "all") {
        if (!product.recipientTags || !product.recipientTags.includes(selectedRecipient as any)) {
          return false;
        }
      }

      // 5. Price
      const price = product.promotionalPrice ?? product.price;
      if (price < priceRange.min || price > priceRange.max) return false;

      // 6. Stock
      if (onlyInStock && product.stock <= 0) return false;

      // 7. Kits only
      if (onlyKits && !product.isKit && product.category !== "kits-presenteaveis") return false;

      return true;
    }).sort((a, b) => {
      const priceA = a.promotionalPrice ?? a.price;
      const priceB = b.promotionalPrice ?? b.price;

      if (selectedSort === "price-asc") return priceA - priceB;
      if (selectedSort === "price-desc") return priceB - priceA;
      if (selectedSort === "bestseller") return (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0);
      if (selectedSort === "newest") return (b.new ? 1 : 0) - (a.new ? 1 : 0);
      return 0;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedOccasion,
    selectedRecipient,
    priceRange,
    onlyInStock,
    onlyKits,
    selectedSort,
  ]);

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedOccasion("all");
    setSelectedRecipient("all");
    setSearchQuery("");
    setPriceRange({ min: 0, max: 600 });
    setOnlyInStock(false);
    setOnlyKits(false);
    setSelectedSort("relevance");
  };

  const activeFiltersCount =
    (selectedCategory !== "all" ? 1 : 0) +
    (selectedOccasion !== "all" ? 1 : 0) +
    (selectedRecipient !== "all" ? 1 : 0) +
    (priceRange.max < 600 ? 1 : 0) +
    (onlyInStock ? 1 : 0) +
    (onlyKits ? 1 : 0) +
    (searchQuery ? 1 : 0);

  return (
    <div className="bg-stone-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
            <span>Início</span>
            <span>/</span>
            <span className="font-semibold text-stone-900">Catálogo Completo</span>
            {selectedCategory !== "all" && (
              <>
                <span>/</span>
                <span className="text-stone-900 font-bold capitalize">
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-stone-950">
                {searchQuery
                  ? `Busca por "${searchQuery}"`
                  : selectedCategory !== "all"
                  ? CATEGORIES.find((c) => c.id === selectedCategory)?.name || "Coleção"
                  : "Todos os Presentes e Produtos"}
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 mt-1">
                Exibindo {filteredProducts.length} {filteredProducts.length === 1 ? "produto" : "produtos"} com envio para todo o Brasil
              </p>
            </div>

            {/* Mobile Filter Button & Desktop Sort */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-stone-800 flex items-center gap-2 shadow-xs"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
              </button>

              <div className="flex items-center gap-2 bg-white px-3 py-2 border border-stone-300 rounded-xl text-xs shadow-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
                <span className="text-stone-500 font-medium hidden sm:inline">Ordenar:</span>
                <select
                  value={selectedSort}
                  onChange={(e) => setSelectedSort(e.target.value as any)}
                  className="bg-transparent font-semibold text-stone-900 focus:outline-none cursor-pointer"
                >
                  <option value="relevance">Mais Relevantes</option>
                  <option value="bestseller">Mais Vendidos</option>
                  <option value="newest">Lançamentos</option>
                  <option value="price-asc">Menor Preço</option>
                  <option value="price-desc">Maior Preço</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-stone-200">
              <span className="text-xs font-semibold text-stone-500">Filtros ativos:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-900 text-white rounded-full text-xs">
                  <span>Busca: "{searchQuery}"</span>
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-200 text-stone-800 rounded-full text-xs font-medium">
                  <span>{CATEGORIES.find((c) => c.id === selectedCategory)?.name}</span>
                  <button onClick={() => setSelectedCategory("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedOccasion !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-200 text-stone-800 rounded-full text-xs font-medium">
                  <span>{OCCASIONS.find((o) => o.id === selectedOccasion)?.name}</span>
                  <button onClick={() => setSelectedOccasion("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedRecipient !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-200 text-stone-800 rounded-full text-xs font-medium">
                  <span className="capitalize">{selectedRecipient.replace("-", " ")}</span>
                  <button onClick={() => setSelectedRecipient("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {onlyKits && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-medium">
                  <span>Apenas Kits</span>
                  <button onClick={() => setOnlyKits(false)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {priceRange.max < 600 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-stone-200 text-stone-800 rounded-full text-xs font-medium">
                  <span>Até R$ {priceRange.max}</span>
                  <button onClick={() => setPriceRange({ min: 0, max: 600 })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleClearFilters}
                className="text-xs text-stone-600 hover:text-stone-950 underline ml-2 font-medium"
              >
                Limpar todos
              </button>
            </div>
          )}
        </div>

        {/* Main Content Layout (Sidebar + Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* DESKTOP SIDEBAR FILTERS */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3">
                  Categorias
                </h3>
                <ul className="space-y-1 text-xs">
                  <li>
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                        selectedCategory === "all"
                          ? "bg-stone-900 text-white font-semibold"
                          : "text-stone-700 hover:bg-stone-100"
                      }`}
                    >
                      <span>Todos os Produtos</span>
                      <span className="text-[11px] opacity-70">{PRODUCTS.length}</span>
                    </button>
                  </li>
                  {CATEGORIES.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                          selectedCategory === cat.id
                            ? "bg-stone-900 text-white font-semibold"
                            : "text-stone-700 hover:bg-stone-100"
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-[11px] opacity-70">{cat.itemCount}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-stone-100 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-3">
                  Presentes por Ocasião
                </h3>
                <select
                  value={selectedOccasion}
                  onChange={(e) => setSelectedOccasion(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-white font-medium text-stone-800 focus:outline-none focus:border-stone-900"
                >
                  <option value="all">Todas as Ocasiões</option>
                  {OCCASIONS.map((occ) => (
                    <option key={occ.id} value={occ.id}>
                      {occ.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="border-t border-stone-100 pt-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                    Faixa de Preço
                  </h3>
                  <span className="text-xs font-bold text-stone-950">
                    Até R$ {priceRange.max}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="25"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                  }
                  className="w-full accent-stone-950 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                  <span>R$ 0</span>
                  <span>R$ 600+</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-3">
                  {[50, 100, 200].map((val) => (
                    <button
                      key={val}
                      onClick={() => setPriceRange({ min: 0, max: val })}
                      className={`py-1 px-2 text-[11px] font-semibold rounded-lg border transition-colors ${
                        priceRange.max === val
                          ? "bg-stone-900 text-white border-stone-900"
                          : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      Até R${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Checkbox Options */}
              <div className="border-t border-stone-100 pt-5 space-y-2.5">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyKits}
                    onChange={(e) => setOnlyKits(e.target.checked)}
                    className="rounded border-stone-300 text-stone-950 focus:ring-stone-950"
                  />
                  <span>Apenas Kits Presenteáveis</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded border-stone-300 text-stone-950 focus:ring-stone-950"
                  />
                  <span>Apenas Pronta Entrega</span>
                </label>
              </div>

              <button
                onClick={handleClearFilters}
                className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            </div>
          </aside>

          {/* PRODUCTS GRID / EMPTY STATE */}
          <main className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-stone-900 mb-1">
                  Nenhum produto encontrado
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 max-w-sm mb-6">
                  Tente alterar seus termos de busca ou remover alguns filtros selecionados para visualizar mais opções.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2.5 rounded-xl bg-stone-950 text-white text-xs font-semibold hover:bg-stone-800 transition-colors"
                >
                  Restaurar Todos os Produtos
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={onQuickView}
                    onNavigateToProduct={onNavigateProduct}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MOBILE FILTER MODAL */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setIsMobileFilterOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="relative w-full max-w-md ml-auto h-full bg-white shadow-2xl p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-4">
              <h3 className="font-bold text-stone-950 text-base">Filtros do Catálogo</h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 text-stone-500 hover:text-stone-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 flex-1">
              {/* Category */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase mb-2">Categoria</h4>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                >
                  <option value="all">Todas as categorias</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Occasion */}
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase mb-2">Ocasião</h4>
                <select
                  value={selectedOccasion}
                  onChange={(e) => setSelectedOccasion(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-stone-300"
                >
                  <option value="all">Todas as ocasiões</option>
                  {OCCASIONS.map((occ) => (
                    <option key={occ.id} value={occ.id}>
                      {occ.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span>Preço Máximo</span>
                  <span>R$ {priceRange.max}</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="600"
                  step="25"
                  value={priceRange.max}
                  onChange={(e) =>
                    setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                  }
                  className="w-full accent-stone-950"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-medium text-stone-800">
                  <input
                    type="checkbox"
                    checked={onlyKits}
                    onChange={(e) => setOnlyKits(e.target.checked)}
                    className="rounded border-stone-300 text-stone-950"
                  />
                  <span>Apenas Kits Presenteáveis</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex gap-3">
              <button
                onClick={() => {
                  handleClearFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-3 bg-stone-100 text-stone-800 text-xs font-bold rounded-xl"
              >
                Limpar
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-stone-950 text-white text-xs font-bold rounded-xl"
              >
                Ver Resultados ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
