import React, { useState } from "react";
import { Plus, Trash2, Edit3, Image as ImageIcon, Check, X, Layers, Sparkles } from "lucide-react";
import { ProductVariant } from "../../types";
import { ImageUploader } from "./ImageUploader";

interface VariantManagerProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

export const VariantManager: React.FC<VariantManagerProps> = ({ variants, onChange }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Partial<ProductVariant> | null>(null);

  // Quick preset palette for ease of use
  const COLOR_PRESETS = [
    { name: "Preto Matte", hex: "#1c1917" },
    { name: "Branco Off-White", hex: "#f5f5f4" },
    { name: "Verde Sálvia", hex: "#84a98c" },
    { name: "Terracota", hex: "#b45309" },
    { name: "Azul Petróleo", hex: "#1e3a8a" },
    { name: "Rosa Quartzo", hex: "#fbcfe8" },
    { name: "Inox / Prata", hex: "#cbd5e1" },
    { name: "Dourado / Champanhe", hex: "#eab308" },
    { name: "Madeira Nogueira", hex: "#78350f" },
  ];

  const handleOpenAdd = () => {
    setEditingVariant({
      id: "var-" + Math.floor(1000 + Math.random() * 9000),
      name: "",
      colorHex: "#1c1917",
      inStock: true,
      stock: 10,
      image: "",
    });
    setIsAdding(true);
  };

  const handleSaveVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVariant?.name) return;

    const fullVariant: ProductVariant = {
      id: editingVariant.id || "var-" + Math.floor(1000 + Math.random() * 9000),
      name: editingVariant.name,
      colorHex: editingVariant.colorHex || "#1c1917",
      inStock: editingVariant.inStock !== false,
      stock: Number(editingVariant.stock) || 10,
      image: editingVariant.image || "",
      priceModifier: editingVariant.priceModifier ? Number(editingVariant.priceModifier) : undefined,
    };

    const exists = variants.some((v) => v.id === fullVariant.id);
    if (exists) {
      onChange(variants.map((v) => (v.id === fullVariant.id ? fullVariant : v)));
    } else {
      onChange([...variants, fullVariant]);
    }

    setEditingVariant(null);
    setIsAdding(false);
  };

  const handleRemoveVariant = (id: string) => {
    onChange(variants.filter((v) => v.id !== id));
  };

  const handleEditVariant = (v: ProductVariant) => {
    setEditingVariant({ ...v });
    setIsAdding(true);
  };

  return (
    <div className="space-y-3 bg-stone-50/80 p-4 rounded-2xl border border-stone-200">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 font-bold text-xs text-stone-900">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Variações do Produto (Cores, Modelos, Acabamentos)</span>
          </div>
          <p className="text-[11px] text-stone-500">
            Permite que o cliente escolha a cor, acabamento ou modelo na página do produto.
          </p>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3 py-1.5 bg-stone-950 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-stone-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Variação</span>
          </button>
        )}
      </div>

      {/* FORM MODAL / EXPANDED INLINE */}
      {isAdding && editingVariant && (
        <div className="bg-white p-4 rounded-xl border border-amber-300 shadow-sm space-y-3 text-xs animate-in fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="font-bold text-stone-900">
              {editingVariant.id && variants.some((v) => v.id === editingVariant.id)
                ? "Editar Variação"
                : "Nova Variação"}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingVariant(null);
              }}
              className="text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Nome da Cor / Variação *</label>
              <input
                type="text"
                required
                value={editingVariant.name || ""}
                onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                placeholder="Ex: Verde Sálvia, Preto Fosco, Inox 500ml"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Cor Hexadecimal (Círculo)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editingVariant.colorHex || "#1c1917"}
                  onChange={(e) => setEditingVariant({ ...editingVariant, colorHex: e.target.value })}
                  className="w-9 h-8 p-0 border border-stone-300 rounded cursor-pointer shrink-0"
                />
                <input
                  type="text"
                  value={editingVariant.colorHex || "#1c1917"}
                  onChange={(e) => setEditingVariant({ ...editingVariant, colorHex: e.target.value })}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs uppercase font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* QUICK COLOR PALETTES */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">Paleta Rápida:</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() =>
                      setEditingVariant({
                        ...editingVariant,
                        name: editingVariant.name || p.name,
                        colorHex: p.hex,
                      })
                    }
                    className="flex items-center gap-1.5 px-2 py-1 bg-stone-100 hover:bg-stone-200 rounded-md text-[10px] font-medium text-stone-700 transition-colors"
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-stone-400" style={{ backgroundColor: p.hex }} />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* VARIANT IMAGE UPLOAD */}
            <div className="sm:col-span-2">
              <ImageUploader
                images={editingVariant.image ? [editingVariant.image] : []}
                onChange={(imgs) => setEditingVariant({ ...editingVariant, image: imgs[0] || "" })}
                maxImages={1}
                label="Foto Específica desta Variação (Opcional)"
                helperText="Ao selecionar esta cor no site, a foto principal do produto mudará para esta."
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Estoque Desta Variação</label>
              <input
                type="number"
                value={editingVariant.stock ?? 10}
                onChange={(e) => setEditingVariant({ ...editingVariant, stock: parseInt(e.target.value) || 0 })}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-800">
                <input
                  type="checkbox"
                  checked={editingVariant.inStock !== false}
                  onChange={(e) => setEditingVariant({ ...editingVariant, inStock: e.target.checked })}
                  className="rounded text-stone-900"
                />
                <span>Disponível para venda</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingVariant(null);
              }}
              className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-semibold text-stone-600 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveVariant}
              className="px-4 py-1.5 bg-stone-950 text-white rounded-lg text-xs font-bold hover:bg-stone-800"
            >
              Salvar Variação
            </button>
          </div>
        </div>
      )}

      {/* VARIANTS LIST */}
      {variants.length === 0 && !isAdding ? (
        <div className="text-center py-4 text-xs text-stone-500 bg-white rounded-xl border border-dashed border-stone-200">
          Nenhuma variação criada. O produto será vendido com opção única.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {variants.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-stone-200 shadow-2xs"
            >
              <div className="flex items-center gap-2.5">
                {v.image ? (
                  <img
                    src={v.image}
                    alt={v.name}
                    className="w-9 h-9 rounded-lg object-cover border border-stone-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className="w-9 h-9 rounded-lg border border-stone-300 shadow-2xs flex items-center justify-center"
                    style={{ backgroundColor: v.colorHex || "#1c1917" }}
                  />
                )}
                <div>
                  <h4 className="font-bold text-xs text-stone-900">{v.name}</h4>
                  <p className="text-[10px] text-stone-500 flex items-center gap-2">
                    <span>Estoque: {v.stock ?? 10} un</span>
                    <span>•</span>
                    <span className={v.inStock ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                      {v.inStock ? "Ativo" : "Esgotado"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleEditVariant(v)}
                  className="p-1.5 text-stone-500 hover:text-stone-900 rounded hover:bg-stone-100"
                  title="Editar"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(v.id)}
                  className="p-1.5 text-rose-600 hover:text-rose-800 rounded hover:bg-rose-50"
                  title="Excluir"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
