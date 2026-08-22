import React, { useState } from "react";
import { Plus, Trash2, Edit3, Bookmark, Sparkles, X, Save, RefreshCw, Layers } from "lucide-react";
import { ProductCollection } from "../../types";
import { ImageUploader } from "./ImageUploader";
import { saveAdminCollection, deleteAdminCollection } from "../../services/api";
import { useToast } from "../../context/ToastContext";

interface CollectionManagerProps {
  collections: ProductCollection[];
  onCollectionsUpdated: (collections: ProductCollection[]) => void;
}

export const CollectionManager: React.FC<CollectionManagerProps> = ({
  collections,
  onCollectionsUpdated,
}) => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Partial<ProductCollection> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenNew = () => {
    setEditingCollection({
      id: "col-" + Math.floor(1000 + Math.random() * 9000),
      slug: "",
      name: "",
      description: "",
      image: "",
      featured: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (col: ProductCollection) => {
    setEditingCollection({ ...col });
    setIsModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCollection?.name) {
      showToast("Preencha o nome da coleção.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const slug =
        editingCollection.slug ||
        editingCollection.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");

      const id = editingCollection.id || "col-" + slug;

      const fullCol: ProductCollection = {
        id,
        slug,
        name: editingCollection.name,
        description: editingCollection.description || "Coleção especial selecionada a dedo com produtos e variações exclusivas.",
        image:
          editingCollection.image ||
          "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&auto=format&fit=crop",
        featured: editingCollection.featured !== false,
      };

      const ok = await saveAdminCollection(fullCol);
      if (ok) {
        const exists = collections.some((c) => c.id === fullCol.id);
        const updated = exists
          ? collections.map((c) => (c.id === fullCol.id ? fullCol : c))
          : [...collections, fullCol];
        onCollectionsUpdated(updated);
        showToast("Coleção salva com sucesso no Firestore!", "success");
        setIsModalOpen(false);
        setEditingCollection(null);
      } else {
        showToast("Erro ao salvar coleção.", "error");
      }
    } catch {
      showToast("Erro ao processar coleção.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (colId: string, name: string) => {
    if (confirm(`Deseja realmente remover a coleção "${name}"?`)) {
      const ok = await deleteAdminCollection(colId);
      if (ok) {
        onCollectionsUpdated(collections.filter((c) => c.id !== colId));
        showToast(`Coleção "${name}" removida.`, "success");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h3 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-amber-600" />
            <span>Gerenciamento de Coleções & Linhas Temáticas</span>
          </h3>
          <p className="text-xs text-stone-500">
            Agrupe produtos que compartilham o mesmo conceito, estilo ou múltiplas variações e cores.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-stone-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-stone-800 transition-colors shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Nova Coleção</span>
        </button>
      </div>

      {/* COLLECTIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((col) => (
          <div
            key={col.id}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between group hover:border-amber-300 transition-all"
          >
            <div>
              {/* COVER */}
              <div className="relative aspect-16/9 bg-stone-100 overflow-hidden">
                {col.image ? (
                  <img
                    src={col.image}
                    alt={col.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                    Sem imagem de capa
                  </div>
                )}
                {col.featured && (
                  <span className="absolute top-2 right-2 bg-amber-500 text-stone-950 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Destaque
                  </span>
                )}
                <span className="absolute bottom-2 left-2 bg-stone-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                  ID: {col.id}
                </span>
              </div>

              {/* DETAILS */}
              <div className="p-4 space-y-1.5">
                <h4 className="font-bold text-sm text-stone-950">{col.name}</h4>
                <p className="text-xs text-stone-500 line-clamp-2">{col.description}</p>
                <div className="text-[11px] text-stone-400 font-mono">/colecao/{col.slug}</div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="p-3 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(col)}
                className="px-3 py-1.5 text-xs font-bold text-stone-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-100 flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                onClick={() => handleDelete(col.id, col.name)}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* COLLECTION MODAL */}
      {isModalOpen && editingCollection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-base text-stone-950">
                {editingCollection.id && collections.some((c) => c.id === editingCollection.id)
                  ? "Editar Coleção"
                  : "Criar Nova Coleção"}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCollection(null);
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCollection} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nome da Coleção *</label>
                <input
                  type="text"
                  required
                  value={editingCollection.name || ""}
                  onChange={(e) => setEditingCollection({ ...editingCollection, name: e.target.value })}
                  placeholder="Ex: Coleção Barista & Café, Linha Minimalista Nordic, Gift Box Deluxe"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Slug / URL (opcional)</label>
                <input
                  type="text"
                  value={editingCollection.slug || ""}
                  onChange={(e) => setEditingCollection({ ...editingCollection, slug: e.target.value })}
                  placeholder="colecao-barista-cafe"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs focus:border-stone-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={editingCollection.description || ""}
                  onChange={(e) =>
                    setEditingCollection({ ...editingCollection, description: e.target.value })
                  }
                  placeholder="Texto inspirador sobre a história e acabamentos dos produtos desta coleção..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:border-stone-950 focus:outline-none"
                />
              </div>

              {/* IMAGE UPLOADER FOR COLLECTION */}
              <div>
                <ImageUploader
                  images={editingCollection.image ? [editingCollection.image] : []}
                  onChange={(imgs) => setEditingCollection({ ...editingCollection, image: imgs[0] || "" })}
                  maxImages={1}
                  label="Imagem de Capa da Coleção"
                  helperText="Faça upload da imagem que ilustra esta linha ou coleção."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                  <input
                    type="checkbox"
                    checked={editingCollection.featured !== false}
                    onChange={(e) =>
                      setEditingCollection({ ...editingCollection, featured: e.target.checked })
                    }
                    className="rounded text-stone-950"
                  />
                  <span>Destacar esta Coleção no site</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCollection(null);
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
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Salvar Coleção</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
