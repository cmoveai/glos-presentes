import React, { useState } from "react";
import { Plus, Trash2, Edit3, Layers, X, Tag } from "lucide-react";
import { ProductGrade } from "../../types";
import { Card } from "./Card";

interface GradeManagerProps {
  grades: ProductGrade[];
  onSaveGrade: (grade: ProductGrade) => void;
  onDeleteGrade: (gradeId: string) => void;
}

/**
 * 3.5 Grades & Matrizes de Variação (GradeManager) — glos.
 * Permite criar matrizes pré-configuradas (Volume, Tamanho, Aroma, Cor) para vincular aos produtos.
 */
export const GradeManager: React.FC<GradeManagerProps> = ({
  grades,
  onSaveGrade,
  onDeleteGrade,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Partial<ProductGrade> | null>(null);
  const [newOptionText, setNewOptionText] = useState("");

  const handleOpenNew = () => {
    setEditingGrade({
      id: `grade-${Date.now()}`,
      name: "",
      options: [],
      description: "",
    });
    setNewOptionText("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (grade: ProductGrade) => {
    setEditingGrade({ ...grade });
    setNewOptionText("");
    setIsModalOpen(true);
  };

  const handleAddOption = () => {
    if (newOptionText.trim() && editingGrade) {
      const current = editingGrade.options || [];
      if (!current.includes(newOptionText.trim())) {
        setEditingGrade({
          ...editingGrade,
          options: [...current, newOptionText.trim()],
        });
        setNewOptionText("");
      }
    }
  };

  const handleRemoveOption = (index: number) => {
    if (editingGrade && editingGrade.options) {
      setEditingGrade({
        ...editingGrade,
        options: editingGrade.options.filter((_, i) => i !== index),
      });
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrade?.name) return;

    const fullGrade: ProductGrade = {
      id: editingGrade.id || `grade-${Date.now()}`,
      name: editingGrade.name,
      options: editingGrade.options || [],
      description: editingGrade.description,
    };

    onSaveGrade(fullGrade);
    setIsModalOpen(false);
    setEditingGrade(null);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-[#272727]">
            Grades & Matrizes de Variação
          </h3>
          <p className="text-xs text-[#6B6A64]">
            Estruture conjuntos de variações padronizadas (Volumes, Fragrâncias, Dimensões)
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Criar grade</span>
        </button>
      </div>

      {/* Grid de Cards de Grade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {grades.map((grade) => (
          <Card key={grade.id} padding="md" className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-medium text-[#272727]">
                  {grade.name}
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(grade)}
                    className="p-1 rounded text-[#6B6A64] hover:text-[#004AAD] hover:bg-[#EEEDE8]"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteGrade(grade.id)}
                    className="p-1 rounded text-[#6B6A64] hover:text-[#9B2C2C] hover:bg-[#EEEDE8]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {grade.description && (
                <p className="text-[11px] text-[#6B6A64]">
                  {grade.description}
                </p>
              )}

              {/* Tags de Opções */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {grade.options.map((opt, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px] text-[#272727]"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#D6D3CC] text-[10px] text-[#9B998F]">
              {grade.options.length} variações cadastradas
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Criação / Edição de Grade */}
      {isModalOpen && editingGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden">
            <div className="p-4 border-b border-[#D6D3CC] flex items-center justify-between bg-[#EEEDE8]">
              <h3 className="text-sm font-medium text-[#272727]">
                {editingGrade.name ? `Editar ${editingGrade.name}` : "Nova Grade de Variações"}
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
                  Nome da Grade *
                </label>
                <input
                  type="text"
                  required
                  value={editingGrade.name || ""}
                  onChange={(e) =>
                    setEditingGrade({ ...editingGrade, name: e.target.value })
                  }
                  placeholder="Ex: Volume da Caneca / Fragrância da Vela"
                  className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Opções / Variações Cadastradas
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px] p-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]">
                  {editingGrade.options?.map((opt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-[#F4F3EF] border border-[#D6D3CC] text-[11px] text-[#272727]"
                    >
                      <span>{opt}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-[#9B998F] hover:text-[#9B2C2C]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {(!editingGrade.options || editingGrade.options.length === 0) && (
                    <span className="text-[11px] text-[#9B998F]">
                      Nenhuma variação adicionada ainda.
                    </span>
                  )}
                </div>

                {/* Input para adicionar nova opção */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Digite a opção (ex: 325ml) e clique +"
                    className="flex-1 px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-3 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Descrição (Opcional)
                </label>
                <input
                  type="text"
                  value={editingGrade.description || ""}
                  onChange={(e) =>
                    setEditingGrade({ ...editingGrade, description: e.target.value })
                  }
                  placeholder="Instruções internas sobre esta grade..."
                  className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
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
                  Salvar Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
