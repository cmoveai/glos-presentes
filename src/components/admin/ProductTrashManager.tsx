import React from "react";
import { Trash2, RefreshCw, AlertTriangle, ArrowLeft, Package, CheckCircle2 } from "lucide-react";
import { Product } from "../../types";
import { Card } from "./Card";

interface ProductTrashManagerProps {
  deletedProducts: Product[];
  onRestoreProduct: (productId: string) => void;
  onPermanentDeleteProduct: (productId: string) => void;
  onEmptyTrash: () => void;
  onBackToList: () => void;
}

/**
 * 3.9 Lixeira de Produtos (ProductTrashManager) — glos.
 * Lista de produtos desativados/excluídos com restauração instantânea ou expurgo definitivo.
 */
export const ProductTrashManager: React.FC<ProductTrashManagerProps> = ({
  deletedProducts,
  onRestoreProduct,
  onPermanentDeleteProduct,
  onEmptyTrash,
  onBackToList,
}) => {
  return (
    <div className="space-y-6 w-full">
      {/* Header com Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToList}
            className="p-2 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
            title="Voltar à lista de produtos"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h3 className="text-sm font-medium text-[#272727]">
              Lixeira de Produtos
            </h3>
            <p className="text-xs text-[#6B6A64]">
              Itens descartados ficam aqui e podem ser restaurados a qualquer momento
            </p>
          </div>
        </div>

        {deletedProducts.length > 0 && (
          <button
            type="button"
            onClick={onEmptyTrash}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#EEEDE8] text-[#9B2C2C] border border-[#D6D3CC] hover:bg-[#9B2C2C] hover:text-white transition-all text-xs font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Esvaziar lixeira</span>
          </button>
        )}
      </div>

      {deletedProducts.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#EEEDE8] text-[#6B6A64] flex items-center justify-center mx-auto">
            <Trash2 className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-medium text-[#272727]">
            A lixeira está vazia
          </h4>
          <p className="text-xs text-[#6B6A64] max-w-sm mx-auto">
            Nenhum produto descartado no momento.
          </p>
          <div className="pt-2">
            <button
              onClick={onBackToList}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884]"
            >
              <span>Voltar ao catálogo</span>
            </button>
          </div>
        </Card>
      ) : (
        <Card padding="none" className="w-full overflow-hidden">
          <table className="w-full text-left text-xs text-[#272727]">
            <thead>
              <tr className="border-b border-[#D6D3CC] bg-[#EEEDE8] text-[11px] text-[#9B998F] uppercase tracking-wider">
                <th className="py-3 px-4 font-normal w-12 text-center">Foto</th>
                <th className="py-3 px-4 font-normal">Produto / SKU</th>
                <th className="py-3 px-4 font-normal">Categoria</th>
                <th className="py-3 px-4 font-normal text-right">Último Preço</th>
                <th className="py-3 px-4 font-normal text-right">Data de Descarte</th>
                <th className="py-3 px-4 font-normal text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D3CC]">
              {deletedProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#EEEDE8] transition-colors">
                  <td className="py-3 px-4 text-center">
                    <div className="w-9 h-9 rounded-[4px] overflow-hidden bg-[#E4E2DD] border border-[#D6D3CC] mx-auto">
                      <img
                        src={
                          p.images?.[0] ||
                          "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&q=80"
                        }
                        alt={p.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover opacity-60"
                      />
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-medium text-[#272727] block">
                      {p.name}
                    </span>
                    <span className="text-[11px] font-mono text-[#9B998F]">
                      {p.sku || "—"}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[#6B6A64]">
                    {p.categoryName || p.category}
                  </td>

                  <td className="py-3 px-4 text-right tabular-nums font-medium text-[#272727]">
                    R$ {p.price.toFixed(2).replace(".", ",")}
                  </td>

                  <td className="py-3 px-4 text-right text-[11px] text-[#9B998F] tabular-nums">
                    {p.deletedAt || "Recente"}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onRestoreProduct(p.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[rgba(0,74,173,0.08)] text-[#004AAD] hover:bg-[#004AAD] hover:text-white transition-all text-[11px] font-medium"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Restaurar</span>
                      </button>

                      <button
                        onClick={() => onPermanentDeleteProduct(p.id)}
                        className="p-1 rounded text-[#9B998F] hover:text-[#9B2C2C]"
                        title="Excluir permanentemente"
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
      )}
    </div>
  );
};
