import React, { useState } from "react";
import { Star, CheckCircle2, XCircle, Clock, Trash2, Filter, Sparkles, MessageSquare } from "lucide-react";
import { ProductReview } from "../../types";
import { Card } from "./Card";

interface ProductReviewsManagerProps {
  reviews: ProductReview[];
  onUpdateStatus: (reviewId: string, status: "aprovado" | "pendente" | "recusado") => void;
  onDeleteReview: (reviewId: string) => void;
}

/**
 * 3.7 Avaliações de Clientes & Depoimentos Afetivos (ProductReviewsManager) — glos.
 * Moderação visual de avaliações, fotos de presentes recebidos e aprovação para a vitrine.
 */
export const ProductReviewsManager: React.FC<ProductReviewsManagerProps> = ({
  reviews,
  onUpdateStatus,
  onDeleteReview,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = reviews.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-medium text-[#272727]">
            Avaliações & Conteúdo de Clientes (UGC)
          </h3>
          <p className="text-xs text-[#6B6A64]">
            Aprove depoimentos e fotos de presentes entregues para aumentar a prova social
          </p>
        </div>

        <div className="flex items-center p-0.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-2.5 py-1.5 rounded-[4px] font-medium transition-colors ${
              filterStatus === "all"
                ? "bg-[#004AAD] text-white"
                : "text-[#6B6A64] hover:text-[#272727]"
            }`}
          >
            Todas ({reviews.length})
          </button>
          <button
            onClick={() => setFilterStatus("pendente")}
            className={`px-2.5 py-1.5 rounded-[4px] font-medium transition-colors ${
              filterStatus === "pendente"
                ? "bg-[#004AAD] text-white"
                : "text-[#6B6A64] hover:text-[#272727]"
            }`}
          >
            Pendentes ({reviews.filter((r) => r.status === "pendente").length})
          </button>
          <button
            onClick={() => setFilterStatus("aprovado")}
            className={`px-2.5 py-1.5 rounded-[4px] font-medium transition-colors ${
              filterStatus === "aprovado"
                ? "bg-[#004AAD] text-white"
                : "text-[#6B6A64] hover:text-[#272727]"
            }`}
          >
            Aprovadas ({reviews.filter((r) => r.status === "aprovado").length})
          </button>
        </div>
      </div>

      {/* Grid de Avaliações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((rev) => (
          <Card key={rev.id} padding="md" className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-medium text-[#272727]">
                    {rev.customerName}
                  </h4>
                  <span className="text-[11px] text-[#004AAD] block truncate">
                    {rev.productName}
                  </span>
                </div>

                {/* Estrelas */}
                <div className="flex items-center gap-0.5 text-[#004AAD]">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < rev.rating ? "fill-[#004AAD]" : "text-[#D6D3CC]"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Depoimento */}
              <p className="text-xs text-[#272727] italic leading-relaxed">
                "{rev.comment}"
              </p>

              {/* Foto enviada pelo cliente (UGC) */}
              {rev.photoUrl && (
                <div className="w-16 h-16 rounded-[4px] overflow-hidden bg-[#EEEDE8] border border-[#D6D3CC]">
                  <img
                    src={rev.photoUrl}
                    alt="Foto do cliente"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Rodapé do Card com Ações de Moderação */}
            <div className="pt-3 border-t border-[#D6D3CC] flex items-center justify-between text-xs">
              <span className="text-[10px] text-[#9B998F] tabular-nums">
                {rev.createdAt}
              </span>

              <div className="flex items-center gap-2">
                {rev.status !== "aprovado" && (
                  <button
                    onClick={() => onUpdateStatus(rev.id, "aprovado")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[rgba(0,74,173,0.08)] text-[#004AAD] hover:bg-[#004AAD] hover:text-white transition-all text-[11px] font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Aprovar</span>
                  </button>
                )}

                {rev.status !== "recusado" && (
                  <button
                    onClick={() => onUpdateStatus(rev.id, "recusado")}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#EEEDE8] text-[#9B2C2C] hover:bg-[#9B2C2C] hover:text-white transition-all text-[11px] font-medium"
                  >
                    <XCircle className="w-3 h-3" />
                    <span>Recusar</span>
                  </button>
                )}

                <button
                  onClick={() => onDeleteReview(rev.id)}
                  className="p-1 rounded text-[#9B998F] hover:text-[#9B2C2C]"
                  title="Excluir avaliação"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
