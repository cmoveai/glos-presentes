import React from "react";
import { ShieldCheck, CreditCard, Truck, RotateCcw, MessageSquareHeart } from "lucide-react";
import { BRAND_CONFIG } from "../../config/brand";

export const TrustFeatures: React.FC = () => {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-stone-900" />,
      title: "Compra 100% Segura",
      description: "Ambiente criptografado com certificação SSL de ponta a ponta.",
    },
    {
      icon: <CreditCard className="w-6 h-6 text-stone-900" />,
      title: "Pagamento Facilitado",
      description: "Parcele em até 10x no cartão.",
    },
    {
      icon: <Truck className="w-6 h-6 text-stone-900" />,
      title: "Entrega em Todo o Brasil",
      description: `Frete Grátis em compras acima de R$ ${BRAND_CONFIG.freeShippingThreshold.toFixed(0)} com rastreio em tempo real.`,
    },
    {
      icon: <RotateCcw className="w-6 h-6 text-stone-900" />,
      title: "Troca Descomplicada",
      description: "Até 7 dias corridos após a entrega para trocas ou devoluções sem custos.",
    },
    {
      icon: <MessageSquareHeart className="w-6 h-6 text-stone-900" />,
      title: "Atendimento Humanizado",
      description: `Suporte rápido via WhatsApp ${BRAND_CONFIG.whatsappDisplay} por pessoas reais.`,
    },
  ];

  return (
    <section className="py-12 bg-white border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center p-4 rounded-2xl bg-stone-50/70 border border-stone-200/60"
            >
              <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-3 shadow-2xs">
                {f.icon}
              </div>
              <h3 className="font-bold text-sm text-stone-950 mb-1">{f.title}</h3>
              <p className="text-xs text-stone-700 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
