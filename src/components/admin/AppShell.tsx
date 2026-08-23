import React, { useState } from "react";
import { Sidebar, ActiveSection } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CopilotFab } from "./CopilotFab";
import { Card } from "./Card";
import { PageHeader } from "./PageHeader";
import { InsightBanner } from "./InsightBanner";
import { InicioDashboard } from "./InicioDashboard";
import { ProductModule } from "./ProductModule";
import { OrderModule } from "./OrderModule";
import { CustomerManager } from "./CustomerManager";
import { SupplierManager } from "./SupplierManager";
import { getProductsFromStorage } from "../../services/productService";
import { Sparkles, Layers, CheckCircle2 } from "lucide-react";
import { BRAND_CONFIG } from "../../config/brand";

interface AppShellProps {
  children?: React.ReactNode;
  onOpenStorefront?: () => void;
}

/**
 * Shell Principal do Painel do Lojista — glos.
 * Estrutura responsiva full-bleed com Sidebar fixa/recolhível + Topbar + Área de Conteúdo + Copiloto IA (FAB).
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  onOpenStorefront,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const [activeSection, setActiveSection] = useState<ActiveSection>({
    id: "inicio",
    label: "Início",
    group: "Principal & Análise",
  });

  const handleSelectSection = (
    id: string,
    subId?: string,
    label?: string,
    subLabel?: string,
    group?: string
  ) => {
    setActiveSection({
      id,
      subId,
      label: label || id,
      subLabel,
      group: group || "Geral",
    });
    setIsMobileMenuOpen(false);
  };

  const currentTitle = activeSection.subLabel
    ? `${activeSection.label} · ${activeSection.subLabel}`
    : activeSection.label;

  const currentSubtitle =
    activeSection.id === "inicio"
      ? "Briefing Executivo de IA — Visão geral das últimas 24h e prioridades da loja"
      : activeSection.group !== "Geral"
      ? `${activeSection.group} — Painel administrativo do lojista ${BRAND_CONFIG.displayName}`
      : `Painel administrativo do lojista ${BRAND_CONFIG.displayName}`;

  return (
    <div className="min-h-screen bg-[#E4E2DD] text-[#272727] flex flex-col antialiased selection:bg-[rgba(0,74,173,0.15)] selection:text-[#004AAD]">
      <div className="flex-1 flex w-full overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block shrink-0">
          <Sidebar
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onOpenStorefront={onOpenStorefront}
          />
        </div>

        {/* Mobile Drawer Sidebar */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden select-none">
            <div
              className="fixed inset-0 bg-black/25 backdrop-blur-[2px] transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#E4E2DD] z-10 flex">
              <Sidebar
                activeSection={activeSection}
                onSelectSection={handleSelectSection}
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileMenuOpen(false)}
                onOpenStorefront={onOpenStorefront}
                className="w-full h-full"
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
          <Topbar
            title={currentTitle}
            subtitle={currentSubtitle}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onOpenStorefront={onOpenStorefront}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full">
            {children ? (
              children
            ) : activeSection.id === "inicio" ? (
              <InicioDashboard
                onNavigateSection={(sectionId, subId) => {
                  const sectionLabels: Record<string, { label: string; group: string }> = {
                    produtos: { label: "Produtos", group: "Gestão & Operação" },
                    vendas: { label: "Vendas", group: "Gestão & Operação" },
                    "carrinhos-abandonados": { label: "Carrinhos Abandonados", group: "Gestão & Operação" },
                    cupons: { label: "Cupons", group: "Marketing" },
                  };
                  const meta = sectionLabels[sectionId] || { label: sectionId, group: "Geral" };
                  handleSelectSection(sectionId, subId, meta.label, undefined, meta.group);
                }}
                onOpenCopilot={() => setIsCopilotOpen(true)}
              />
            ) : activeSection.id === "produtos" ? (
              <ProductModule
                subSectionId={activeSection.subId}
                onNavigateSubSection={(subId, subLabel) => {
                  handleSelectSection("produtos", subId, "Produtos", subLabel, "Gestão & Operação");
                }}
              />
            ) : activeSection.id === "vendas" ? (
              <OrderModule
                subSection={activeSection.subId || "listar"}
                onNavigateSubSection={(subId) => {
                  const subLabels: Record<string, string> = {
                    listar: "Listar pedidos",
                    aprovacoes: "Aprovação de arte (IA)",
                    criar: "Criar pedido",
                    "link-carrinho": "Link de carrinho",
                    "carrinhos-abandonados": "Carrinhos Abandonados",
                  };
                  handleSelectSection("vendas", subId, "Vendas", subLabels[subId], "Gestão & Operação");
                }}
              />
            ) : activeSection.id === "carrinhos-abandonados" ? (
              <OrderModule
                subSection="carrinhos-abandonados"
                onNavigateSubSection={(subId) => {
                  handleSelectSection("vendas", subId, "Vendas", undefined, "Gestão & Operação");
                }}
              />
            ) : activeSection.id === "ia" ? (
              <OrderModule
                subSection="aprovacoes"
                onNavigateSubSection={(subId) => {
                  handleSelectSection("vendas", subId, "Vendas", undefined, "Gestão & Operação");
                }}
              />
            ) : activeSection.id === "clientes" ? (
              <CustomerManager
                orders={[]}
                onNavigateToOrders={() => {
                  handleSelectSection("vendas", "listar", "Vendas", "Listar pedidos", "Gestão & Operação");
                }}
              />
            ) : activeSection.id === "fornecedores" ? (
              <SupplierManager products={getProductsFromStorage()} />
            ) : (
              <div className="space-y-6">
                <PageHeader
                  title={currentTitle}
                  subtitle={currentSubtitle}
                  breadcrumbs={[
                    { label: "Painel do Lojista" },
                    { label: activeSection.group },
                    { label: activeSection.label },
                    ...(activeSection.subLabel ? [{ label: activeSection.subLabel }] : []),
                  ]}
                />

                <InsightBanner
                  title={`Seção: ${currentTitle}`}
                  description="Esta seção está preparada e será implementada nos próximos comandos conforme a fila de módulos."
                  actionText="Voltar ao Início (Briefing IA)"
                  onAction={() => handleSelectSection("inicio", undefined, "Início", undefined, "Principal & Análise")}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <Card padding="md" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#9B998F]">
                        Estado da Navegação
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#0F7A4F]" />
                    </div>
                    <p className="text-base font-medium text-[#272727]">
                      {currentTitle}
                    </p>
                    <p className="text-xs text-[#6B6A64] leading-relaxed">
                      Módulo selecionado com sucesso no menu lateral estruturado.
                    </p>
                  </Card>

                  <Card padding="md" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#9B998F]">
                        Sincronização
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-[#004AAD]" />
                    </div>
                    <p className="text-base font-medium text-[#272727]">
                      Firestore Standalone
                    </p>
                    <p className="text-xs text-[#6B6A64] leading-relaxed">
                      Pronto para receber os schemas e regras de negócio de presentes.
                    </p>
                  </Card>

                  <Card padding="md" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#9B998F]">
                        Varejo Afetivo
                      </span>
                      <Sparkles className="w-4 h-4 text-[#004AAD]" />
                    </div>
                    <p className="text-base font-medium text-[#272727]">
                      Pessoa Física B2C
                    </p>
                    <p className="text-xs text-[#6B6A64] leading-relaxed">
                      Foco em kits, personalização com foto, mensagens e datas comemorativas.
                    </p>
                  </Card>
                </div>

                <Card padding="lg" className="border-dashed border-[#D6D3CC]">
                  <div className="text-center py-8 sm:py-12 max-w-lg mx-auto space-y-3">
                    <div className="w-10 h-10 rounded-[6px] bg-[#EEEDE8] text-[#004AAD] flex items-center justify-center mx-auto">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-medium text-[#272727]">
                      Área de Conteúdo · {currentTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#6B6A64] leading-relaxed">
                      O módulo será ativado no respectivo comando de tela.
                    </p>
                  </div>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Floating Copilot IA FAB */}
      <CopilotFab
        isOpen={isCopilotOpen}
        onOpenChange={(open) => setIsCopilotOpen(open)}
      />
    </div>
  );
};
