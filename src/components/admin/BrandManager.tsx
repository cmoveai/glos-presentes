import React, { useState } from "react";
import { Plus, Trash2, Edit3, Tag, Sparkles, CheckCircle2, X, Globe, Save } from "lucide-react";
import { ProductBrand } from "../../types";
import { Card } from "./Card";

interface BrandManagerProps {
  brands: ProductBrand[];
  onSaveBrand: (brand: ProductBrand) => void;
  onDeleteBrand: (brandId: string) => void;
}

/**
 * 3.4 Marcas & Linhas (BrandManager) — glos.
 * Gestão de marcas próprias, ateliê e linhas licenciadas parceiras.
 */
export const BrandManager: React.FC<BrandManagerProps> = ({
  brands,
  onSaveBrand,
  onDeleteBrand,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Partial<ProductBrand> | null>(null);

  const handleOpenNew = () => {
    setEditingBrand({
      id: `brand-${Date.now()}`,
      name: "",
      slug: "",
      description: "",
      logoUrl: "",
      active: true,
      featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (brand: ProductBrand) => {
    setEditingBrand({ ...brand });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand?.name) return;

    const slug =
      editingBrand.slug ||
      editingBrand.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

    const fullBrand: ProductBrand = {
      id: editingBrand.id || `brand-${Date.now()}`,
      name: editingBrand.name,
      slug,
      description: editingBrand.description || "",
      logoUrl: editingBrand.logoUrl,
      active: editingBrand.active ?? true,
      featured: editingBrand.featured ?? false,
      tagTitle: editingBrand.tagTitle || `${editingBrand.name} | Glos Presentes`,
      metaDescription: editingBrand.metaDescription || editingBrand.description,
    };

    onSaveBrand(fullBrand);
    setIsModalOpen(false);
    setEditingBrand(null);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header com Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-[#272727]">
            Marcas & Linhas Autorizadas
          </h3>
          <p className="text-xs text-[#6B6A64]">
            Organize os fabricantes, ateliês autorizados e franquias de licença
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Criar marca</span>
        </button>
      </div>

      {/* Tabela de Marcas */}
      <Card padding="none" className="w-full overflow-hidden">
        <table className="w-full text-left text-xs text-[#272727]">
          <thead>
            <tr className="border-b border-[#D6D3CC] bg-[#EEEDE8] text-[11px] text-[#9B998F] uppercase tracking-wider">
              <th className="py-3 px-4 font-normal">Marca / Linha</th>
              <th className="py-3 px-4 font-normal">Slug / URL</th>
              <th className="py-3 px-4 font-normal">Descrição</th>
              <th className="py-3 px-4 font-normal text-center">Destaque</th>
              <th className="py-3 px-4 font-normal text-center">Status</th>
              <th className="py-3 px-4 font-normal text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6D3CC]">
            {brands.map((b) => (
              <tr key={b.id} className="hover:bg-[#EEEDE8] transition-colors">
                <td className="py-3 px-4 font-medium text-[#272727]">
                  {b.name}
                </td>
                <td className="py-3 px-4 font-mono text-[11px] text-[#6B6A64]">
                  /{b.slug}
                </td>
                <td className="py-3 px-4 text-[#6B6A64] max-w-xs truncate">
                  {b.description || "—"}
                </td>
                <td className="py-3 px-4 text-center">
                  {b.featured ? (
                    <span className="text-[11px] text-[#004AAD] font-medium">Sim</span>
                  ) : (
                    <span className="text-[11px] text-[#9B998F]">Não</span>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px]">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        b.active ? "bg-[#0F7A4F]" : "bg-[#9B998F]"
                      }`}
                    />
                    <span className={b.active ? "text-[#272727]" : "text-[#9B998F]"}>
                      {b.active ? "Ativa" : "Inativa"}
                    </span>
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(b)}
                      className="p-1 rounded-[4px] text-[#6B6A64] hover:text-[#004AAD] hover:bg-[#EEEDE8]"
                      title="Editar marca"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteBrand(b.id)}
                      className="p-1 rounded-[4px] text-[#6B6A64] hover:text-[#9B2C2C] hover:bg-[#EEEDE8]"
                      title="Excluir marca"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Modal de Criação / Edição de Marca */}
      {isModalOpen && editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden">
            <div className="p-4 border-b border-[#D6D3CC] flex items-center justify-between bg-[#EEEDE8]">
              <h3 className="text-sm font-medium text-[#272727]">
                {editingBrand.name ? `Editar ${editingBrand.name}` : "Nova Marca / Linha"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-[#6B6A64] hover:text-[#272727]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Nome da Marca *
                </label>
                <input
                  type="text"
                  required
                  value={editingBrand.name || ""}
                  onChange={(e) =>
                    setEditingBrand({ ...editingBrand, name: e.target.value })
                  }
                  placeholder="Ex: Peanuts Worldwide / Snoopy"
                  className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Slug URL
                </label>
                <input
                  type="text"
                  value={editingBrand.slug || ""}
                  onChange={(e) =>
                    setEditingBrand({ ...editingBrand, slug: e.target.value })
                  }
                  placeholder="peanuts-snoopy"
                  className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] font-mono text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Descrição Editorial
                </label>
                <textarea
                  rows={3}
                  value={editingBrand.description || ""}
                  onChange={(e) =>
                    setEditingBrand({ ...editingBrand, description: e.target.value })
                  }
                  placeholder="Linha licenciada oficial com arte exclusiva..."
                  className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-[#D6D3CC]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBrand.active ?? true}
                    onChange={(e) =>
                      setEditingBrand({ ...editingBrand, active: e.target.checked })
                    }
                    className="rounded text-[#004AAD]"
                  />
                  <span>Marca Ativa</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBrand.featured ?? false}
                    onChange={(e) =>
                      setEditingBrand({ ...editingBrand, featured: e.target.checked })
                    }
                    className="rounded text-[#004AAD]"
                  />
                  <span>Destacar na Vitrine</span>
                </label>
              </div>

              <div className="pt-3 border-t border-[#D6D3CC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-[6px] bg-[#EEEDE8] text-[#6B6A64] hover:text-[#272727]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-[#004AAD] text-white font-medium hover:bg-[#003884]"
                >
                  Salvar Marca
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
