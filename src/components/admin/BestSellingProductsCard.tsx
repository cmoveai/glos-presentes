import React, { useState, useMemo } from "react";
import { ChevronRight, Package } from "lucide-react";
import { Order, Product } from "../../types";
import { BestSellerRow } from "./BestSellerRow";
import { isPaidOrder } from "./MetricsManager";

interface BestSellingProductsCardProps {
  orders: Order[];
  products: Product[];
  onSelectProduct?: (productId: string) => void;
  onNavigateToProducts?: () => void;
  title?: string;
}

interface RankedProduct {
  id: string;
  name: string;
  price: number;
  salesCount: number;
  revenue: number;
  image: string;
  category: string;
}

export const BestSellingProductsCard: React.FC<BestSellingProductsCardProps> = ({
  orders,
  products,
  onSelectProduct,
  onNavigateToProducts,
  title = "Ranking dos Mais Vendidos",
}) => {
  const [limit, setLimit] = useState<5 | 10>(5);

  const rankedItems: RankedProduct[] = useMemo(() => {
    const salesMap = new Map<string, { qty: number; revenue: number }>();

    orders.forEach((o) => {
      if (!isPaidOrder(o)) return;

      o.items?.forEach((item) => {
        const id = item.productId || item.id;
        if (!id) return;
        const cur = salesMap.get(id) || { qty: 0, revenue: 0 };
        const q = item.quantity || 1;
        const p = item.price || 0;
        cur.qty += q;
        cur.revenue += p * q;
        salesMap.set(id, cur);
      });
    });

    const productMap = new Map<string, Product>();
    products.forEach((p) => {
      productMap.set(p.id, p);
      if (p.slug) productMap.set(p.slug, p);
    });

    const list: RankedProduct[] = [];
    salesMap.forEach((val, pId) => {
      const prod = productMap.get(pId);
      list.push({
        id: pId,
        name: prod?.name || "Produto",
        price: prod?.price || (val.qty > 0 ? val.revenue / val.qty : 0),
        salesCount: val.qty,
        revenue: val.revenue,
        image: prod?.images?.[0] || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
        category: prod?.categoryName || prod?.category || "Presentes",
      });
    });

    list.sort((a, b) => b.salesCount - a.salesCount);
    return list.slice(0, limit);
  }, [orders, products, limit]);

  return (
    <div
      id="best-selling-products-card"
      className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 relative"
    >
      {/* HEADER: Title & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#D6D3CC]">
        <div>
          <h3 className="text-sm font-medium text-[#272727] tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-[#6B6A64] mt-0.5">
            Baseado exclusivamente em pedidos pagos confirmados.
          </p>
        </div>

        {/* Top 5 / Top 10 Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex bg-[#EEEDE8] p-0.5 rounded-[6px] border border-[#D6D3CC]">
            <button
              type="button"
              onClick={() => setLimit(5)}
              className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer tabular-nums ${
                limit === 5
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Top 5
            </button>
            <button
              type="button"
              onClick={() => setLimit(10)}
              className={`px-2.5 py-1 text-xs font-medium rounded-[4px] transition-colors cursor-pointer tabular-nums ${
                limit === 10
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Top 10
            </button>
          </div>
        </div>
      </div>

      {/* LIST OR HONEST EMPTY STATE */}
      {rankedItems.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-center px-4">
          <div className="w-9 h-9 rounded-full bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-center text-[#9B998F] mb-2">
            <Package className="w-4 h-4 text-[#9B998F]" />
          </div>
          <p className="text-xs font-medium text-[#272727]">
            Sem vendas registradas ainda
          </p>
          <p className="text-[11px] text-[#6B6A64] mt-0.5">
            O ranking dos mais vendidos atualizará automaticamente com os pedidos confirmados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {rankedItems.map((item, idx) => (
            <BestSellerRow
              key={item.id}
              rank={idx + 1}
              id={item.id}
              name={item.name}
              category={item.category}
              price={item.price}
              salesCount={item.salesCount}
              revenue={item.revenue}
              imageUrl={item.image}
              onClick={() => onSelectProduct?.(item.id)}
            />
          ))}
        </div>
      )}

      {onNavigateToProducts && (
        <div className="mt-4 pt-3 border-t border-[#D6D3CC] flex justify-end">
          <button
            type="button"
            onClick={onNavigateToProducts}
            className="text-xs font-medium text-[#004AAD] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Ver todos os produtos do catálogo
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
