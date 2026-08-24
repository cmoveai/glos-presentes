import React, { useState } from "react";
import {
  FolderTree,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  RotateCcw,
  Sparkles,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { CategoryInfo } from "../../types";
import { saveAdminCategory, deleteAdminCategory } from "../../services/api";
import { generateCategorySlug, fetchCategories } from "../../lib/firebase";
import { CATEGORIES } from "../../data/categories";
import { useToast } from "../../context/ToastContext";
import { Card } from "./Card";
import { Button } from "./Button";
import { ImageUploader } from "./ImageUploader";

interface CategoryManagerProps {
  categories: CategoryInfo[];
  onCategoriesUpdated: (categories: CategoryInfo[]) => void;
}

/**
 * Tela de Gerenciamento de Categorias (CRUD) — glos.
 * Fonte: Montserrat (400 e 500 apenas), paleta Greige #E4E2DD, cartões #F4F3EF flat,
 * borda #D6D3CC, destaque único Cobalt #004AAD, números tabular-nums.
 */
export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCategoriesUpdated,
}) => {
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryInfo> | null>(null);
  const [isAutoSlug, setIsAutoSlug] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de confirmação de exclusão
  const [deleteConfirmCat, setDeleteConfirmCat] = useState<CategoryInfo | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ordenação ativa
  const sortedCategories = [...categories].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  const activeCount = sortedCategories.filter((c) => c.ativo !== false).length;
  const inactiveCount = sortedCategories.length - activeCount;

  const handleOpenNew = () => {
    const nextOrder = sortedCategories.length > 0
      ? Math.max(...sortedCategories.map((c) => c.ordem || 0)) + 1
      : 1;

    setEditingCategory({
      id: "",
      nome: "",
      slug: "",
      ativo: true,
      ordem: nextOrder,
      description: "",
      image: "",
      itemCount: 0,
    });
    setIsAutoSlug(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryInfo) => {
    setEditingCategory({
      id: cat.id,
      nome: cat.nome || cat.name || "",
      slug: cat.slug || "",
      ativo: cat.ativo !== false,
      ordem: cat.ordem ?? 1,
      description: cat.description || "",
      image: cat.image || "",
      itemCount: cat.itemCount || 0,
      highlightIconName: cat.highlightIconName,
    });
    setIsAutoSlug(false);
    setIsModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    if (!editingCategory) return;
    const updated: Partial<CategoryInfo> = {
      ...editingCategory,
      nome: name,
    };
    if (isAutoSlug) {
      updated.slug = generateCategorySlug(name);
    }
    setEditingCategory(updated);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.nome?.trim()) {
      showToast("Preencha o nome da categoria.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const nome = editingCategory.nome.trim();
      const slug = (editingCategory.slug?.trim() || generateCategorySlug(nome)).trim();
      const id = editingCategory.id || slug || `cat-${Date.now()}`;
      const ordem = Number(editingCategory.ordem) || 1;
      const ativo = editingCategory.ativo !== false;

      const fullCat: CategoryInfo = {
        id: id as any,
        nome,
        name: nome,
        slug,
        ativo,
        ordem,
        description: editingCategory.description?.trim() || "",
        image: editingCategory.image || "",
        itemCount: editingCategory.itemCount || 0,
        highlightIconName: editingCategory.highlightIconName || "Tag",
        active: ativo,
        order: ordem,
      };

      const ok = await saveAdminCategory(fullCat);
      if (ok) {
        const exists = categories.some((c) => c.id === fullCat.id);
        const updated = exists
          ? categories.map((c) => (c.id === fullCat.id ? fullCat : c))
          : [...categories, fullCat];

        updated.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
        onCategoriesUpdated(updated);

        showToast(
          exists ? `Categoria "${nome}" atualizada.` : `Categoria "${nome}" criada com sucesso.`,
          "success"
        );
        setIsModalOpen(false);
        setEditingCategory(null);
      } else {
        showToast("Não foi possível salvar a categoria.", "error");
      }
    } catch (err) {
      console.error("Erro ao salvar categoria:", err);
      showToast("Erro ao processar salvamento.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle rápido de Ativo / Inativo
  const handleToggleAtivo = async (cat: CategoryInfo) => {
    const newAtivo = cat.ativo === false ? true : false;
    const updatedCat: CategoryInfo = {
      ...cat,
      ativo: newAtivo,
      active: newAtivo,
    };

    const updatedList = categories.map((c) => (c.id === cat.id ? updatedCat : c));
    onCategoriesUpdated(updatedList);

    await saveAdminCategory(updatedCat);
    showToast(
      newAtivo
        ? `Categoria "${cat.nome || cat.name}" agora está visível na loja.`
        : `Categoria "${cat.nome || cat.name}" agora está oculta na loja.`,
      "success"
    );
  };

  // Alterar ordem (subir / descer)
  const handleMoveOrder = async (cat: CategoryInfo, direction: "up" | "down") => {
    const currentIndex = sortedCategories.findIndex((c) => c.id === cat.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sortedCategories.length) return;

    const targetCat = sortedCategories[targetIndex];

    const currentOrder = cat.ordem ?? currentIndex + 1;
    const targetOrder = targetCat.ordem ?? targetIndex + 1;

    // Troca ordens
    const updatedCurrent = { ...cat, ordem: targetOrder, order: targetOrder };
    const updatedTarget = { ...targetCat, ordem: currentOrder, order: currentOrder };

    const newCategories = categories.map((c) => {
      if (c.id === cat.id) return updatedCurrent;
      if (c.id === targetCat.id) return updatedTarget;
      return c;
    });

    newCategories.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    onCategoriesUpdated(newCategories);

    await Promise.all([
      saveAdminCategory(updatedCurrent),
      saveAdminCategory(updatedTarget),
    ]);

    showToast(`Ordem de exibição atualizada.`, "success");
  };

  // Confirmar e excluir categoria
  const handleConfirmDelete = async () => {
    if (!deleteConfirmCat) return;
    setIsDeleting(true);
    try {
      const catId = deleteConfirmCat.id;
      const catName = deleteConfirmCat.nome || deleteConfirmCat.name || "Categoria";
      const ok = await deleteAdminCategory(catId);
      if (ok) {
        const filtered = categories.filter((c) => c.id !== catId);
        onCategoriesUpdated(filtered);
        showToast(`Categoria "${catName}" excluída com sucesso.`, "success");
        setDeleteConfirmCat(null);
      } else {
        showToast("Não foi possível excluir a categoria.", "error");
      }
    } catch (err) {
      console.error("Erro ao deletar categoria:", err);
      showToast("Erro ao excluir categoria.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Restaurar as 8 categorias padrão da Glos
  const handleRestoreDefaults = async () => {
    if (
      !confirm(
        "Deseja restaurar as 8 categorias oficiais da Glos? Isso adicionará as categorias padrão ao seu catálogo."
      )
    ) {
      return;
    }

    try {
      const restored: CategoryInfo[] = [];
      for (const cat of CATEGORIES) {
        const fullCat: CategoryInfo = {
          ...cat,
          nome: cat.nome || cat.name || "",
          name: cat.nome || cat.name || "",
          ativo: true,
          active: true,
          ordem: cat.ordem || 1,
          order: cat.ordem || 1,
        };
        await saveAdminCategory(fullCat);
        restored.push(fullCat);
      }
      onCategoriesUpdated(restored);
      showToast("8 categorias padrão da Glos restauradas com sucesso!", "success");
    } catch (e) {
      console.error("Erro ao restaurar categorias:", e);
      showToast("Erro ao restaurar categorias.", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-full">
      {/* BARRA SUPERIOR DE AÇÕES & RESUMO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#F4F3EF] p-5 rounded-[8px] border border-[#D6D3CC]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#004AAD]" />
            <h3 className="text-sm font-medium text-[#272727]">
              Catálogo de Categorias
            </h3>
            <span className="text-xs font-normal text-[#6B6A64] tabular-nums">
              ({sortedCategories.length} {sortedCategories.length === 1 ? "categoria" : "categorias"})
            </span>
          </div>
          <p className="text-xs font-normal text-[#6B6A64]">
            Organize os departamentos da loja de presentes. Categorias ativas aparecem diretamente no menu e filtros da loja virtual.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNew}
            icon={Plus}
          >
            Nova categoria
          </Button>
        </div>
      </div>

      {/* MÉTRICAS DE RESUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-normal uppercase tracking-wider text-[#9B998F]">
            Total de Categorias
          </span>
          <p className="text-2xl font-medium text-[#272727] tabular-nums">
            {sortedCategories.length}
          </p>
          <p className="text-[11px] font-normal text-[#6B6A64]">
            Cadastradas no banco Firestore
          </p>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-normal uppercase tracking-wider text-[#9B998F]">
            Ativas na Loja
          </span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-medium text-[#272727] tabular-nums">
              {activeCount}
            </p>
            <span className="text-[10px] font-medium text-[#0F7A4F] bg-[#EEEDE8] px-2 py-0.5 rounded-[4px] border border-[#D6D3CC]">
              Visíveis aos clientes
            </span>
          </div>
          <p className="text-[11px] font-normal text-[#6B6A64]">
            Exibidas na navegação e vitrines
          </p>
        </Card>

        <Card padding="md" className="space-y-1">
          <span className="text-[11px] font-normal uppercase tracking-wider text-[#9B998F]">
            Ocultas / Inativas
          </span>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-medium text-[#272727] tabular-nums">
              {inactiveCount}
            </p>
            {inactiveCount > 0 ? (
              <span className="text-[10px] font-medium text-[#6B6A64] bg-[#EEEDE8] px-2 py-0.5 rounded-[4px] border border-[#D6D3CC]">
                Pausadas
              </span>
            ) : (
              <span className="text-[10px] font-normal text-[#9B998F]">
                Nenhuma oculta
              </span>
            )}
          </div>
          <p className="text-[11px] font-normal text-[#6B6A64]">
            Salvas sem exibição pública
          </p>
        </Card>
      </div>

      {/* LISTAGEM DE CATEGORIAS */}
      {sortedCategories.length === 0 ? (
        /* ESTADO VAZIO HONESTO */
        <Card padding="lg" className="border-dashed border-[#D6D3CC]">
          <div className="text-center py-12 max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-[8px] bg-[#EEEDE8] text-[#004AAD] flex items-center justify-center mx-auto border border-[#D6D3CC]">
              <FolderTree className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-[#272727]">
                Nenhuma categoria cadastrada
              </h4>
              <p className="text-xs font-normal text-[#6B6A64] leading-relaxed">
                As categorias organizam seus presentes em departamentos e facilitam a navegação dos clientes na loja.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenNew}
                icon={Plus}
              >
                Criar primeira categoria
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRestoreDefaults}
                icon={RotateCcw}
              >
                Restaurar 8 padrões Glos
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#D6D3CC] bg-[#EEEDE8] text-[11px] font-medium text-[#6B6A64] uppercase tracking-wider">
                  <th className="py-3 px-4 w-16 text-center">Ordem</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 hidden md:table-cell">Slug / URL</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Status na Loja</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D3CC] text-xs">
                {sortedCategories.map((cat, index) => {
                  const isAtiva = cat.ativo !== false;
                  const displayName = cat.nome || cat.name || cat.id;
                  const displaySlug = cat.slug || generateCategorySlug(displayName);

                  return (
                    <tr
                      key={cat.id}
                      className={`hover:bg-[#EEEDE8] transition-colors ${
                        !isAtiva ? "opacity-75 bg-[#E4E2DD]/30" : ""
                      }`}
                    >
                      {/* ORDEM */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className="w-6 h-6 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-center font-normal text-[#272727] tabular-nums text-[11px]">
                            {cat.ordem ?? index + 1}
                          </span>
                          <div className="flex flex-col gap-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(cat, "up")}
                              disabled={index === 0}
                              className={`p-0.5 rounded-[2px] transition-colors ${
                                index === 0
                                  ? "text-[#9B998F] opacity-30 cursor-not-allowed"
                                  : "text-[#6B6A64] hover:text-[#004AAD] hover:bg-[#D6D3CC]/40"
                              }`}
                              title="Subir posição"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(cat, "down")}
                              disabled={index === sortedCategories.length - 1}
                              className={`p-0.5 rounded-[2px] transition-colors ${
                                index === sortedCategories.length - 1
                                  ? "text-[#9B998F] opacity-30 cursor-not-allowed"
                                  : "text-[#6B6A64] hover:text-[#004AAD] hover:bg-[#D6D3CC]/40"
                              }`}
                              title="Descer posição"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* CATEGORIA (IMAGEM + NOME + DESCRIÇÃO) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {cat.image ? (
                            <img
                              src={cat.image}
                              alt={displayName}
                              className="w-10 h-10 rounded-[6px] object-cover border border-[#D6D3CC] shrink-0 bg-[#EEEDE8]"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-center text-[#9B998F] shrink-0">
                              <FolderTree className="w-4 h-4 text-[#6B6A64]" />
                            </div>
                          )}
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-[#272727] text-sm">
                                {displayName}
                              </span>
                              {!isAtiva && (
                                <span className="text-[10px] font-normal text-[#6B6A64] bg-[#EEEDE8] px-1.5 py-0.5 rounded-[4px] border border-[#D6D3CC]">
                                  Oculta
                                </span>
                              )}
                            </div>
                            {cat.description && (
                              <p className="text-[11px] font-normal text-[#6B6A64] line-clamp-1 max-w-md">
                                {cat.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* SLUG */}
                      <td className="py-3.5 px-4 hidden md:table-cell font-mono text-[11px] text-[#6B6A64]">
                        <span className="bg-[#EEEDE8] px-2 py-1 rounded-[4px] border border-[#D6D3CC]/60 inline-block">
                          /categoria/{displaySlug}
                        </span>
                      </td>

                      {/* STATUS ATIVO */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <button
                          type="button"
                          onClick={() => handleToggleAtivo(cat)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-normal border transition-colors ${
                            isAtiva
                              ? "bg-[#F4F3EF] border-[#D6D3CC] text-[#0F7A4F] hover:bg-[#EEEDE8]"
                              : "bg-[#EEEDE8] border-[#D6D3CC] text-[#6B6A64] hover:bg-[#D6D3CC]/40"
                          }`}
                          title={isAtiva ? "Clique para desativar e ocultar da loja" : "Clique para ativar na loja"}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isAtiva ? "bg-[#0F7A4F]" : "bg-[#9B998F]"
                            }`}
                          />
                          <span>{isAtiva ? "Ativa" : "Inativa"}</span>
                        </button>
                      </td>

                      {/* AÇÕES */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAtivo(cat)}
                            className="p-1.5 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
                            title={isAtiva ? "Desativar (ocultar da loja)" : "Ativar (exibir na loja)"}
                          >
                            {isAtiva ? (
                              <Eye className="w-4 h-4 text-[#0F7A4F]" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-[#9B998F]" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 rounded-[6px] text-[#6B6A64] hover:text-[#004AAD] hover:bg-[#EEEDE8] transition-colors"
                            title="Editar categoria"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteConfirmCat(cat)}
                            className="p-1.5 rounded-[6px] text-[#6B6A64] hover:text-[#9B2C2C] hover:bg-[#EEEDE8] transition-colors"
                            title="Excluir categoria"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CATEGORIA */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-[#F4F3EF] w-full max-w-lg rounded-[8px] p-6 border border-[#D6D3CC] space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 select-none">
            <div className="flex items-center justify-between pb-3 border-b border-[#D6D3CC]">
              <div className="space-y-0.5">
                <h3 className="text-base font-medium text-[#272727]">
                  {editingCategory.id && categories.some((c) => c.id === editingCategory.id)
                    ? "Editar Categoria"
                    : "Nova Categoria"}
                </h3>
                <p className="text-xs font-normal text-[#6B6A64]">
                  Preencha as informações para organizar os presentes na loja.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                }}
                className="p-1.5 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              {/* NOME */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#272727]">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.nome || ""}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Cozinha & Mesa, Kits Presenteáveis, Eletrônicos & Tech"
                  className="w-full px-3 py-2 bg-[#E4E2DD] border border-[#D6D3CC] rounded-[6px] text-xs font-normal text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              {/* SLUG */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#272727]">
                    Slug / URL da Categoria
                  </label>
                  <label className="flex items-center gap-1.5 text-[11px] font-normal text-[#6B6A64] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAutoSlug}
                      onChange={(e) => {
                        setIsAutoSlug(e.target.checked);
                        if (e.target.checked && editingCategory.nome) {
                          setEditingCategory({
                            ...editingCategory,
                            slug: generateCategorySlug(editingCategory.nome),
                          });
                        }
                      }}
                      className="rounded text-[#004AAD] focus:ring-0"
                    />
                    <span>Gerar automático</span>
                  </label>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-mono text-[11px] text-[#9B998F] select-none">
                    /categoria/
                  </span>
                  <input
                    type="text"
                    required
                    disabled={isAutoSlug}
                    value={editingCategory.slug || ""}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                      })
                    }
                    placeholder="cozinha-mesa"
                    className={`w-full pl-24 pr-3 py-2 bg-[#E4E2DD] border border-[#D6D3CC] rounded-[6px] text-xs font-mono text-[#272727] focus:outline-none focus:border-[#004AAD] ${
                      isAutoSlug ? "bg-[#EEEDE8] text-[#6B6A64]" : ""
                    }`}
                  />
                </div>
              </div>

              {/* ORDEM & ATIVO */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#272727]">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingCategory.ordem ?? 1}
                    onChange={(e) =>
                      setEditingCategory({
                        ...editingCategory,
                        ordem: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#E4E2DD] border border-[#D6D3CC] rounded-[6px] text-xs font-normal text-[#272727] tabular-nums focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#272727]">
                    Status de Visibilidade
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-[#E4E2DD] border border-[#D6D3CC] rounded-[6px] cursor-pointer hover:bg-[#EEEDE8] transition-colors mt-0.5">
                    <input
                      type="checkbox"
                      checked={editingCategory.ativo !== false}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          ativo: e.target.checked,
                        })
                      }
                      className="rounded text-[#004AAD] focus:ring-0"
                    />
                    <span className="text-xs font-normal text-[#272727]">
                      {editingCategory.ativo !== false ? "Ativa na loja" : "Oculta na loja"}
                    </span>
                  </label>
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-[#272727]">
                  Descrição Resumida (opcional)
                </label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ""}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      description: e.target.value,
                    })
                  }
                  placeholder="Frase curta que sintetiza os presentes desta categoria..."
                  className="w-full px-3 py-2 bg-[#E4E2DD] border border-[#D6D3CC] rounded-[6px] text-xs font-normal text-[#272727] focus:outline-none focus:border-[#004AAD] resize-none"
                />
              </div>

              {/* IMAGEM DE CAPA */}
              <div className="space-y-1 pt-1">
                <ImageUploader
                  images={editingCategory.image ? [editingCategory.image] : []}
                  onChange={(imgs) =>
                    setEditingCategory({
                      ...editingCategory,
                      image: imgs[0] || "",
                    })
                  }
                  maxImages={1}
                  label="Imagem de Capa da Categoria"
                  helperText="Upload ou link de imagem de referência para vitrines e cartões da loja."
                />
              </div>

              {/* BOTÕES DE AÇÃO */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#D6D3CC]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving ? "Salvando..." : "Salvar categoria"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {deleteConfirmCat && (
        <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="bg-[#F4F3EF] w-full max-w-md rounded-[8px] p-6 border border-[#D6D3CC] space-y-4 animate-in fade-in zoom-in-95 select-none">
            <div className="flex items-center gap-3 text-[#9B2C2C]">
              <div className="w-9 h-9 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-[#9B2C2C]" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#272727]">
                  Excluir Categoria
                </h4>
                <p className="text-xs font-normal text-[#6B6A64]">
                  Confirmar remoção permanente
                </p>
              </div>
            </div>

            <p className="text-xs font-normal text-[#6B6A64] leading-relaxed">
              Deseja realmente remover a categoria{" "}
              <strong className="font-medium text-[#272727]">
                "{deleteConfirmCat.nome || deleteConfirmCat.name}"
              </strong>
              ? Os produtos vinculados a ela não serão excluídos, mas perderão a referência de categoria ativa.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#D6D3CC]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmCat(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Excluindo..." : "Sim, excluir categoria"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
