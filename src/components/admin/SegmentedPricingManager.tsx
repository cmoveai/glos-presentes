import React, { useState } from "react";
import { Plus, Trash2, Edit3, DollarSign, Users, Sparkles, CheckCircle2, X } from "lucide-react";
import { Product, SegmentedPriceRule } from "../../types";
import { Card } from "./Card";

interface SegmentedPricingManagerProps {
  products: Product[];
  rules: SegmentedPriceRule[];
  onSaveRule: (rule: SegmentedPriceRule) => void;
  onDeleteRule: (ruleId: string) => void;
}

/**
 * 3.6 Preços Segmentados (SegmentedPricingManager) — glos.
 * Permite configurar tabelas de preços personalizadas para clientes VIP, Revendedores e Pedidos Corporativos.
 */
export const SegmentedPricingManager: React.FC<SegmentedPricingManagerProps> = ({
  products,
  rules,
  onSaveRule,
  onDeleteRule,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<SegmentedPriceRule> | null>(null);

  const handleOpenNew = () => {
    setEditingRule({
      id: `seg-${Date.now()}`,
      productId: products[0]?.id || "",
      customerGroup: "vip",
      price: products[0]?.price ? Math.round(products[0].price * 0.9) : 99.9,
      minQuantity: 1,
      marginPercent: 28.0,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule?.productId || !editingRule.price) return;

    const fullRule: SegmentedPriceRule = {
      id: editingRule.id || `seg-${Date.now()}`,
      productId: editingRule.productId,
      customerGroup: editingRule.customerGroup || "vip",
      price: editingRule.price,
      minQuantity: editingRule.minQuantity || 1,
      marginPercent: editingRule.marginPercent || 25,
      region: editingRule.region,
    };

    onSaveRule(fullRule);
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const getGroupName = (group: string) => {
    switch (group) {
      case "vip":
        return "Cliente VIP (Clube de Afeto)";
      case "corporativo":
        return "Corporativo / Brindes Especiais";
      case "revendedor":
        return "Revendedor Autorizado";
      default:
        return "Padrão";
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-[#272727]">
            Tabelas de Preço & Regras Segmentadas
          </h3>
          <p className="text-xs text-[#6B6A64]">
            Preços especiais automáticos para grupos de clientes e compras em volume
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Criar regra de preço</span>
        </button>
      </div>

      <Card padding="none" className="w-full overflow-hidden">
        <table className="w-full text-left text-xs text-[#272727]">
          <thead>
            <tr className="border-b border-[#D6D3CC] bg-[#EEEDE8] text-[11px] text-[#9B998F] uppercase tracking-wider">
              <th className="py-3 px-4 font-normal">Produto</th>
              <th className="py-3 px-4 font-normal">Grupo de Clientes</th>
              <th className="py-3 px-4 font-normal text-right">Qtd. Mínima</th>
              <th className="py-3 px-4 font-normal text-right">Preço Praticado</th>
              <th className="py-3 px-4 font-normal text-right">Margem Preservada</th>
              <th className="py-3 px-4 font-normal text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6D3CC]">
            {rules.map((rule) => {
              const prod = products.find((p) => p.id === rule.productId);
              return (
                <tr key={rule.id} className="hover:bg-[#EEEDE8] transition-colors">
                  <td className="py-3 px-4 font-medium text-[#272727]">
                    {prod?.name || "Produto genérico"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#004AAD] font-medium">
                      <Users className="w-3.5 h-3.5" />
                      <span>{getGroupName(rule.customerGroup)}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    {rule.minQuantity || 1} un.
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-[#272727] tabular-nums">
                    R$ {rule.price.toFixed(2).replace(".", ",")}
                  </td>
                  <td className="py-3 px-4 text-right text-[#0F7A4F] tabular-nums font-medium">
                    {rule.marginPercent ? `${rule.marginPercent}%` : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onDeleteRule(rule.id)}
                      className="p-1 rounded text-[#6B6A64] hover:text-[#9B2C2C]"
                      title="Excluir regra"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Modal */}
      {isModalOpen && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden">
            <div className="p-4 border-b border-[#D6D3CC] flex items-center justify-between bg-[#EEEDE8]">
              <h3 className="text-sm font-medium text-[#272727]">
                Nova Regra de Preço Segmentado
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
                  Produto Alvo *
                </label>
                <select
                  value={editingRule.productId}
                  onChange={(e) =>
                    setEditingRule({ ...editingRule, productId: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (R$ {p.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Grupo de Clientes *
                </label>
                <select
                  value={editingRule.customerGroup}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      customerGroup: e.target.value as any,
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                >
                  <option value="vip">Cliente VIP (Clube de Afeto)</option>
                  <option value="corporativo">Corporativo / Brindes Especiais</option>
                  <option value="revendedor">Revendedor Autorizado</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#6B6A64] mb-1">
                    Preço Especial (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingRule.price || ""}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#6B6A64] mb-1">
                    Qtd. Mínima (unidades)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingRule.minQuantity || 1}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        minQuantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
                  />
                </div>
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
                  Salvar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
