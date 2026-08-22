import React from "react";
import { BRAND_CONFIG } from "../../config/brand";
import { Instagram, ArrowUpRight, Camera } from "lucide-react";

export const InstagramPreview: React.FC = () => {
  return (
    <section className="py-12 bg-stone-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
              <Instagram className="w-4 h-4 text-stone-900" />
              <span>Siga a Nossa Curadoria</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-950 mt-0.5">
              {BRAND_CONFIG.instagramHandle} no Instagram
            </h2>
          </div>

          <a
            href={`https://instagram.com`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-950 hover:underline self-start sm:self-auto"
          >
            <span>Ver perfil no Instagram</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Integration Ready Grid (Real photography curated for the brand) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            {
              image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=600&auto=format&fit=crop",
              label: "Café & Manhãs Lentas",
            },
            {
              image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop",
              label: "Kits de Presente Feitos com Afeto",
            },
            {
              image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
              label: "Design de Áudio Hi-Fi",
            },
            {
              image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=600&auto=format&fit=crop",
              label: "Aromaterapia & Bem-Estar",
            },
            {
              image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600&auto=format&fit=crop",
              label: "Utensílios para Quem Cozinha",
            },
            {
              image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600&auto=format&fit=crop",
              label: "Desk Setup & Minimalismo",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-stone-200 shadow-2xs"
            >
              <img
                src={item.image}
                alt={item.label}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center text-white">
                <Instagram className="w-5 h-5 mb-1.5" />
                <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
