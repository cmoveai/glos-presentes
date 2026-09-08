import React, { useState, useMemo, useEffect } from "react";
import { PRODUCTS } from "../data/products";
import { CATEGORIES } from "../data/categories";
import { OCCASIONS } from "../data/occasions";
import { Product, ProductCategory, ProductOccasion, CategoryInfo } from "../types";
import { fetchCategories } from "../lib/firebase";
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

import {
  MAIN_CATEGORIES,
  DYNAMIC_COLLECTIONS,
  findMainCategory,
  slugifyCategory,
} from "../config/categories";

interface CatalogPageProps {
  initialCategory?: ProductCategory;
  initialSubcategory?: string;
  initialOccasion?: ProductOccasion;
  initialTag?: string;
  initialSearch?: string;
  onNavigateProduct: (slug: string) => void;
  onQuickView: (product: Product) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  initialCategory,
  initialSubcategory,
  initialOccasion,
  initialTag,
  initialSearch,
  onNavigateProduct,
  onQuickView,
}) => {
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || "all");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(initialSubcategory || "all");
  const [selectedTag, setSelectedTag] = useState<string>(initialTag || "all");
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
  const [categoriesList, setCategoriesList] = useState<CategoryInfo[]>(CATEGORIES);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setCategoriesList(cats);
      })
      .catch((e) => console.warn("CatalogPage categories fetch warning:", e));
  }, []);

  const activeCategories = useMemo(() => {
    return categoriesList
      .filter((c) => c.ativo !== false)
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  }, [categoriesList]);

  // Current selected main category config (if any)
  const currentCategoryConfig = useMemo(() => {
    if (selectedCategory === "all") return undefined;
    return findMainCategory(selectedCategory);
  }, [selectedCategory]);

  // Filter logic
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = product.name.toLowerCase().includes(q);
        const matchDesc = product.description.toLowerCase().includes(q);
        const matchCat = product.categoryName?.toLowerCase().includes(q);
        const matchSku = product.sku?.toLowerCase().includes(q);
        const matchSub = product.subcategory?.toLowerCase().includes(q);
        const matchTag = product.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchName && !matchDesc && !matchCat && !matchSku && !matchSub && !matchTag) return false;
      }

      // 2. Category
      if (selectedCategory !== "all") {
        if (selectedCategory === "novidades" || selectedCategory === "lancamentos") {
          if (!product.new && !product.tags?.includes("Lançamentos")) return false;
        } else {
          const matchCat =
            product.category === selectedCategory ||
            product.categoryName?.toLowerCase() === selectedCategory.toLowerCase() ||
            slugifyCategory(product.categoryName || "") === selectedCategory ||
            slugifyCategory(product.category || "") === selectedCategory ||
            (currentCategoryConfig && (product.categoryName === currentCategoryConfig.name || product.category === currentCategoryConfig.id as any));
          if (!matchCat) return false;
        }
      }

      // 2b. Subcategory
      if (selectedSubcategory !== "all") {
        const matchSub =
          product.subcategory?.toLowerCase() === selectedSubcategory.toLowerCase() ||
          slugifyCategory(product.subcategory || "") === slugifyCategory(selectedSubcategory);
        if (!matchSub) return false;
      }

      // 2c. Tag
      if (selectedTag !== "all") {
        const matchTag =
          product.tags?.some(
            (t) =>
              t.toLowerCase() === selectedTag.toLowerCase() ||
              slugifyCategory(t) === slugifyCategory(selectedTag)
          ) ||
          product.occasions?.some((o) => o.toLowerCase() === selectedTag.toLowerCase()) ||
          (selectedTag === "Lançamentos" && product.new);
        if (!matchTag) return false;
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
      if (onlyKits && !product.isKit && product.category !== "kits-presenteaveis" && product.categoryName !== "Presentes e Kits") return false;

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
    selectedSubcategory,
    selectedTag,
    currentCategoryConfig,
    selectedOccasion,
    selectedRecipient,
    priceRange,
    onlyInStock,
    onlyKits,
    selectedSort,
  ]);

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedSubcategory("all");
    setSelectedTag("all");
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
    (selectedSubcategory !== "all" ? 1 : 0) +
    (selectedTag !== "all" ? 1 : 0) +
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
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#D6D3CC]">
              <span className="text-xs font-normal text-[#6B6A64]">Filtros ativos:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#272727] text-white rounded-[6px] text-xs">
                  <span>Busca: "{searchQuery}"</span>
                  <button onClick={() => setSearchQuery("")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] rounded-[6px] text-xs font-normal">
                  <span>Categoria: {currentCategoryConfig?.name || selectedCategory}</span>
                  <button onClick={() => {
                    setSelectedCategory("all");
                    setSelectedSubcategory("all");
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSubcategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#004AAD]/10 border border-[#004AAD]/30 text-[#004AAD] rounded-[6px] text-xs font-medium">
                  <span>Subcategoria: {selectedSubcategory}</span>
                  <button onClick={() => setSelectedSubcategory("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTag !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] rounded-[6px] text-xs font-normal">
                  <span>Tag / Coleção: {selectedTag}</span>
                  <button onClick={() => setSelectedTag("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedOccasion !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] rounded-[6px] text-xs font-normal">
                  <span>{OCCASIONS.find((o) => o.id === selectedOccasion)?.name}</span>
                  <button onClick={() => setSelectedOccasion("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedRecipient !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] rounded-[6px] text-xs font-normal">
                  <span className="capitalize">{selectedRecipient.replace("-", " ")}</span>
                  <button onClick={() => setSelectedRecipient("all")}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {onlyKits && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] rounded-[6px] text-xs font-normal">
                  <span>Apenas Kits</span>
                  <button onClick={() => setOnlyKits(false)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {priceRange.max < 600 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] rounded-[6px] text-xs font-normal">
                  <span>Até R$ {priceRange.max}</span>
                  <button onClick={() => setPriceRange({ min: 0, max: 600 })}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleClearFilters}
                className="text-xs text-[#004AAD] hover:underline ml-2 font-normal"
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
            <div className="bg-[#F4F3EF] p-5 rounded-[8px] border border-[#D6D3CC] space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#272727] mb-3">
                  Categorias Principais
                </h3>
                <ul className="space-y-1 text-xs">
                  <li>
                    <button
                      onClick={() => {
                        setSelectedCategory("all");
                        setSelectedSubcategory("all");
                      }}
                      className={`w-full text-left py-1.5 px-2 rounded-[6px] transition-colors flex items-center justify-between ${
                        selectedCategory === "all"
                          ? "bg-[#004AAD] text-white font-medium"
                          : "text-[#272727] hover:bg-[#EEEDE8]"
                      }`}
                    >
                      <span>Todos os Produtos</span>
                      <span className="text-[11px] opacity-80">{PRODUCTS.length}</span>
                    </button>
                  </li>
                  {MAIN_CATEGORIES.map((cat) => {
                    const isSelected =
                      selectedCategory === cat.id ||
                      selectedCategory === cat.name ||
                      slugifyCategory(selectedCategory) === cat.id;

                    return (
                      <li key={cat.id} className="space-y-1">
                        <button
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategory("all");
                              setSelectedSubcategory("all");
                            } else {
                              setSelectedCategory(cat.id);
                              setSelectedSubcategory("all");
                            }
                          }}
                          className={`w-full text-left py-1.5 px-2 rounded-[6px] transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-[#004AAD] text-white font-medium"
                              : "text-[#272727] hover:bg-[#EEEDE8]"
                          }`}
                        >
                          <span>{cat.name}</span>
                          {cat.subcategories.length > 0 && (
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                isSelected ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>

                        {/* Subcategories */}
                        {isSelected && cat.subcategories.length > 0 && (
                          <div className="pl-3 pr-1 py-1 space-y-0.5 border-l border-[#D6D3CC] ml-2">
                            <button
                              onClick={() => setSelectedSubcategory("all")}
                              className={`w-full text-left py-1 px-2 rounded-[4px] text-xs transition-colors ${
                                selectedSubcategory === "all"
                                  ? "text-[#004AAD] font-medium bg-[#EEEDE8]"
                                  : "text-[#6B6A64] hover:text-[#272727]"
                              }`}
                            >
                              Todas as subcategorias
                            </button>
                            {cat.subcategories.map((sub) => {
                              const isSubSelected = selectedSubcategory === sub.name;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => setSelectedSubcategory(sub.name)}
                                  className={`w-full text-left py-1 px-2 rounded-[4px] text-xs transition-colors ${
                                    isSubSelected
                                      ? "text-[#004AAD] font-medium bg-[#EEEDE8]"
                                      : "text-[#6B6A64] hover:text-[#272727]"
                                  }`}
                                >
                                  {sub.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Coleções Dinâmicas / Tags */}
              <div className="border-t border-[#D6D3CC] pt-4">
                <h3 className="text-xs font-medium uppercase tracking-wider text-[#272727] mb-3">
                  Coleções Dinâmicas
                </h3>
                <div className="space-y-3">
                  {DYNAMIC_COLLECTIONS.map((col) => (
                    <div key={col.id} className="space-y-1">
                      <div className="text-[11px] font-medium text-[#9B998F] uppercase">
                        {col.name}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {col.tags.map((tag) => {
                          const isTagActive = selectedTag === tag;
                          return (
                            <button
                              key={tag}
                              onClick={() => {
                                setSelectedTag(isTagActive ? "all" : tag);
                              }}
                              className={`px-2 py-0.5 rounded-[4px] text-[11px] transition-colors border ${
                                isTagActive
                                  ? "bg-[#004AAD] text-white border-[#004AAD]"
                                  : "bg-[#EEEDE8] text-[#6B6A64] border-[#D6D3CC] hover:text-[#272727]"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
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

            <div className="space-y-5 flex-1">
              {/* Category */}
              <div>
                <h4 className="text-xs font-medium text-[#272727] uppercase mb-1.5">
                  Categoria Principal
                </h4>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory("all");
                  }}
                  className="w-full text-xs p-2.5 rounded-[6px] border border-[#D6D3CC] bg-[#F4F3EF] text-[#272727]"
                >
                  <option value="all">Todas as categorias</option>
                  {MAIN_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory (if main category has subcategories) */}
              {currentCategoryConfig && currentCategoryConfig.subcategories.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-[#272727] uppercase mb-1.5">
                    Subcategoria ({currentCategoryConfig.name})
                  </h4>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-[6px] border border-[#D6D3CC] bg-[#F4F3EF] text-[#272727]"
                  >
                    <option value="all">Todas as subcategorias</option>
                    {currentCategoryConfig.subcategories.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Coleção / Tag */}
              <div>
                <h4 className="text-xs font-medium text-[#272727] uppercase mb-1.5">
                  Coleção Dinâmica / Tag
                </h4>
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-[6px] border border-[#D6D3CC] bg-[#F4F3EF] text-[#272727]"
                >
                  <option value="all">Todas as coleções</option>
                  {DYNAMIC_COLLECTIONS.map((col) => (
                    <optgroup key={col.id} label={col.name}>
                      {col.tags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Occasion */}
              <div>
                <h4 className="text-xs font-medium text-[#272727] uppercase mb-1.5">Ocasião</h4>
                <select
                  value={selectedOccasion}
                  onChange={(e) => setSelectedOccasion(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-[6px] border border-[#D6D3CC] bg-[#F4F3EF] text-[#272727]"
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
                <div className="flex justify-between text-xs font-medium mb-2 text-[#272727]">
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
                  className="w-full accent-[#004AAD]"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-normal text-[#272727]">
                  <input
                    type="checkbox"
                    checked={onlyKits}
                    onChange={(e) => setOnlyKits(e.target.checked)}
                    className="rounded border-[#D6D3CC] text-[#004AAD]"
                  />
                  <span>Apenas Kits Presenteáveis</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D6D3CC] flex gap-3">
              <button
                onClick={() => {
                  handleClearFilters();
                  setIsMobileFilterOpen(false);
                }}
                className="flex-1 py-2.5 bg-[#EEEDE8] text-[#272727] text-xs font-medium rounded-[6px]"
              >
                Limpar
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 bg-[#004AAD] text-white text-xs font-medium rounded-[6px]"
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
