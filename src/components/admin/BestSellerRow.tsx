import React from "react";
import { ArrowUpRight } from "lucide-react";

export interface BestSellerRowProps {
  rank: number;
  id: string;
  name: string;
  price: number;
  salesCount: number;
  revenue: number;
  image: string;
  category?: string;
  growthPercent?: number;
  onClick?: () => void;
}

export const BestSellerRow: React.FC<BestSellerRowProps> = ({
  rank,
  name,
  price,
  salesCount,
  image,
  growthPercent = 12.5,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col justify-between cursor-pointer transition-all duration-200"
    >
      {/* Imagem do Produto */}
      <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden bg-[#F1F3F6] mb-2.5 border border-[#E3E5E9] group-hover:border-[#2E5BFF] transition-all">
        <img
          src={image}
          alt={name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80";
          }}
        />

        {/* Insígnia do Ranking (#1, #2...) */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#1A1F27]/85 backdrop-blur-xs text-white text-[10px] font-bold font-sans">
          #{rank}
        </div>

        {/* Botão Hover */}
        <div className="absolute inset-0 bg-[#1A1F27]/15 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="p-1.5 bg-white rounded-full text-[#2E5BFF] shadow-sm">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Detalhes */}
      <div className="space-y-0.5">
        <h4
          className="text-xs font-semibold text-[#1A1F27] truncate group-hover:text-[#2E5BFF] transition-colors"
          title={name}
        >
          {name}
        </h4>

        <div className="text-sm font-bold text-[#1A1F27] tabular-nums">
          R$ {price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-[#5B6270] text-[11px]">
            Vendas: <strong className="text-[#1A1F27] font-semibold tabular-nums">{salesCount}</strong>
          </span>

          {/* Sparkline verde */}
          <div className="flex items-center text-[#059669]" title={`+${growthPercent}% no período`}>
            <svg className="w-8 h-3.5" viewBox="0 0 32 14" fill="none">
              <path
                d="M 2 11 Q 10 12, 16 6 T 28 2 L 30 3"
                stroke="#059669"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
