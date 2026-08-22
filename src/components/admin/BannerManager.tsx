import React, { useState } from "react";
import { Plus, Trash2, Edit3, Image as ImageIcon, Sparkles, X, Save, RefreshCw, Layers, Sliders, ExternalLink, Eye, ArrowRight } from "lucide-react";
import { HeroCampaign, EditorialBanner, CategoryInfo } from "../../types";
import { ImageUploader } from "./ImageUploader";
import {
  saveAdminHeroBanner,
  deleteAdminHeroBanner,
  saveAdminEditorialBanner,
  deleteAdminEditorialBanner,
} from "../../services/api";
import { useToast } from "../../context/ToastContext";

interface BannerManagerProps {
  heroBanners: HeroCampaign[];
  editorialBanners: EditorialBanner[];
  categories: CategoryInfo[];
  onHeroBannersUpdated: (banners: HeroCampaign[]) => void;
  onEditorialBannersUpdated: (banners: EditorialBanner[]) => void;
}

export const BannerManager: React.FC<BannerManagerProps> = ({
  heroBanners,
  editorialBanners,
  categories,
  onHeroBannersUpdated,
  onEditorialBannersUpdated,
}) => {
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<"hero" | "editorial">("hero");

  // Hero Modal State
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [editingHero, setEditingHero] = useState<Partial<HeroCampaign> | null>(null);
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Editorial Modal State
  const [isEditorialModalOpen, setIsEditorialModalOpen] = useState(false);
  const [editingEditorial, setEditingEditorial] = useState<Partial<EditorialBanner> | null>(null);
  const [isSavingEditorial, setIsSavingEditorial] = useState(false);

  // ----------------------------------------------------
  // HERO HANDLERS
  // ----------------------------------------------------
  const handleOpenNewHero = () => {
    setEditingHero({
      id: "hero-" + Math.floor(1000 + Math.random() * 9000),
      headline: "",
      subtitle: "",
      ctaText: "Explorar Coleção",
      ctaLink: "catalogo",
      image: "",
      badge: "Curadoria Especial",
      categoryFilter: categories[0]?.id || "presentes-criativos",
      active: true,
      order: heroBanners.length + 1,
    });
    setIsHeroModalOpen(true);
  };

  const handleOpenEditHero = (banner: HeroCampaign) => {
    setEditingHero({ ...banner });
    setIsHeroModalOpen(true);
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHero?.headline?.trim()) {
      showToast("Por favor, preencha o título principal da campanha.", "error");
      return;
    }
    if (!editingHero?.image) {
      showToast("Por favor, adicione uma imagem para o banner da Hero.", "error");
      return;
    }

    setIsSavingHero(true);
    try {
      const fullBanner: HeroCampaign = {
        id: editingHero.id || "hero-" + Math.floor(1000 + Math.random() * 9000),
        headline: editingHero.headline.trim(),
        subtitle: editingHero.subtitle?.trim() || "Design autoral, curadoria contemporânea e acabamento impecável.",
        ctaText: editingHero.ctaText?.trim() || "Explorar Coleção",
        ctaLink: editingHero.ctaLink?.trim() || "catalogo",
        image: editingHero.image.trim(),
        badge: editingHero.badge?.trim() || "",
        categoryFilter: editingHero.categoryFilter ? (editingHero.categoryFilter as any) : null,
        active: editingHero.active !== false,
        order: Number(editingHero.order) || 1,
      };

      const ok = await saveAdminHeroBanner(fullBanner);
      if (ok) {
        const exists = heroBanners.some((b) => b.id === fullBanner.id);
        const updated = exists
          ? heroBanners.map((b) => (b.id === fullBanner.id ? fullBanner : b))
          : [...heroBanners, fullBanner];
        
        // sort by order
        updated.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
        onHeroBannersUpdated(updated);
        window.dispatchEvent(new Event("banners_updated"));
        showToast("Banner da Hero salvo com sucesso!", "success");
        setIsHeroModalOpen(false);
        setEditingHero(null);
      } else {
        showToast("Erro ao gravar banner no banco.", "error");
      }
    } catch (err: any) {
      console.error("Erro detalhado ao salvar banner Hero:", err);
      showToast("Erro ao salvar banner: " + (err?.message || "Tente novamente"), "error");
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleDeleteHero = async (id: string, headline: string) => {
    if (confirm(`Deseja realmente remover o banner da Hero "${headline}"?`)) {
      const ok = await deleteAdminHeroBanner(id);
      if (ok) {
        onHeroBannersUpdated(heroBanners.filter((b) => b.id !== id));
        window.dispatchEvent(new Event("banners_updated"));
        showToast("Banner da Hero removido com sucesso.", "success");
      }
    }
  };

  // ----------------------------------------------------
  // EDITORIAL HANDLERS
  // ----------------------------------------------------
  const handleOpenNewEditorial = () => {
    setEditingEditorial({
      id: "editorial-" + Math.floor(1000 + Math.random() * 9000),
      title: "",
      subtitle: "",
      image: "",
      ctaText: "Ver Coleção",
      categorySlug: categories[0]?.id || "cozinha",
      tag: "Destaque",
    });
    setIsEditorialModalOpen(true);
  };

  const handleOpenEditEditorial = (banner: EditorialBanner) => {
    setEditingEditorial({ ...banner });
    setIsEditorialModalOpen(true);
  };

  const handleSaveEditorial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEditorial?.title?.trim()) {
      showToast("Por favor, preencha o título do card editorial.", "error");
      return;
    }
    if (!editingEditorial?.image) {
      showToast("Por favor, selecione uma imagem para o card editorial.", "error");
      return;
    }

    setIsSavingEditorial(true);
    try {
      const fullBanner: EditorialBanner = {
        id: editingEditorial.id || "editorial-" + Math.floor(1000 + Math.random() * 9000),
        title: editingEditorial.title.trim(),
        subtitle: editingEditorial.subtitle?.trim() || "Composições exclusivas com alto padrão.",
        image: editingEditorial.image.trim(),
        ctaText: editingEditorial.ctaText?.trim() || "Ver Coleção",
        categorySlug: editingEditorial.categorySlug || undefined,
        tag: editingEditorial.tag?.trim() || "Destaque",
      };

      const ok = await saveAdminEditorialBanner(fullBanner);
      if (ok) {
        const exists = editorialBanners.some((b) => b.id === fullBanner.id);
        const updated = exists
          ? editorialBanners.map((b) => (b.id === fullBanner.id ? fullBanner : b))
          : [...editorialBanners, fullBanner];

        onEditorialBannersUpdated(updated);
        showToast("Card editorial salvo com sucesso!", "success");
        setIsEditorialModalOpen(false);
        setEditingEditorial(null);
      } else {
        showToast("Erro ao gravar card editorial.", "error");
      }
    } catch (err: any) {
      console.error("Erro detalhado ao salvar card editorial:", err);
      showToast("Erro ao processar card: " + (err?.message || "Tente novamente"), "error");
    } finally {
      setIsSavingEditorial(false);
    }
  };

  const handleDeleteEditorial = async (id: string, title: string) => {
    if (confirm(`Deseja remover o card de destaque "${title}"?`)) {
      const ok = await deleteAdminEditorialBanner(id);
      if (ok) {
        onEditorialBannersUpdated(editorialBanners.filter((b) => b.id !== id));
        showToast("Card de destaque removido.", "success");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER WITH SUBTABS */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-amber-600" />
              <span>Gerenciamento de Banners & Vitrines da Home</span>
            </h3>
            <p className="text-xs text-stone-500">
              Faça upload de fotos, altere chamadas, badges e destinos dos banners principais e secundários.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {subTab === "hero" ? (
              <button
                onClick={handleOpenNewHero}
                className="px-4 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-stone-800 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Novo Banner da Hero</span>
              </button>
            ) : (
              <button
                onClick={handleOpenNewEditorial}
                className="px-4 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-stone-800 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Novo Card Editorial</span>
              </button>
            )}
          </div>
        </div>

        {/* SUBTABS */}
        <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
          <button
            onClick={() => setSubTab("hero")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === "hero"
                ? "bg-stone-950 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Carrossel Hero (1920 × 600 px)</span>
          </button>

          <button
            onClick={() => setSubTab("editorial")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              subTab === "editorial"
                ? "bg-stone-950 text-white shadow-xs"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Cards Editoriais (800 × 1000 px)</span>
          </button>
        </div>
      </div>

      {/* GUIA DE MEDIDAS & SPECS PARA A EQUIPE/DESIGNER */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="font-bold flex items-center gap-1.5 text-amber-900 text-sm">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Guia Oficial de Medidas & Dimensões de Banners</span>
          </span>
          <p className="text-amber-800 text-[11px] leading-relaxed">
            Para manter o padrão de design e o tempo de carregamento otimizado:
            <br />
            • <strong>Hero Principal (Topo):</strong> Resolução recomendada <span className="font-mono bg-amber-200/60 px-1 py-0.5 rounded font-bold">1920 × 600 px</span> (ou 1600 × 540 px) • Formato 16:5 / 16:6 • JPG/WebP até 350KB.
            <br />
            • <strong>Cards Editoriais / Vitrines (3 colunas):</strong> Resolução recomendada <span className="font-mono bg-amber-200/60 px-1 py-0.5 rounded font-bold">800 × 1000 px</span> (ou 600 × 800 px) • Proporção 4:5 vertical • JPG/WebP até 250KB.
          </p>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 1. HERO CAROUSEL BANNERS LIST */}
      {/* ================================================================= */}
      {subTab === "hero" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {heroBanners.map((banner, index) => (
              <div
                key={banner.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between group hover:border-amber-300 transition-all"
              >
                <div>
                  {/* PREVIEW BANNER */}
                  <div className="relative aspect-21/9 sm:aspect-16/7 bg-stone-950 overflow-hidden">
                    <img
                      src={banner.image}
                      alt={banner.headline}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                    <div className="absolute top-2.5 left-2.5 flex items-center gap-2">
                      <span className="bg-stone-950/80 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        Posição #{banner.order ?? index + 1}
                      </span>
                      {banner.badge && (
                        <span className="bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                          {banner.badge}
                        </span>
                      )}
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-bold text-sm sm:text-base line-clamp-1">{banner.headline}</h4>
                      <p className="text-[11px] text-stone-300 line-clamp-1">{banner.subtitle}</p>
                    </div>
                  </div>

                  {/* INFO BAR */}
                  <div className="p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span className="font-semibold">Botão de Ação:</span>
                      <span className="bg-stone-100 font-bold px-2 py-0.5 rounded text-stone-900 flex items-center gap-1">
                        <span>{banner.ctaText}</span>
                        <ArrowRight className="w-3 h-3 text-stone-400" />
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-stone-600">
                      <span className="font-semibold">Filtro de Categoria:</span>
                      <span className="font-mono text-[11px] text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-200">
                        {banner.categoryFilter || "Todos os Produtos"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      banner.active !== false
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {banner.active !== false ? "Ativo no Carrossel" : "Inativo"}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditHero(banner)}
                      className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => handleDeleteHero(banner.id, banner.headline)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. EDITORIAL BANNERS LIST */}
      {/* ================================================================= */}
      {subTab === "editorial" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {editorialBanners.map((banner) => (
              <div
                key={banner.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between group hover:border-amber-300 transition-all"
              >
                <div>
                  <div className="relative aspect-4/3 bg-stone-900 overflow-hidden">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                    {banner.tag && (
                      <span className="absolute top-3 left-3 bg-amber-400 text-stone-950 font-black text-[9px] uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                        {banner.tag}
                      </span>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-bold text-sm line-clamp-1">{banner.title}</h4>
                      <p className="text-[11px] text-stone-300 line-clamp-2">{banner.subtitle}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-stone-600">
                      <span className="font-semibold">Destino Categoria:</span>
                      <span className="font-mono text-[11px] text-stone-500">{banner.categorySlug || "Nenhuma"}</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span className="font-semibold">Botão:</span>
                      <span className="font-bold text-stone-900">{banner.ctaText}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditEditorial(banner)}
                    className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>
                  <button
                    onClick={() => handleDeleteEditorial(banner.id, banner.title)}
                    className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: HERO BANNER EDIT / CREATE */}
      {/* ================================================================= */}
      {isHeroModalOpen && editingHero && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-950 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-600" />
                <span>{editingHero.id && heroBanners.some((b) => b.id === editingHero.id) ? "Editar Banner da Hero" : "Novo Banner da Hero"}</span>
              </h3>
              <button
                onClick={() => {
                  setIsHeroModalOpen(false);
                  setEditingHero(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveHero} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Título Principal da Campanha (Headline) *</label>
                  <input
                    type="text"
                    required
                    value={editingHero.headline || ""}
                    onChange={(e) => setEditingHero({ ...editingHero, headline: e.target.value })}
                    placeholder="Ex: Presentes que surpreendem de verdade."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Subtítulo Explicativo</label>
                  <textarea
                    rows={2}
                    value={editingHero.subtitle || ""}
                    onChange={(e) => setEditingHero({ ...editingHero, subtitle: e.target.value })}
                    placeholder="Ex: Design autoral, curadoria contemporânea e acabamento impecável em cada detalhe."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Badge Superior (Tag)</label>
                  <input
                    type="text"
                    value={editingHero.badge || ""}
                    onChange={(e) => setEditingHero({ ...editingHero, badge: e.target.value })}
                    placeholder="Ex: Curadoria Especial, Black Friday, Lançamento"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Texto do Botão (CTA)</label>
                  <input
                    type="text"
                    value={editingHero.ctaText || ""}
                    onChange={(e) => setEditingHero({ ...editingHero, ctaText: e.target.value })}
                    placeholder="Ex: Explorar Coleção, Comprar Agora"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Filtrar Categoria ao Clicar</label>
                  <select
                    value={editingHero.categoryFilter || ""}
                    onChange={(e) => setEditingHero({ ...editingHero, categoryFilter: (e.target.value as any) || undefined })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  >
                    <option value="">Todas as Categorias (Geral)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Ordem de Exibição no Carrossel</label>
                  <input
                    type="number"
                    value={editingHero.order ?? 1}
                    onChange={(e) => setEditingHero({ ...editingHero, order: parseInt(e.target.value) || 1 })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                {/* IMAGE UPLOADER */}
                <div className="sm:col-span-2 pt-2 space-y-2">
                  <ImageUploader
                    images={editingHero.image ? [editingHero.image] : []}
                    onChange={(imgs) => setEditingHero({ ...editingHero, image: imgs[0] || "" })}
                    maxImages={1}
                    label="Foto do Banner da Hero (1920 × 600 px)"
                    helperText="Tamanho recomendado: 1920 × 600 px (Mínimo: 1600 × 540 px). Formato horizontal ultra-wide. Proporção ~16:5. Arquivos JPG, PNG ou WebP."
                  />

                  {/* PRESETS DE FOTOS DE ALTA QUALIDADE */}
                  <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-stone-700 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ou escolha uma foto profissional pronta em alta resolução (1-Clique):</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        {
                          name: "Design & Estética",
                          url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1920&auto=format&fit=crop",
                        },
                        {
                          name: "Barista & Café",
                          url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1920&auto=format&fit=crop",
                        },
                        {
                          name: "Caixa Presente",
                          url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1920&auto=format&fit=crop",
                        },
                        {
                          name: "Mesa & Cozinha",
                          url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1920&auto=format&fit=crop",
                        },
                      ].map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditingHero({ ...editingHero, image: preset.url })}
                          className={`relative rounded-xl overflow-hidden border p-1 text-left group transition-all ${
                            editingHero.image === preset.url
                              ? "border-amber-600 ring-2 ring-amber-500/30 bg-amber-50"
                              : "border-stone-200 bg-white hover:border-stone-400"
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-12 object-cover rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <span className="block text-[10px] font-bold text-stone-800 mt-1 truncate">
                            {preset.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                    <input
                      type="checkbox"
                      checked={editingHero.active !== false}
                      onChange={(e) => setEditingHero({ ...editingHero, active: e.target.checked })}
                      className="rounded text-stone-950"
                    />
                    <span>Banner Ativo (visível no Carrossel da Página Inicial)</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsHeroModalOpen(false);
                    setEditingHero(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingHero}
                  className="px-5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSavingHero ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Banner</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: EDITORIAL BANNER EDIT / CREATE */}
      {/* ================================================================= */}
      {isEditorialModalOpen && editingEditorial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-950 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <span>{editingEditorial.id && editorialBanners.some((b) => b.id === editingEditorial.id) ? "Editar Card Editorial" : "Novo Card Editorial"}</span>
              </h3>
              <button
                onClick={() => {
                  setIsEditorialModalOpen(false);
                  setEditingEditorial(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditorial} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Título do Card *</label>
                  <input
                    type="text"
                    required
                    value={editingEditorial.title || ""}
                    onChange={(e) => setEditingEditorial({ ...editingEditorial, title: e.target.value })}
                    placeholder="Ex: Cozinha & Sabores, Linha Barista"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Subtítulo / Descrição</label>
                  <textarea
                    rows={2}
                    value={editingEditorial.subtitle || ""}
                    onChange={(e) => setEditingEditorial({ ...editingEditorial, subtitle: e.target.value })}
                    placeholder="Ex: Prensas francesas, moedores manuais e copos térmicos..."
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Tag Superior</label>
                  <input
                    type="text"
                    value={editingEditorial.tag || ""}
                    onChange={(e) => setEditingEditorial({ ...editingEditorial, tag: e.target.value })}
                    placeholder="Ex: Gourmet & Café, Linha Minimalista"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={editingEditorial.ctaText || ""}
                    onChange={(e) => setEditingEditorial({ ...editingEditorial, ctaText: e.target.value })}
                    placeholder="Ex: Ver Coleção, Explorar Tech"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Categoria Vinculada</label>
                  <select
                    value={editingEditorial.categorySlug || ""}
                    onChange={(e) => setEditingEditorial({ ...editingEditorial, categorySlug: e.target.value })}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* IMAGE UPLOADER */}
                <div className="sm:col-span-2 pt-2">
                  <ImageUploader
                    images={editingEditorial.image ? [editingEditorial.image] : []}
                    onChange={(imgs) => setEditingEditorial({ ...editingEditorial, image: imgs[0] || "" })}
                    maxImages={1}
                    label="Imagem do Card Editorial (800 × 1000 px)"
                    helperText="Tamanho recomendado: 800 × 1000 px (Mínimo: 600 × 800 px). Proporção 4:5 vertical estilo vitrine. Arquivos JPG, PNG ou WebP."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditorialModalOpen(false);
                    setEditingEditorial(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditorial}
                  className="px-5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSavingEditorial ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Card</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
