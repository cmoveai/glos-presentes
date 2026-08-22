import React, { useState, useEffect } from "react";
import { EDITORIAL_BANNERS } from "../../data/banners";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductCategory, EditorialBanner } from "../../types";
import { getEditorialBanners } from "../../services/api";

interface EditorialBannersProps {
  onNavigateCatalog: (categorySlug: ProductCategory) => void;
}

export const EditorialBanners: React.FC<EditorialBannersProps> = ({ onNavigateCatalog }) => {
  const [banners, setBanners] = useState<EditorialBanner[]>(EDITORIAL_BANNERS);

  useEffect(() => {
    let isMounted = true;
    async function loadEditorial() {
      try {
        const list = await getEditorialBanners();
        if (isMounted && list && list.length > 0) {
          setBanners(list);
        }
      } catch (err) {
        console.warn("Failed to fetch dynamic editorial banners:", err);
      }
    }
    loadEditorial();

    const handleUpdate = () => {
      loadEditorial();
    };
    window.addEventListener("banners_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("banners_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <section className="py-12 bg-stone-100/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold tracking-wider text-amber-900 uppercase">
            Curadoria Autoral
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-950 mt-1">
            Coleções em Destaque
          </h2>
          <p className="text-xs sm:text-sm text-stone-700 mt-2">
            Composições selecionadas para quem busca design, utilidade e estética superior.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="group relative rounded-2xl overflow-hidden bg-stone-900 min-h-[380px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-8 shadow-md hover:shadow-xl transition-all duration-300"
            >
              {/* Background Image with Zoom */}
              <img
                src={banner.image}
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />

              {/* Content */}
              <div className="relative z-10 space-y-3">
                {banner.tag && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-widest text-amber-300 uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>{banner.tag}</span>
                  </span>
                )}

                <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                  {banner.title}
                </h3>

                <p className="text-xs text-stone-300 line-clamp-3 leading-relaxed">
                  {banner.subtitle}
                </p>

                <div className="pt-2">
                  <button
                    onClick={() => onNavigateCatalog(banner.categorySlug as ProductCategory)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white text-stone-100 hover:text-stone-950 py-2.5 px-4 rounded-xl backdrop-blur-md border border-white/20 transition-all"
                  >
                    <span>{banner.ctaText || "Ver Coleção"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

