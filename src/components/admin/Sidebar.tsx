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
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#D6D3CC] shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col">
              <BrandLogo size="sm" />
              <span className="text-[10px] font-normal uppercase tracking-wider text-[#9B998F] mt-0.5">
                {BRAND_CONFIG.adminLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <BrandLogo size="sm" />
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
          <SidebarItem
            id="relatorios"
            label="Relatórios"
            icon={FileText}
            active={activeSection.id === "relatorios"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("relatorios", undefined, "Relatórios", undefined, "Principal & Análise")}
          />
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
              { id: "criar", label: "Criar pedido" },
              { id: "link-carrinho", label: "Link de carrinho" },
            ]}
            onSelect={(id, subId) => {
              const subLabels: Record<string, string> = {
                listar: "Listar pedidos",
                aprovacoes: "Aprovação de arte (IA)",
                criar: "Criar pedido",
                "link-carrinho": "Link de carrinho",
              };
              onSelectSection(id, subId, "Vendas", subId ? subLabels[subId] : undefined, "Gestão & Operação");
            }}
          />
          <SidebarItem
            id="carrinhos-abandonados"
            label="Carrinhos Abandonados"
            icon={ShoppingCart}
            active={activeSection.id === "carrinhos-abandonados"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("carrinhos-abandonados", undefined, "Carrinhos Abandonados", undefined, "Gestão & Operação")}
          />
          <SidebarItem
            id="ia"
            label="Inteligência Artificial"
            icon={Sparkles}
            active={activeSection.id === "ia"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("ia", undefined, "Inteligência Artificial", undefined, "Gestão & Operação")}
          />
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
              { id: "marcas", label: "Marcas" },
              { id: "grades", label: "Grades" },
              { id: "precos-segmentados", label: "Preços segmentados" },
              { id: "avaliacoes", label: "Avaliações" },
              { id: "importar", label: "Importar" },
              { id: "precificacao-markup", label: "Precificação & Markup" },
              { id: "lixeira", label: "Lixeira" },
            ]}
            onSelect={(id, subId) => {
              const subLabels: Record<string, string> = {
                listar: "Listar produtos",
                criar: "Criar produto",
                categorias: "Categorias",
                marcas: "Marcas",
                grades: "Grades",
                "precos-segmentados": "Preços segmentados",
                avaliacoes: "Avaliações",
                importar: "Importar",
                "precificacao-markup": "Precificação & Markup",
                lixeira: "Lixeira",
              };
              onSelectSection(id, subId, "Produtos", subId ? subLabels[subId] : undefined, "Gestão & Operação");
            }}
          />
          <SidebarItem
            id="financeiro"
            label="Financeiro"
            icon={DollarSign}
            active={activeSection.id === "financeiro"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("financeiro", undefined, "Financeiro", undefined, "Gestão & Operação")}
          />
          <SidebarItem
            id="fiscal"
            label="Fiscal & NF-e"
            icon={Receipt}
            active={activeSection.id === "fiscal"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("fiscal", undefined, "Fiscal & NF-e", undefined, "Gestão & Operação")}
          />
          <SidebarItem
            id="descontos"
            label="Descontos"
            icon={Percent}
            active={activeSection.id === "descontos"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("descontos", undefined, "Descontos", undefined, "Gestão & Operação")}
          />
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
            id="promocoes"
            label="Promoções"
            icon={Tag}
            active={activeSection.id === "promocoes"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("promocoes", undefined, "Promoções", undefined, "Marketing")}
          />
          <SidebarItem
            id="brinde"
            label="Brinde"
            icon={Gift}
            active={activeSection.id === "brinde"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("brinde", undefined, "Brinde", undefined, "Marketing")}
          />
          <SidebarItem
            id="cupons"
            label="Cupons"
            icon={Ticket}
            active={activeSection.id === "cupons"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("cupons", undefined, "Cupons", undefined, "Marketing")}
          />
          <SidebarItem
            id="compre-junto"
            label="Compre junto"
            icon={Layers}
            active={activeSection.id === "compre-junto"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("compre-junto", undefined, "Compre junto", undefined, "Marketing")}
          />
          <SidebarItem
            id="frete-gratis"
            label="Frete grátis"
            icon={Truck}
            active={activeSection.id === "frete-gratis"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("frete-gratis", undefined, "Frete grátis", undefined, "Marketing")}
          />
          <SidebarItem
            id="newsletter"
            label="Newsletter"
            icon={Mail}
            active={activeSection.id === "newsletter"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("newsletter", undefined, "Newsletter", undefined, "Marketing")}
          />
          <SidebarItem
            id="avise-me"
            label="Avise-me"
            icon={BellRing}
            active={activeSection.id === "avise-me"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("avise-me", undefined, "Avise-me", undefined, "Marketing")}
          />
          <SidebarItem
            id="automacoes"
            label="Automações"
            icon={Zap}
            active={activeSection.id === "automacoes"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("automacoes", undefined, "Automações", undefined, "Marketing")}
          />
          <SidebarItem
            id="pixels-tags"
            label="Pixels & Tags"
            icon={Code2}
            active={activeSection.id === "pixels-tags"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("pixels-tags", undefined, "Pixels & Tags", undefined, "Marketing")}
          />
          <SidebarItem
            id="seo"
            label="SEO"
            icon={Globe}
            active={activeSection.id === "seo"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("seo", undefined, "SEO", undefined, "Marketing")}
          />
        </SidebarGroup>

        {/* GRUPO 4: Relacionamento */}
        <SidebarGroup label="Relacionamento" isCollapsed={isCollapsed}>
          <SidebarItem
            id="indicacoes"
            label="Indicações"
            icon={Share2}
            active={activeSection.id === "indicacoes"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("indicacoes", undefined, "Indicações", undefined, "Relacionamento")}
          />
          <SidebarItem
            id="ugc"
            label="UGC / Prova Social"
            icon={Camera}
            active={activeSection.id === "ugc"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("ugc", undefined, "UGC / Prova Social", undefined, "Relacionamento")}
          />
          <SidebarItem
            id="ocasioes"
            label="Ocasiões"
            icon={CalendarHeart}
            active={activeSection.id === "ocasioes"}
            isCollapsed={isCollapsed}
            onSelect={() => onSelectSection("ocasioes", undefined, "Ocasiões", undefined, "Relacionamento")}
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
