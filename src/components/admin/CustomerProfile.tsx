import React, { useState } from "react";
import {
  User,
  Sparkles,
  ShoppingBag,
  Gift,
  Tag,
  Calendar,
  ShieldCheck,
  Award,
  ChevronRight,
  TrendingUp,
  Heart,
  Share2,
} from "lucide-react";
import { PreferenceQuiz, QuizPreferences } from "./PreferenceQuiz";

export interface CustomerLiveProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  avatar?: string;
  registeredAt: string;
  // Zero-Party Data (Quiz)
  quizPreferences: QuizPreferences;
  // First-Party Data (Comportamento)
  ordersCount: number;
  totalSpent: number;
  averageTicket: number;
  favoriteCategories: string[];
  preferredPayment: "pix" | "credit_card" | "boleto";
  lastOrderDate: string;
  // IA Derivados
  ltvProjected: number;
  segment: "VIP / Embaixador" | "Recorrente" | "Novo Comprador" | "Em Risco";
  repurchasePropensity: "Alta (88%)" | "Média (54%)" | "Baixa (22%)";
  nextProbableOccasion: string;
  // Programa de Relacionamento
  isReferralPartner: boolean;
  referralsCount: number;
  ugcApprovedCount: number;
  activeVoucherAmount: number;
  // LGPD
  optInDate: string;
  imageRightsGrantedDate: string;
}

export interface CustomerProfileProps {
  customer?: CustomerLiveProfile;
  onUpdateQuiz?: (prefs: QuizPreferences) => void;
  onShowNotification?: (type: "success" | "error", msg: string) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customer: propCustomer,
  onUpdateQuiz,
  onShowNotification,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "quiz" | "history">("overview");

  // Perfil padrão coerente
  const customer: CustomerLiveProfile = propCustomer || {
    id: "cust-1",
    name: "Camila Guimarães Rocha",
    email: "camila.guimaraes@exemplo.com",
    phone: "(11) 98844-2109",
    cpf: "248.910.334-01",
    registeredAt: "15 jan, 26",
    quizPreferences: {
      recipientType: "amiga",
      preferredStyle: "sofisticado",
      mainOccasions: ["Aniversário", "Dia das Mães", "Natal / Fim de Ano"],
      priceRange: "150_a_300",
      lgpdOptIn: true,
      imageRightsAuthorized: true,
    },
    ordersCount: 4,
    totalSpent: 1240.0,
    averageTicket: 310.0,
    favoriteCategories: ["Kits de Presente", "Aromaterapia", "Papelaria Fina"],
    preferredPayment: "pix",
    lastOrderDate: "22 ago, 26",
    ltvProjected: 2850.0,
    segment: "VIP / Embaixador",
    repurchasePropensity: "Alta (88%)",
    nextProbableOccasion: "Aniversário de Amiga (15 de Setembro)",
    isReferralPartner: true,
    referralsCount: 3,
    ugcApprovedCount: 2,
    activeVoucherAmount: 45.0,
    optInDate: "15 jan, 26 às 14:32 (Checkout)",
    imageRightsGrantedDate: "18 jan, 26 às 10:15 (Upload UGC)",
  };

  return (
    <div id="customer-live-profile-root" className="space-y-5">
      {/* Header do Perfil Vivo */}
      <div className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#EDF1FF] text-[#2E5BFF] flex items-center justify-center font-bold text-base border border-[#BFDBFE] shrink-0">
            {customer.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#1A1F27]">{customer.name}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0]">
                {customer.segment}
              </span>
            </div>
            <p className="text-xs text-[#5B6270]">
              {customer.email} • {customer.phone} • CPF: {customer.cpf}
            </p>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-[10px] text-[#8A8F98] uppercase font-semibold block">LTV Projetado</span>
            <span className="text-sm font-bold text-[#047857] tabular-nums">
              R$ {customer.ltvProjected.toFixed(2)}
            </span>
          </div>
          <div className="text-right border-l border-[#ECEEF1] pl-4">
            <span className="text-[10px] text-[#8A8F98] uppercase font-semibold block">Propensão Recompra</span>
            <span className="text-xs font-bold text-[#2E5BFF]">
              {customer.repurchasePropensity}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ECEEF1] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "bg-[#EDF1FF] text-[#2E5BFF]"
              : "text-[#5B6270] hover:text-[#1A1F27]"
          }`}
        >
          Visão Geral do Perfil Vivo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("quiz")}
          className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer ${
            activeTab === "quiz"
              ? "bg-[#EDF1FF] text-[#2E5BFF]"
              : "text-[#5B6270] hover:text-[#1A1F27]"
          }`}
        >
          Quiz de Preferências (Zero-Party)
        </button>
      </div>

      {activeTab === "quiz" ? (
        <PreferenceQuiz
          initialValues={customer.quizPreferences}
          onSave={onUpdateQuiz}
          onShowNotification={onShowNotification}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Preferências Declaradas (Zero-Party) */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-4 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ECEEF1]">
              <Heart className="w-4 h-4 text-rose-500" />
              <h4 className="font-bold text-[#1A1F27]">Preferências Declaradas</h4>
            </div>
            <div className="space-y-2 text-[11px]">
              <div>
                <span className="text-[#8A8F98] block">Costuma presentear:</span>
                <span className="font-semibold text-[#1A1F27] capitalize">
                  {customer.quizPreferences.recipientType.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-[#8A8F98] block">Estilo Favorito:</span>
                <span className="font-semibold text-[#1A1F27] capitalize">
                  {customer.quizPreferences.preferredStyle}
                </span>
              </div>
              <div>
                <span className="text-[#8A8F98] block">Ocasiões Recorrentes:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {customer.quizPreferences.mainOccasions.map((occ) => (
                    <span
                      key={occ}
                      className="px-1.5 py-0.5 rounded bg-[#F1F3F6] text-[#5B6270] text-[10px] font-medium"
                    >
                      {occ}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Histórico & Comportamento (First-Party) */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-4 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ECEEF1]">
              <ShoppingBag className="w-4 h-4 text-[#2E5BFF]" />
              <h4 className="font-bold text-[#1A1F27]">Histórico & Transações</h4>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Total de Pedidos:</span>
                <span className="font-bold text-[#1A1F27] tabular-nums">{customer.ordersCount} compras</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Gasto Consolidado:</span>
                <span className="font-bold text-[#1A1F27] tabular-nums">
                  R$ {customer.totalSpent.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Ticket Médio:</span>
                <span className="font-bold text-[#1A1F27] tabular-nums">
                  R$ {customer.averageTicket.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Pagamento Preferido:</span>
                <span className="font-semibold text-[#047857] uppercase">
                  {customer.preferredPayment} (5% desc.)
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Programa de Relacionamento & LGPD */}
          <div className="bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg p-4 shadow-xs space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-[#ECEEF1]">
              <Award className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-[#1A1F27]">Embaixador & LGPD</h4>
            </div>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">UGCs Aprovados:</span>
                <span className="font-semibold text-[#1A1F27]">{customer.ugcApprovedCount} fotos/vídeos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Amigos Indicados:</span>
                <span className="font-semibold text-[#1A1F27]">{customer.referralsCount} conversões</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8F98]">Voucherback Ativo:</span>
                <span className="font-bold text-[#047857]">R$ {customer.activeVoucherAmount.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-[#ECEEF1] text-[10px] text-[#8A8F98]">
                <div>✓ Opt-in: {customer.optInDate}</div>
                <div>✓ Uso de Imagem: {customer.imageRightsGrantedDate}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
