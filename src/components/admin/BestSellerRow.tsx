import React from "react";
import { KpiSparkline } from "./KpiSparkline";

export interface BestSellerRowProps {
  rank: number;
  id: string;
  name: string;
  category?: string;
  price: number;
  salesCount: number;
  revenue?: number;
  imageUrl: string;
  sparkline?: number[];
  onClick?: () => void;
}

/**
 * 3) Linha / Card de Mais Vendidos — glos.
 * Imagem em proporção editorial com escala de cinza suave, nome (400), preço (500 tabular),
 * contador de vendas (terciário) e sparkline minúscula em cobalt.
 */
export const BestSellerRow: React.FC<BestSellerRowProps> = ({
  rank,
  name,
  category,
  price,
  salesCount,
  imageUrl,
  sparkline,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col justify-between bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-3 hover:bg-[#EEEDE8] transition-colors cursor-pointer select-none"
    >
      {/* Imagem em proporção editorial com insígnia discreta */}
      <div className="relative aspect-[4/5] w-full rounded-[6px] overflow-hidden bg-[#E4E2DD] mb-2.5 border border-[#D6D3CC]">
        <img
          src={imageUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center grayscale-[20%] group-hover:grayscale-0 transition-all duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80";
          }}
        />
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[4px] bg-[#E4E2DD]/90 backdrop-blur-[2px] border border-[#D6D3CC] text-[10px] font-medium tabular-nums text-[#272727]">
          #{rank}
        </div>
      </div>

      {/* Informações */}
      <div className="space-y-1">
        {category && (
          <span className="text-[10px] uppercase tracking-wider text-[#9B998F] block truncate">
            {category}
          </span>
        )}
        <h4 className="text-xs font-normal text-[#272727] line-clamp-2 leading-snug group-hover:text-[#004AAD] transition-colors">
          {name}
        </h4>
      </div>

      {/* Preço, Vendas e Sparkline */}
      <div className="mt-3 pt-2.5 border-t border-[#D6D3CC] flex items-end justify-between gap-1">
        <div>
          <div className="text-xs font-medium text-[#272727] tabular-nums">
            R$ {price.toFixed(2).replace(".", ",")}
          </div>
          <span className="text-[11px] font-normal text-[#9B998F] tabular-nums">
            Vendas: {salesCount}
          </span>
        </div>

        {sparkline && sparkline.length > 1 && (
          <KpiSparkline data={sparkline} width={38} height={14} />
        )}
      </div>
    </div>
  );
};
