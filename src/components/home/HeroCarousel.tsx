import React, { useState, useEffect } from "react";
import { HERO_CAMPAIGNS } from "../../data/banners";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ProductCategory, HeroCampaign } from "../../types";
import { getHeroBanners } from "../../services/api";

interface HeroCarouselProps {
  onNavigateCatalog: (category?: ProductCategory) => void;
}

export const HeroCarousel: React.FC<HeroCarouselProps> = ({ onNavigateCatalog }) => {
  const [banners, setBanners] = useState<HeroCampaign[]>(HERO_CAMPAIGNS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadBanners() {
      try {
        const list = await getHeroBanners();
        if (isMounted && list && list.length > 0) {
          const activeList = list.filter((b) => b.active !== false);
          if (activeList.length > 0) {
            setBanners(activeList);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch dynamic hero banners:", err);
      }
    }
    loadBanners();

    const handleUpdate = () => {
      loadBanners();
    };
    window.addEventListener("banners_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener("banners_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const totalSlides = banners.length;

  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5500);
    return () => clearInterval(interval);
  }, [isPaused, totalSlides]);

  const currentSlide = banners[currentIndex] || banners[0] || HERO_CAMPAIGNS[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  return (
    <div
      id="hero-carousel-section"
      className="relative w-full overflow-hidden bg-stone-900 text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[480px] sm:h-[540px] md:h-[580px] w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id || currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            {/* Background Image with Dark Vignette Gradient */}
            <img
              src={currentSlide.image}
              alt={currentSlide.headline}
              className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent md:hidden" />

            {/* Content Container */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
              <div className="max-w-xl py-12 space-y-4 sm:space-y-6">
                {currentSlide.badge && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-amber-300 border border-white/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{currentSlide.badge}</span>
                  </span>
                )}

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
                  {currentSlide.headline}
                </h1>

                <p className="text-sm sm:text-base text-stone-300 font-light leading-relaxed max-w-md">
                  {currentSlide.subtitle}
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onNavigateCatalog(currentSlide.categoryFilter)}
                    className="px-6 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-stone-950 font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl hover:scale-102 flex items-center gap-2"
                  >
                    <span>{currentSlide.ctaText || "Explorar Coleção"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onNavigateCatalog()}
                    className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-colors"
                  >
                    Ver Todo o Catálogo
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows */}
        {totalSlides > 1 && (
          <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-colors border border-white/10"
              aria-label="Campanha anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-colors border border-white/10"
              aria-label="Próxima campanha"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Indicators */}
        {totalSlides > 1 && (
          <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentIndex === idx ? "w-8 bg-amber-400" : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Ir para slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

