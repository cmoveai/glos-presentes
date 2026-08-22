import React from "react";
import { OCCASIONS } from "../../data/occasions";
import { ProductOccasion } from "../../types";
import { CalendarHeart, ArrowRight } from "lucide-react";

interface OccasionsSectionProps {
  onNavigateCatalogByOccasion: (occasion: ProductOccasion) => void;
}

export const OccasionsSection: React.FC<OccasionsSectionProps> = ({
  onNavigateCatalogByOccasion,
}) => {
  return (
    <section className="py-12 bg-stone-50 border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
          <div>
            <span className="text-xs font-bold tracking-wider text-amber-900 uppercase flex items-center gap-1.5">
              <CalendarHeart className="w-4 h-4 text-amber-700" />
              <span>Momentos Especiais</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
              Presentes por Ocasião
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-stone-700">
            Inspirações selecionadas para cada data memorável
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {OCCASIONS.map((occ) => (
            <button
              key={occ.id}
              onClick={() => onNavigateCatalogByOccasion(occ.id)}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-900 border border-stone-200 text-left flex flex-col justify-end p-4 shadow-xs hover:shadow-md transition-all"
            >
              <img
                src={occ.image}
                alt={occ.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

              <div className="relative z-10">
                <h3 className="font-bold text-sm text-white leading-tight mb-1">
                  {occ.name}
                </h3>
                <p className="text-[11px] text-stone-300 line-clamp-1 mb-2">
                  {occ.subtitle}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 group-hover:translate-x-1 transition-transform">
                  <span>Ver presentes</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
