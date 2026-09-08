import React from "react";
import {
  Home,
  BarChart3,
  FileText,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Package,
  Users,
  DollarSign,
  Receipt,
  Percent,
  Tag,
  Gift,
  Ticket,
  Layers,
  Truck,
  Mail,
  BellRing,
  Zap,
  Code2,
  Globe,
  Share2,
  Camera,
  CalendarHeart,
  Palette,
  Store,
  Settings,
  PanelLeftClose,
  PanelLeft,
  ExternalLink,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { SidebarGroup } from "./SidebarGroup";
import { SidebarItem } from "./SidebarItem";
import { BRAND_CONFIG } from "../../config/brand";

export interface ActiveSection {
  id: string;
  subId?: string;
  label: string;
  subLabel?: string;
  group: string;
}

interface SidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (id: string, subId?: string, label?: string, subLabel?: string, group?: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenStorefront?: () => void;
  className?: string;
}

/**
 * Sidebar Oficial do Painel do Lojista glos.
 * Fundo #E4E2DD, borda direita hairline #D6D3CC.
 * Todos os agrupamentos e submenus conforme especificação editorial.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  onOpenStorefront,
  className = "",
}) => {
  return (
    <aside
      className={`h-screen flex flex-col bg-[#E4E2DD] border-r border-[#D6D3CC] transition-all duration-200 select-none ${
        isCollapsed ? "w-20" : "w-72"
      } ${className}`}
    >
      {/* Topo da Sidebar: Logo + Nome + Rótulo + Recolher */}
      <div className="h-20 px-4 flex items-center justify-between border-b border-[#D6D3CC] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col justify-center">
              <BrandLogo size="md" />
              <span className="text-[10px] font-normal uppercase tracking-wider text-[#9B998F] mt-1">
                {BRAND_CONFIG.adminLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto flex items-center justify-center">
            <BrandLogo size="sm" className="max-w-[48px]" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
          title={isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Navegação e Grupos */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 no-scrollbar">
        {/* GRUPO 1: Principal & Análise */}
        {/* GRUPO 1: Principal & Análise */}
        <SidebarGroup label="Principal & Análise" isCollapsed={isCollapsed}>
          <SidebarItem
            id="inicio"
            label="Início"
            icon={Home}
            active={activeSection.id === "inicio"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("inicio", undefined, "Início", undefined, "Principal & Análise")}
          />
          <SidebarItem
            id="estatisticas"
            label="Estatísticas"
            icon={BarChart3}
            active={activeSection.id === "estatisticas"}
            activeSubId={activeSection.id === "estatisticas" ? activeSection.subId : undefined}
            isCollapsed={isCollapsed}
            subItems={[
              { id: "visao-geral", label: "Visão geral" },
              { id: "produtos", label: "Produtos" },
              { id: "vendas-clientes", label: "Vendas e clientes" },
              { id: "visitas-funil", label: "Visitas & Funil" },
              { id: "cupons", label: "Relatório de cupons" },
            ]}
            onSelect={(id, subId) => {
              const subLabels: Record<string, string> = {
                "visao-geral": "Visão geral",
                produtos: "Produtos",
                "vendas-clientes": "Vendas e clientes",
                "visitas-funil": "Visitas & Funil",
                cupons: "Relatório de cupons",
              };
              onSelectSection(id, subId, "Estatísticas", subId ? subLabels[subId] : undefined, "Principal & Análise");
            }}
          />
          {/* Relatórios oculto temporariamente até construção de tela dedicada */}
        </SidebarGroup>

        {/* GRUPO 2: Gestão & Operação */}
        <SidebarGroup label="Gestão & Operação" isCollapsed={isCollapsed}>
          <SidebarItem
            id="vendas"
            label="Vendas"
            icon={ShoppingBag}
            active={activeSection.id === "vendas"}
            activeSubId={activeSection.id === "vendas" ? activeSection.subId : undefined}
            isCollapsed={isCollapsed}
            subItems={[
              { id: "listar", label: "Listar pedidos" },
              { id: "aprovacoes", label: "Aprovação de arte (IA)" },
            ]}
            onSelect={(id, subId) => {
              const subLabels: Record<string, string> = {
                listar: "Listar pedidos",
                aprovacoes: "Aprovação de arte (IA)",
              };
              onSelectSection(id, subId, "Vendas", subId ? subLabels[subId] : undefined, "Gestão & Operação");
            }}
          />
          {/* Carrinhos Abandonados & IA ocultos temporariamente */}
          <SidebarItem
            id="produtos"
            label="Produtos"
            icon={Package}
            active={activeSection.id === "produtos"}
            activeSubId={activeSection.id === "produtos" ? activeSection.subId : undefined}
            isCollapsed={isCollapsed}
            subItems={[
              { id: "listar", label: "Listar produtos" },
              { id: "criar", label: "Criar produto" },
              { id: "categorias", label: "Categorias" },
            ]}
            onSelect={(id, subId) => {
              const subLabels: Record<string, string> = {
                listar: "Listar produtos",
                criar: "Criar produto",
                categorias: "Categorias",
              };
              onSelectSection(id, subId, "Produtos", subId ? subLabels[subId] : undefined, "Gestão & Operação");
            }}
          />
          {/* Financeiro, Fiscal e Descontos ocultos temporariamente */}
        </SidebarGroup>

        {/* GRUPO 3: Cadastro */}
        <SidebarGroup label="Cadastro" isCollapsed={isCollapsed}>
          <SidebarItem
            id="clientes"
            label="Clientes"
            icon={Users}
            active={activeSection.id === "clientes"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("clientes", undefined, "Clientes", undefined, "Cadastro")}
          />
          <SidebarItem
            id="fornecedores"
            label="Fornecedores"
            icon={Building2}
            active={activeSection.id === "fornecedores"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("fornecedores", undefined, "Fornecedores", undefined, "Cadastro")}
          />
        </SidebarGroup>

        {/* GRUPO 4: Marketing */}
        <SidebarGroup label="Marketing" isCollapsed={isCollapsed}>
          <SidebarItem
            id="marketing"
            label="Marketing"
            icon={Sparkles}
            active={activeSection.id === "marketing"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("marketing", undefined, "Marketing", undefined, "Marketing")}
          />
        </SidebarGroup>

        {/* GRUPO 5: Loja */}
        <SidebarGroup label="Loja" isCollapsed={isCollapsed}>
          <SidebarItem
            id="personalizar"
            label="Personalizar"
            icon={Palette}
            active={activeSection.id === "personalizar"}
            activeSubId={activeSection.id === "personalizar" ? activeSection.subId : undefined}
            isCollapsed={isCollapsed}
            subItems={[
              { id: "logo", label: "Logo" },
              { id: "visual", label: "Visual" },
              { id: "banners", label: "Banners" },
              { id: "css", label: "CSS" },
              { id: "redes", label: "Redes" },
              { id: "paginas", label: "Páginas" },
              { id: "editor-email", label: "Editor de e-mail" },
            ]}
            onSelect={(id, subId) => {
              const subLabels: Record<string, string> = {
                logo: "Logo",
                visual: "Visual",
                banners: "Banners",
                css: "CSS",
                redes: "Redes",
                paginas: "Páginas",
                "editor-email": "Editor de e-mail",
              };
              onSelectSection(id, subId, "Personalizar", subId ? subLabels[subId] : undefined, "Loja");
            }}
          />
          <SidebarItem
            id="canais-venda"
            label="Canais de venda"
            icon={Store}
            active={activeSection.id === "canais-venda"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("canais-venda", undefined, "Canais de venda", undefined, "Loja")}
          />
          <SidebarItem
            id="configuracoes"
            label="Configurações"
            icon={Settings}
            active={activeSection.id === "configuracoes"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("configuracoes", undefined, "Configurações", undefined, "Loja")}
          />
        </SidebarGroup>
      </div>

      {/* Rodapé da Sidebar: Firestore status + Ver Loja */}
      <div className="p-3 border-t border-[#D6D3CC] bg-[#E4E2DD] shrink-0 space-y-2">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-normal text-[#6B6A64]">
              <span className="w-2 h-2 rounded-full bg-[#0F7A4F] animate-pulse" />
              <span>Firestore sincronizado</span>
            </div>
            <button
              onClick={onOpenStorefront}
              className="w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-xs font-medium text-[#004AAD] hover:bg-[#EEEDE8] transition-colors"
            >
              <span>Ver Loja Virtual</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#0F7A4F]"
              title="Firestore sincronizado"
            />
            <button
              onClick={onOpenStorefront}
              className="p-2 rounded-[6px] text-[#004AAD] hover:bg-[#EEEDE8]"
              title="Ver Loja Virtual"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
