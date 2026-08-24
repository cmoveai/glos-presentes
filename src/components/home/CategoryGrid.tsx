import React, { useState, useEffect } from "react";
import { CATEGORIES } from "../../data/categories";
import { ProductCategory, CategoryInfo } from "../../types";
import { fetchCategories } from "../../lib/firebase";
import { ArrowUpRight } from "lucide-react";

interface CategoryGridProps {
  onNavigateCatalog: (category: ProductCategory) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ onNavigateCatalog }) => {
  const [categoriesList, setCategoriesList] = useState<CategoryInfo[]>(CATEGORIES);

  useEffect(() => {
    fetchCategories()
      .then((cats) => {
        if (cats && cats.length > 0) {
          setCategoriesList(cats);
        }
      })
      .catch((e) => console.warn("CategoryGrid fetch error:", e));
  }, []);

  const displayCategories = categoriesList
    .filter((c) => c.ativo !== false)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold tracking-wider text-amber-900 uppercase">
              Departamentos
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-950">
              Compre por Categoria
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-700">
            Navegue por nossa seleção especializada de presentes
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {displayCategories.slice(0, 8).map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigateCatalog(cat.id as any)}
              className="group relative rounded-2xl overflow-hidden aspect-[4/5] bg-stone-100 border border-stone-200/80 hover:border-stone-400 transition-all text-left flex flex-col justify-end p-4 sm:p-5 shadow-xs hover:shadow-md"
            >
              {cat.image ? (
                <img
                  src={cat.image}
                  alt={cat.nome || cat.name || cat.id}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="absolute inset-0 bg-[#E4E2DD]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/85 via-stone-950/30 to-transparent" />

              <div className="relative z-10">
                <div className="flex items-center justify-between text-white mb-1">
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {cat.nome || cat.name || cat.id}
                  </h3>
                  <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                {cat.description && (
                  <p className="text-[11px] text-stone-300 line-clamp-1">
                    {cat.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

