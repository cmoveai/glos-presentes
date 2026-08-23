import React, { useState, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Upload,
  Trash2,
  Edit,
  Copy,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Package,
} from "lucide-react";
import { Product, ProductType } from "../../types";
import { Card } from "./Card";
import { InsightBanner } from "./InsightBanner";

interface ProductListProps {
  products: Product[];
  onCreateProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDuplicateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onNavigateImport: () => void;
  onNavigateTrash: () => void;
}

/**
 * 3.1 Listar Produtos (ProductList) — glos.
 * Tabela full-bleed: miniatura · nome · SKU · tipo (Personalizável / Licenciado / Simples) · preço · estoque · status.
 */
export const ProductList: React.FC<ProductListProps> = ({
  products,
  onCreateProduct,
  onEditProduct,
  onDuplicateProduct,
  onDeleteProduct,
  onNavigateImport,
  onNavigateTrash,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Filtros
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.deleted) return false;

      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoryName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        selectedType === "all" ||
        (selectedType === "personalizavel" && p.productType === "personalizavel") ||
        (selectedType === "licenciado" && p.productType === "licenciado") ||
        (selectedType === "simples" && (p.productType === "simples" || !p.productType));

      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && p.active !== false) ||
        (selectedStatus === "inactive" && p.active === false);

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedType, selectedCategory, selectedStatus]);

  // Contagem para filtros
  const typeCounts = useMemo(() => {
    const nonDeleted = products.filter((p) => !p.deleted);
    return {
      all: nonDeleted.length,
      personalizavel: nonDeleted.filter((p) => p.productType === "personalizavel").length,
      licenciado: nonDeleted.filter((p) => p.productType === "licenciado").length,
      simples: nonDeleted.filter((p) => p.productType === "simples" || !p.productType).length,
    };
  }, [products]);

  // Produtos com margem baixa para o Insight Banner
  const lowMarginCount = useMemo(() => {
    return products.filter((p) => {
      if (!p.costPrice || p.deleted) return false;
      const margin = ((p.price - p.costPrice) / p.price) * 100;
      return margin < 25;
    }).length;
  }, [products]);

  const getTypeBadge = (type?: ProductType) => {
    switch (type) {
      case "personalizavel":
        return {
          label: "Personalizável",
          dotClass: "bg-[#004AAD]",
          textClass: "text-[#004AAD]",
        };
      case "licenciado":
        return {
          label: "Licenciado",
          dotClass: "bg-[#6B6A64]",
          textClass: "text-[#272727]",
        };
      default:
        return {
          label: "Simples",
          dotClass: "bg-[#9B998F]",
          textClass: "text-[#6B6A64]",
        };
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Insight Banner da IA */}
      {lowMarginCount > 0 && (
        <InsightBanner
          title={`${lowMarginCount} produtos com margem de lucro estimada abaixo de 25%`}
          description="A IA calculou que aumentos nos custos de insumos e embalagens reduziram a margem desses itens. Recomendamos revisar os preços com o Markup Gross-up."
          actionText="Simular precificação assistida"
          onAction={onCreateProduct}
        />
      )}

      {/* Barra de Ferramentas: Busca + Filtros + Ações */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Busca e Filtros de Tipo */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Campo de Busca */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#9B998F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, SKU ou categoria..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD]"
            />
          </div>

          {/* Filtro por Natureza (Segmented) */}
          <div className="flex items-center p-0.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs">
            <button
              onClick={() => setSelectedType("all")}
              className={`px-2.5 py-1.5 rounded-[4px] font-medium transition-colors ${
                selectedType === "all"
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Todos ({typeCounts.all})
            </button>
            <button
              onClick={() => setSelectedType("personalizavel")}
              className={`px-2.5 py-1.5 rounded-[4px] font-medium transition-colors ${
                selectedType === "personalizavel"
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Personalizáveis ({typeCounts.personalizavel})
            </button>
            <button
              onClick={() => setSelectedType("licenciado")}
              className={`px-2.5 py-1.5 rounded-[4px] font-medium transition-colors ${
                selectedType === "licenciado"
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Licenciados ({typeCounts.licenciado})
            </button>
            <button
              onClick={() => setSelectedType("simples")}
              className={`px-2.5 py-1.5 rounded-[4px] font-medium transition-colors ${
                selectedType === "simples"
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Simples ({typeCounts.simples})
            </button>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNavigateImport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-[#272727] text-xs font-medium hover:bg-[#EEEDE8] transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-[#6B6A64]" />
            <span>Importar</span>
          </button>

          <button
            onClick={onCreateProduct}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar produto</span>
          </button>
        </div>
      </div>

      {/* Tabela Full-Bleed de Produtos */}
      {filteredProducts.length === 0 ? (
        <Card padding="lg" className="text-center py-12 space-y-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#EEEDE8] text-[#004AAD] flex items-center justify-center mx-auto">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-medium text-[#272727]">
            Nenhum produto encontrado
          </h3>
          <p className="text-xs text-[#6B6A64] max-w-sm mx-auto">
            {searchTerm || selectedType !== "all"
              ? "Tente ajustar seus termos de busca ou filtros."
              : "Cadastre seu primeiro produto para começar a vender presentes e lembranças afetivas."}
          </p>
          <div className="pt-2">
            <button
              onClick={onCreateProduct}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar produto</span>
            </button>
          </div>
        </Card>
      ) : (
        <Card padding="none" className="w-full overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#272727]">
              <thead>
                <tr className="border-b border-[#D6D3CC] bg-[#EEEDE8] text-[11px] text-[#9B998F] uppercase tracking-wider">
                  <th className="py-3 px-4 font-normal w-12 text-center">Foto</th>
                  <th className="py-3 px-4 font-normal">Nome / Categoria</th>
                  <th className="py-3 px-4 font-normal">SKU</th>
                  <th className="py-3 px-4 font-normal">Natureza / Tipo</th>
                  <th className="py-3 px-4 font-normal text-right">Preço</th>
                  <th className="py-3 px-4 font-normal text-right">Custo / Margem</th>
                  <th className="py-3 px-4 font-normal text-right">Estoque</th>
                  <th className="py-3 px-4 font-normal text-center">Status</th>
                  <th className="py-3 px-4 font-normal text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D3CC]">
                {filteredProducts.map((product) => {
                  const typeBadge = getTypeBadge(product.productType);
                  const marginPercent = product.costPrice
                    ? ((product.price - product.costPrice) / product.price) * 100
                    : null;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-[#EEEDE8] transition-colors group"
                    >
                      {/* Miniatura */}
                      <td className="py-3 px-4 text-center">
                        <div className="w-10 h-10 rounded-[4px] overflow-hidden bg-[#E4E2DD] border border-[#D6D3CC] mx-auto shrink-0">
                          <img
                            src={
                              product.images?.[0] ||
                              "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=200&q=80"
                            }
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover grayscale-[15%] group-hover:grayscale-0 transition-all"
                          />
                        </div>
                      </td>

                      {/* Nome / Categoria / Fornecedor */}
                      <td className="py-3 px-4 max-w-[260px]">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="font-medium text-[#272727] hover:text-[#004AAD] transition-colors text-left line-clamp-1 block"
                        >
                          {product.name}
                        </button>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#9B998F] truncate mt-0.5">
                          <span>{product.categoryName || product.category}</span>
                          <span>•</span>
                          <span className="text-[#6B6A64]">
                            {product.fornecedorNome || "Fabricação Própria (Glos)"}
                          </span>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#6B6A64] tabular-nums">
                        {product.sku || "—"}
                      </td>

                      {/* Tipo / Natureza */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${typeBadge.dotClass}`}
                          />
                          <span className={typeBadge.textClass}>
                            {typeBadge.label}
                          </span>
                        </span>
                      </td>

                      {/* Preço de Venda */}
                      <td className="py-3 px-4 text-right font-medium text-[#272727] tabular-nums">
                        R$ {product.price.toFixed(2).replace(".", ",")}
                        {product.promotionalPrice && (
                          <span className="block text-[10px] text-[#9B998F] line-through">
                            R$ {product.promotionalPrice.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </td>

                      {/* Custo / Margem */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        {product.costPrice ? (
                          <div>
                            <span className="text-[#6B6A64]">
                              R$ {product.costPrice.toFixed(2).replace(".", ",")}
                            </span>
                            {marginPercent !== null && (
                              <span
                                className={`block text-[10px] ${
                                  marginPercent < 25
                                    ? "text-[#9B2C2C]"
                                    : "text-[#0F7A4F]"
                                }`}
                              >
                                {marginPercent.toFixed(1)}% margem
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#9B998F]">—</span>
                        )}
                      </td>

                      {/* Estoque */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        <span
                          className={`font-medium ${
                            product.stock <= 5
                              ? "text-[#9B2C2C]"
                              : "text-[#272727]"
                          }`}
                        >
                          {product.stock} un.
                        </span>
                        {product.stock <= 5 && (
                          <span className="block text-[10px] text-[#9B2C2C]">
                            Estoque baixo
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              product.active !== false
                                ? "bg-[#0F7A4F]"
                                : "bg-[#9B998F]"
                            }`}
                          />
                          <span
                            className={
                              product.active !== false
                                ? "text-[#272727]"
                                : "text-[#9B998F]"
                            }
                          >
                            {product.active !== false ? "Ativo" : "Inativo"}
                          </span>
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1 rounded-[4px] text-[#6B6A64] hover:text-[#004AAD] hover:bg-[#EEEDE8] transition-colors"
                            title="Editar produto"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateProduct(product)}
                            className="p-1 rounded-[4px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
                            title="Duplicar produto"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product.id)}
                            className="p-1 rounded-[4px] text-[#6B6A64] hover:text-[#9B2C2C] hover:bg-[#EEEDE8] transition-colors"
                            title="Mover para lixeira"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rodapé da tabela com estatísticas */}
          <div className="p-3 bg-[#EEEDE8] border-t border-[#D6D3CC] flex items-center justify-between text-xs text-[#6B6A64]">
            <span>
              Mostrando <strong className="font-medium text-[#272727] tabular-nums">{filteredProducts.length}</strong> de{" "}
              <strong className="font-medium text-[#272727] tabular-nums">{products.filter((p) => !p.deleted).length}</strong> produtos
            </span>

            <button
              onClick={onNavigateTrash}
              className="inline-flex items-center gap-1 text-[11px] text-[#6B6A64] hover:text-[#9B2C2C] transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Ver lixeira ({products.filter((p) => p.deleted).length})</span>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
};
