import React from "react";
import { Truck, CreditCard, ShieldCheck, Clock } from "lucide-react";

export const BenefitsBar: React.FC = () => {
  const benefits = [
    {
      id: "envio-nacional",
      icon: Truck,
      title: "Para todo o Brasil",
      description: "Enviamos para todos os estados",
    },
    {
      id: "parcelamento",
      icon: CreditCard,
      title: "Pague em até 12x",
      description: "No cartão via Mercado Pago",
    },
    {
      id: "seguranca",
      icon: ShieldCheck,
      title: "Compra segura",
      description: "Seus dados protegidos",
    },
    {
      id: "prazo-entrega",
      icon: Clock,
      title: "Receba seu presente em até 7 dias",
      description: "Consulte o produto e o CEP",
    },
  ];

  return (
    <section
      aria-label="Benefícios da Loja"
      className="w-full bg-stone-100/80 border-y border-stone-200/90 py-4 sm:py-5"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 items-center">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex items-center gap-3.5 group"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white border border-stone-200/90 shadow-2xs flex items-center justify-center text-stone-800 shrink-0 transition-colors group-hover:border-stone-400 group-hover:text-stone-950">
                  <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[1.75]" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900 leading-snug tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-stone-600 leading-tight mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
