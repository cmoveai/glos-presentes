import React, { useState } from "react";
import { Sparkles, Heart, Gift, Users, CheckCircle2, ShieldCheck } from "lucide-react";

export interface QuizPreferences {
  recipientType: "para_mim" | "namorado_marido" | "amiga" | "mae_familia" | "corporativo";
  preferredStyle: "minimalista" | "classico" | "divertido" | "sofisticado" | "artesanal";
  mainOccasions: string[];
  priceRange: "ate_150" | "150_a_300" | "300_a_600" | "acima_600";
  lgpdOptIn: boolean;
  imageRightsAuthorized: boolean;
}

export interface PreferenceQuizProps {
  initialValues?: Partial<QuizPreferences>;
  onSave?: (prefs: QuizPreferences) => void;
  onShowNotification?: (type: "success" | "error", msg: string) => void;
}

export const PreferenceQuiz: React.FC<PreferenceQuizProps> = ({
  initialValues,
  onSave,
  onShowNotification,
}) => {
  const [prefs, setPrefs] = useState<QuizPreferences>({
    recipientType: initialValues?.recipientType || "amiga",
    preferredStyle: initialValues?.preferredStyle || "sofisticado",
    mainOccasions: initialValues?.mainOccasions || ["Aniversário", "Dia das Mães", "Natal / Fim de Ano"],
    priceRange: initialValues?.priceRange || "150_a_300",
    lgpdOptIn: initialValues?.lgpdOptIn ?? true,
    imageRightsAuthorized: initialValues?.imageRightsAuthorized ?? true,
  });

  const availableOccasions = [
    "Aniversário",
    "Dia das Mães",
    "Dia dos Namorados",
    "Natal / Fim de Ano",
    "Casamento / Bodas",
    "Maternidade / Chá de Bebê",
    "Agradecimento / Corporativo",
  ];

  const handleToggleOccasion = (occ: string) => {
    setPrefs((prev) => {
      const exists = prev.mainOccasions.includes(occ);
      return {
        ...prev,
        mainOccasions: exists
          ? prev.mainOccasions.filter((o) => o !== occ)
          : [...prev.mainOccasions, occ],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(prefs);
    onShowNotification?.("success", "Respostas do Quiz de Preferências salvas no Perfil Vivo!");
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-[#FFFFFF] border border-[#E3E5E9] rounded-lg shadow-xs space-y-4 text-xs">
      <div className="flex items-center gap-2 pb-3 border-b border-[#ECEEF1]">
        <Sparkles className="w-4 h-4 text-[#2E5BFF]" />
        <div>
          <h4 className="text-xs font-bold text-[#1A1F27]">
            Quiz de Boas-Vindas & Preferências (Zero-Party Data)
          </h4>
          <p className="text-[11px] text-[#5B6270]">
            Capturado no onboarding pós-compra para alimentar as sugestões e automações do Perfil Vivo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Para quem costuma comprar */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#1A1F27]">Para quem você mais compra presentes?</label>
          <select
            value={prefs.recipientType}
            onChange={(e) => setPrefs({ ...prefs, recipientType: e.target.value as any })}
            className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] focus:border-[#2E5BFF] focus:outline-hidden"
          >
            <option value="amiga">Amigas e Colegas de Trabalho</option>
            <option value="namorado_marido">Namorado(a) / Cônjuge</option>
            <option value="mae_familia">Mãe, Pai e Familiares</option>
            <option value="para_mim">Uso Pessoal (Presente para mim)</option>
            <option value="corporativo">Clientes e Parceiros Corporativos</option>
          </select>
        </div>

        {/* Estilo Favorito */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#1A1F27]">Estilo Visual & Atmosfera Preferida</label>
          <select
            value={prefs.preferredStyle}
            onChange={(e) => setPrefs({ ...prefs, preferredStyle: e.target.value as any })}
            className="w-full px-3 py-2 rounded-md border border-[#E3E5E9] bg-white text-[#1A1F27] focus:border-[#2E5BFF] focus:outline-hidden"
          >
            <option value="sofisticado">Sofisticado & Contemporâneo</option>
            <option value="minimalista">Minimalista & Clean</option>
            <option value="artesanal">Artesanal & Afetivo</option>
            <option value="divertido">Criativo & Divertido</option>
            <option value="classico">Clássico & Tradicional</option>
          </select>
        </div>
      </div>

      {/* Ocasiões Principais */}
      <div className="space-y-2 pt-2">
        <label className="font-semibold text-[#1A1F27] block">
          Datas e Ocasiões em que você costuma presentear:
        </label>
        <div className="flex flex-wrap gap-2">
          {availableOccasions.map((occ) => {
            const selected = prefs.mainOccasions.includes(occ);
            return (
              <button
                key={occ}
                type="button"
                onClick={() => handleToggleOccasion(occ)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                  selected
                    ? "bg-[#EDF1FF] text-[#2E5BFF] border-[#BFDBFE]"
                    : "bg-[#F1F3F6] text-[#5B6270] border-[#E3E5E9] hover:bg-stone-200"
                }`}
              >
                {selected ? "✓ " : "+ "}
                {occ}
              </button>
            );
          })}
        </div>
      </div>

      {/* Consentimentos LGPD */}
      <div className="pt-3 border-t border-[#ECEEF1] space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.lgpdOptIn}
            onChange={(e) => setPrefs({ ...prefs, lgpdOptIn: e.target.checked })}
            className="rounded border-[#E3E5E9] text-[#2E5BFF] focus:ring-[#2E5BFF]"
          />
          <span className="text-[11px] text-[#5B6270]">
            Opt-in registrado para novidades e comunicações via WhatsApp e E-mail (LGPD).
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.imageRightsAuthorized}
            onChange={(e) => setPrefs({ ...prefs, imageRightsAuthorized: e.target.checked })}
            className="rounded border-[#E3E5E9] text-[#2E5BFF] focus:ring-[#2E5BFF]"
          />
          <span className="text-[11px] text-[#5B6270]">
            Autorização de uso de imagem concedida para fotos/vídeos de depoimentos (UGC).
          </span>
        </label>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          className="px-3.5 py-1.5 bg-[#2E5BFF] hover:bg-[#1E45D6] text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Salvar no Perfil Vivo</span>
        </button>
      </div>
    </form>
  );
};
