import React from "react";
import { Check, Clock, AlertCircle, ArrowRight, Sparkles } from "lucide-react";
import { Order, OrderStep, OrderType } from "../../types";
import { REVENDA_STEPS, PERSONALIZADO_STEPS } from "../../services/orderService";

interface OrderTimelineProps {
  order: Order;
  onAdvanceStep?: (nextStep: OrderStep) => void;
  canAdvance?: boolean;
}

/**
 * Stepper / Linha do Tempo de Pedido — glos.
 * Exibe o Fluxo A (Revenda) ou Fluxo B (Personalizado) de acordo com a natureza do pedido.
 * Cobalt #004AAD é a única cor ativa.
 */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({
  order,
  onAdvanceStep,
  canAdvance = true,
}) => {
  const steps = order.orderType === "personalizado" ? PERSONALIZADO_STEPS : REVENDA_STEPS;
  const currentStepIndex = steps.findIndex((s) => s.id === order.currentStep);
  const isCancelled = order.status === "CANCELADO" || order.currentStep === "cancelado";

  const getStepEvent = (stepId: OrderStep) => {
    return order.stepHistory?.find((h) => h.step === stepId);
  };

  const handleNext = () => {
    if (!onAdvanceStep) return;
    if (currentStepIndex >= 0 && currentStepIndex < steps.length - 1) {
      const next = steps[currentStepIndex + 1].id;
      onAdvanceStep(next);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header do Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#D6D3CC]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#272727]">
            Linha do Tempo • {order.orderType === "personalizado" ? "Fluxo B (Personalizado / Fabricação)" : "Fluxo A (Revenda / Pronta-Entrega)"}
          </span>
          <span className="px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[10px] text-[#6B6A64]">
            {steps.length} etapas
          </span>
        </div>

        {canAdvance && currentStepIndex >= 0 && currentStepIndex < steps.length - 1 && !isCancelled && (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors self-start sm:self-auto"
          >
            <span>Avançar para {steps[currentStepIndex + 1].label}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stepper Horizontal Responsivo */}
      <div className="w-full overflow-x-auto pb-2">
        <div className="flex items-start min-w-[640px] justify-between relative">
          {/* Linha de conexão de fundo */}
          <div className="absolute top-4 left-4 right-4 h-[1px] bg-[#D6D3CC] -z-0" />

          {steps.map((step, index) => {
            const isCompleted = currentStepIndex > index;
            const isCurrent = currentStepIndex === index;
            const isPending = currentStepIndex < index;
            const stepHistoryItem = getStepEvent(step.id);

            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center text-center flex-1 px-1 group"
              >
                {/* Marcador / Círculo */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all text-xs font-medium ${
                    isCompleted
                      ? "bg-[#004AAD] text-white border-[#004AAD]"
                      : isCurrent
                      ? "bg-[#F4F3EF] text-[#004AAD] border-[#004AAD] ring-2 ring-[#004AAD]/20"
                      : "bg-[#EEEDE8] text-[#9B998F] border-[#D6D3CC]"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="tabular-nums">{index + 1}</span>
                  )}
                </div>

                {/* Rótulo da Etapa */}
                <div className="mt-2 space-y-0.5">
                  <span
                    className={`text-xs block font-medium ${
                      isCurrent
                        ? "text-[#004AAD]"
                        : isCompleted
                        ? "text-[#272727]"
                        : "text-[#9B998F]"
                    }`}
                  >
                    {step.label}
                  </span>

                  <span className="text-[10px] text-[#6B6A64] block max-w-[110px] leading-tight mx-auto">
                    {step.description}
                  </span>

                  {/* Data / Histórico */}
                  {stepHistoryItem ? (
                    <span className="text-[9px] text-[#9B998F] block pt-0.5 tabular-nums">
                      {stepHistoryItem.date.split("•")[0]}
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-[9px] text-[#004AAD] pt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#004AAD] animate-pulse" />
                      <span>Etapa atual</span>
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
