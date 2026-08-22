import React, { useState } from "react";
import { Plus, Trash2, Edit3, FolderTree, Sparkles, X, Save, RefreshCw } from "lucide-react";
import { CategoryInfo } from "../../types";
import { ImageUploader } from "./ImageUploader";
import { saveAdminCategory, deleteAdminCategory } from "../../services/api";
import { useToast } from "../../context/ToastContext";

interface CategoryManagerProps {
  categories: CategoryInfo[];
  onCategoriesUpdated: (categories: CategoryInfo[]) => void;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  onCategoriesUpdated,
}) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<CategoryInfo> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingCategory({
      id: "",
      slug: "",
      name: "",
      description: "",
      image: "",
      itemCount: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat: CategoryInfo) => {
    setEditingCategory({ ...cat });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) {
      showToast("Preencha o nome da categoria.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const slug =
        editingCategory.slug ||
        editingCategory.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

      const id = editingCategory.id || slug;

      const fullCat: CategoryInfo = {
        id: id as any,
        slug,
        name: editingCategory.name,
        description: editingCategory.description || "Produtos selecionados com curadoria de excelência.",
        image:
          editingCategory.image ||
          "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
        itemCount: editingCategory.itemCount || 0,
      };

      const ok = await saveAdminCategory(fullCat);
      if (ok) {
        const exists = categories.some((c) => c.id === fullCat.id);
        const updated = exists
          ? categories.map((c) => (c.id === fullCat.id ? fullCat : c))
          : [...categories, fullCat];
        onCategoriesUpdated(updated);
        showToast("Categoria salva com sucesso!", "success");
        setIsModalOpen(false);
        setEditingCategory(null);
      } else {
        showToast("Erro ao gravar categoria.", "error");
      }
    } catch {
      showToast("Erro ao salvar categoria.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (catId: string, name: string) => {
    if (confirm(`Deseja realmente remover a categoria "${name}"?`)) {
      const ok = await deleteAdminCategory(catId);
      if (ok) {
        onCategoriesUpdated(categories.filter((c) => c.id !== catId));
        showToast(`Categoria "${name}" removida.`, "success");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-amber-600" />
            <span>Gerenciamento de Categorias</span>
          </h3>
          <p className="text-xs text-stone-500">
            Crie, altere nomes, edite descrições e faça upload de novas imagens de capa para as categorias.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-stone-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* CATEGORIES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between group hover:border-amber-300 transition-all"
          >
            <div>
              {/* IMAGE COVER */}
              <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                    Sem imagem de capa
                  </div>
                )}
                <span className="absolute bottom-2 left-2 bg-stone-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                  ID: {cat.id}
                </span>
              </div>

              {/* DETAILS */}
              <div className="p-4 space-y-1.5">
                <h4 className="font-bold text-sm text-stone-950">{cat.name}</h4>
                <p className="text-xs text-stone-500 line-clamp-2">{cat.description}</p>
                <div className="text-[11px] text-stone-400 font-mono">/categoria/{cat.slug}</div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(cat)}
                className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CATEGORY MODAL */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-950">
                {editingCategory.id && categories.some((c) => c.id === editingCategory.id)
                  ? "Editar Categoria"
                  : "Criar Nova Categoria"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCategory(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="Ex: Cafés Especiais, Aromaterapia & Velas, Bebidas Premium"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Identificador / Slug (opcional)</label>
                <input
                  type="text"
                  value={editingCategory.slug || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, slug: e.target.value })}
                  placeholder="cafes-especiais (gerado automaticamente se vazio)"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editingCategory.description || ""}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  placeholder="Frase curta que sintetiza os itens desta categoria..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              {/* IMAGE UPLOAD FOR CATEGORY */}
              <div>
                <ImageUploader
                  images={editingCategory.image ? [editingCategory.image] : []}
                  onChange={(imgs) => setEditingCategory({ ...editingCategory, image: imgs[0] || "" })}
                  maxImages={1}
                  label="Imagem de Capa da Categoria"
                  helperText="Faça upload da imagem de banner/card representativa desta categoria."
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-bold hover:bg-stone-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white font-bold flex items-center gap-1.5 shadow-md"
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Save className="w-4 h-4" />}
                  <span>Salvar Categoria</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
