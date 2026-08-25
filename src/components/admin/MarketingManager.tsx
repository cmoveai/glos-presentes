import React, { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Layers,
  LayoutGrid,
  Maximize2,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Calendar,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  UploadCloud,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { MarketingPeca, MarketingPecaTipo } from "../../types";
import {
  fetchMarketingPecas,
  saveMarketingPeca,
  deleteMarketingPeca,
  toggleMarketingPecaAtivo,
  reorderMarketingPecas,
  uploadMarketingPecaImage,
  getPecaStatusInfo,
} from "../../services/marketingPecasService";
import { Card } from "./Card";
import { PageHeader } from "./PageHeader";
import { useToast } from "../../context/ToastContext";

interface TabConfig {
  tipo: MarketingPecaTipo;
  label: string;
  shortLabel: string;
  description: string;
  recommendedSize: string;
  icon: React.ElementType;
}

const TABS: TabConfig[] = [
  {
    tipo: "full_banner",
    label: "Full Banners",
    shortLabel: "Full Banner",
    description: "Banners principais de largura total exibidos no carrossel de topo da página inicial da loja.",
    recommendedSize: "1920 × 600 px (3.2:1)",
    icon: Layers,
  },
  {
    tipo: "banner",
    label: "Banners Secundários",
    shortLabel: "Banner",
    description: "Faixas visuais intermediárias distribuídas entre as vitrines de produtos da home.",
    recommendedSize: "1200 × 400 px (3:1)",
    icon: ImageIcon,
  },
  {
    tipo: "card",
    label: "Cards & Atalhos",
    shortLabel: "Card",
    description: "Blocos visuais compactos para destacar coleções temáticas, kits ou atalhos de navegação.",
    recommendedSize: "600 × 600 px (1:1) ou 800 × 600 px (4:3)",
    icon: LayoutGrid,
  },
  {
    tipo: "popup",
    label: "Pop-ups de Campanha",
    shortLabel: "Pop-up",
    description: "Janela sobreposta exibida para os clientes na loja (avisos comemorativos, campanhas e avisos especiais).",
    recommendedSize: "600 × 500 px (ajustável)",
    icon: Maximize2,
  },
];

export const MarketingManager: React.FC = () => {
  const { showToast, success, error, info } = useToast();
  const [activeTab, setActiveTab] = useState<MarketingPecaTipo>("full_banner");
  const [pecas, setPecas] = useState<MarketingPeca[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal de edição / criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPeca, setEditingPeca] = useState<MarketingPeca | null>(null);

  // Estados do formulário
  const [formTipo, setFormTipo] = useState<MarketingPecaTipo>("full_banner");
  const [formTitulo, setFormTitulo] = useState("");
  const [formLinkDestino, setFormLinkDestino] = useState("");
  const [formImagemUrl, setFormImagemUrl] = useState("");
  const [formOrdem, setFormOrdem] = useState<number>(1);
  const [formAtivo, setFormAtivo] = useState(true);
  const [formHasValidity, setFormHasValidity] = useState(false);
  const [formDataInicio, setFormDataInicio] = useState("");
  const [formDataFim, setFormDataFim] = useState("");
  const [formLargura, setFormLargura] = useState<number | undefined>(600);
  const [formAltura, setFormAltura] = useState<number | undefined>(500);

  // Upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Confirmação de exclusão
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carrega as peças do Firestore
  const loadPecas = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMarketingPecas();
      setPecas(data);
    } catch (err) {
      console.error("Erro ao carregar peças:", err);
      error("Erro ao carregar peças visuais.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPecas();
  }, []);

  const currentTabConfig = TABS.find((t) => t.tipo === activeTab) || TABS[0];
  const currentPecas = pecas
    .filter((p) => p.tipo === activeTab)
    .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));

  // Abrir modal de criação
  const handleOpenCreateModal = (tipo: MarketingPecaTipo) => {
    setEditingPeca(null);
    setFormTipo(tipo);
    setFormTitulo("");
    setFormLinkDestino("");
    setFormImagemUrl("");
    // Próxima ordem disponível dentro do tipo
    const pecasDoTipo = pecas.filter((p) => p.tipo === tipo);
    const nextOrder = pecasDoTipo.length > 0 ? Math.max(...pecasDoTipo.map((p) => p.ordem || 0)) + 1 : 1;
    setFormOrdem(nextOrder);
    setFormAtivo(true);
    setFormHasValidity(false);
    setFormDataInicio("");
    setFormDataFim("");
    setFormLargura(tipo === "popup" ? 600 : undefined);
    setFormAltura(tipo === "popup" ? 500 : undefined);
    setIsModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (peca: MarketingPeca) => {
    setEditingPeca(peca);
    setFormTipo(peca.tipo);
    setFormTitulo(peca.titulo || "");
    setFormLinkDestino(peca.linkDestino || "");
    setFormImagemUrl(peca.imagemUrl || "");
    setFormOrdem(peca.ordem ?? 1);
    setFormAtivo(peca.ativo !== false);
    const hasVal = Boolean(peca.dataInicio || peca.dataFim);
    setFormHasValidity(hasVal);
    setFormDataInicio(peca.dataInicio ? peca.dataInicio.slice(0, 16) : "");
    setFormDataFim(peca.dataFim ? peca.dataFim.slice(0, 16) : "");
    setFormLargura(peca.largura);
    setFormAltura(peca.altura);
    setIsModalOpen(true);
  };

  // Upload de arquivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    // Validação básica de tipo
    if (!file.type.startsWith("image/")) {
      info("Selecione um arquivo de imagem válido (JPG, PNG, WebP, SVG).");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    try {
      const url = await uploadMarketingPecaImage(file, (p) => setUploadProgress(p));
      setFormImagemUrl(url);
      success("Imagem carregada com sucesso.");
    } catch (err) {
      console.error("Erro no upload da imagem:", err);
      error("Falha ao subir imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Salvar peça
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formImagemUrl.trim()) {
      info("Por favor, faça o upload da imagem da peça.");
      return;
    }

    setIsSaving(true);
    try {
      const payload: MarketingPeca = {
        id: editingPeca ? editingPeca.id : `peca_${formTipo}_${Date.now()}`,
        tipo: formTipo,
        imagemUrl: formImagemUrl.trim(),
        titulo: formTitulo.trim() || undefined,
        linkDestino: formLinkDestino.trim() || undefined,
        ordem: Number(formOrdem) || 1,
        ativo: formAtivo,
        dataInicio: formHasValidity && formDataInicio ? new Date(formDataInicio).toISOString() : undefined,
        dataFim: formHasValidity && formDataFim ? new Date(formDataFim).toISOString() : undefined,
        largura: formTipo === "popup" && formLargura ? Number(formLargura) : undefined,
        altura: formTipo === "popup" && formAltura ? Number(formAltura) : undefined,
        createdAt: editingPeca ? editingPeca.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const saveOk = await saveMarketingPeca(payload);
      if (saveOk) {
        success(editingPeca ? "Peça visual atualizada com sucesso!" : "Nova peça visual cadastrada!");
        setIsModalOpen(false);
        await loadPecas();
      } else {
        error("Erro ao salvar peça visual.");
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      error("Erro ao processar dados da peça.");
    } finally {
      setIsSaving(false);
    }
  };

  // Excluir peça
  const handleDelete = async (id: string) => {
    try {
      const deleteOk = await deleteMarketingPeca(id);
      if (deleteOk) {
        success("Peça removida com sucesso.");
        setDeletingId(null);
        await loadPecas();
      } else {
        error("Erro ao excluir peça.");
      }
    } catch (err) {
      console.error("Erro ao excluir:", err);
      error("Falha ao excluir peça.");
    }
  };

  // Toggle rápido ativo/inativo
  const handleToggleAtivo = async (peca: MarketingPeca) => {
    const nextState = !peca.ativo;
    // Otimista
    setPecas((prev) =>
      prev.map((p) => (p.id === peca.id ? { ...p, ativo: nextState } : p))
    );
    try {
      await toggleMarketingPecaAtivo(peca.id, nextState);
      info(nextState ? "Peça ativada na loja." : "Peça desativada.");
    } catch (err) {
      console.error("Erro ao alternar status:", err);
      error("Erro ao atualizar status.");
      await loadPecas();
    }
  };

  // Mover ordem para cima
  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    const items = [...currentPecas];
    const temp = items[index];
    items[index] = items[index - 1];
    items[index - 1] = temp;

    const idsInOrder = items.map((p) => p.id);
    // Atualização otimista
    setPecas((prev) => {
      const others = prev.filter((p) => p.tipo !== activeTab);
      const updated = items.map((item, idx) => ({ ...item, ordem: idx + 1 }));
      return [...others, ...updated];
    });

    try {
      await reorderMarketingPecas(activeTab, idsInOrder);
      success("Ordem de exibição atualizada.");
    } catch (err) {
      console.error("Erro ao reordenar:", err);
      await loadPecas();
    }
  };

  // Mover ordem para baixo
  const handleMoveDown = async (index: number) => {
    if (index >= currentPecas.length - 1) return;
    const items = [...currentPecas];
    const temp = items[index];
    items[index] = items[index + 1];
    items[index + 1] = temp;

    const idsInOrder = items.map((p) => p.id);
    // Atualização otimista
    setPecas((prev) => {
      const others = prev.filter((p) => p.tipo !== activeTab);
      const updated = items.map((item, idx) => ({ ...item, ordem: idx + 1 }));
      return [...others, ...updated];
    });

    try {
      await reorderMarketingPecas(activeTab, idsInOrder);
      success("Ordem de exibição atualizada.");
    } catch (err) {
      console.error("Erro ao reordenar:", err);
      await loadPecas();
    }
  };

  // Formata data amigável
  const formatFriendlyDate = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing · Peças Visuais da Loja"
        subtitle="Gerenciador autoral de banners, cards e pop-ups. Crie, suba artes, defina destinos, ative e agende períodos sem depender de código."
        breadcrumbs={[
          { label: "Painel do Lojista" },
          { label: "Marketing" },
          { label: "Peças Visuais" },
        ]}
        actions={
          <button
            onClick={() => handleOpenCreateModal(activeTab)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Peça ({currentTabConfig.shortLabel})</span>
          </button>
        }
      />

      {/* 4 Seções / Abas de Tipos de Peça */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[8px]">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.tipo;
          const count = pecas.filter((p) => p.tipo === tab.tipo).length;
          const activeCount = pecas.filter((p) => p.tipo === tab.tipo && p.ativo).length;

          return (
            <button
              key={tab.tipo}
              onClick={() => setActiveTab(tab.tipo)}
              className={`flex-1 min-w-[160px] flex items-center justify-between px-3.5 py-2.5 rounded-[6px] text-xs font-medium transition-all ${
                isSelected
                  ? "bg-[#F4F3EF] text-[#004AAD] shadow-2xs border border-[#D6D3CC]"
                  : "text-[#6B6A64] hover:text-[#272727] hover:bg-[#E4E2DD]/60 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isSelected ? "text-[#004AAD]" : "text-[#6B6A64]"}`} />
                <span className="whitespace-nowrap">{tab.label}</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full border tabular-nums font-normal ${
                  isSelected
                    ? "bg-[#004AAD]/10 text-[#004AAD] border-[#004AAD]/20"
                    : "bg-[#E4E2DD] text-[#6B6A64] border-[#D6D3CC]"
                }`}
              >
                {count > 0 ? `${activeCount}/${count}` : "0"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cartão de Informações e Orientação do Tipo Ativo */}
      <Card padding="sm" className="bg-[#F4F3EF] border-[#D6D3CC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="p-2 rounded-[6px] bg-[#EEEDE8] text-[#004AAD] shrink-0 mt-0.5">
            <currentTabConfig.icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-[#272727]">{currentTabConfig.description}</p>
            <p className="text-[11px] text-[#6B6A64] mt-0.5">
              Dimensão recomendada: <span className="font-medium text-[#272727]">{currentTabConfig.recommendedSize}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => handleOpenCreateModal(activeTab)}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#D6D3CC] bg-[#EEEDE8] hover:bg-[#E4E2DD] text-[#272727] text-xs font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-[#004AAD]" />
          <span>Adicionar {currentTabConfig.shortLabel}</span>
        </button>
      </Card>

      {/* Listagem de Peças ou Estado Vazio Honesto */}
      {isLoading ? (
        <Card padding="lg" className="text-center py-16">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#004AAD] mb-2" />
          <p className="text-xs text-[#6B6A64]">Carregando peças de marketing...</p>
        </Card>
      ) : currentPecas.length === 0 ? (
        /* ESTADO VAZIO HONESTO: Nenhuma peça fictícia */
        <Card padding="lg" className="border-dashed border-[#D6D3CC] text-center py-12 sm:py-16">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-[8px] bg-[#EEEDE8] text-[#004AAD] flex items-center justify-center mx-auto">
              <currentTabConfig.icon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-medium text-[#272727]">
              Nenhum {currentTabConfig.shortLabel.toLowerCase()} cadastrado
            </h3>
            <p className="text-xs text-[#6B6A64] leading-relaxed">
              Você ainda não subiu artes para esta seção. Ao cadastrar um {currentTabConfig.shortLabel.toLowerCase()}, você poderá definir imagem, link de destino, ordenação e período de validade.
            </p>
            <div className="pt-2">
              <button
                onClick={() => handleOpenCreateModal(activeTab)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Criar primeiro {currentTabConfig.shortLabel}</span>
              </button>
            </div>
          </div>
        </Card>
      ) : (
        /* Grid / Lista de Peças Cadastradas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentPecas.map((peca, idx) => {
            const statusInfo = getPecaStatusInfo(peca);
            const hasDates = Boolean(peca.dataInicio || peca.dataFim);

            return (
              <Card
                key={peca.id}
                padding="none"
                className="overflow-hidden flex flex-col bg-[#F4F3EF] border-[#D6D3CC] transition-all hover:border-[#004AAD]/40"
              >
                {/* Visual Preview da Imagem */}
                <div
                  className={`relative w-full bg-[#E4E2DD] border-b border-[#D6D3CC] overflow-hidden group ${
                    peca.tipo === "full_banner"
                      ? "aspect-[16/6]"
                      : peca.tipo === "banner"
                      ? "aspect-[16/7]"
                      : peca.tipo === "card"
                      ? "aspect-square max-h-56"
                      : "aspect-[4/3] max-h-56"
                  }`}
                >
                  <img
                    src={peca.imagemUrl}
                    alt={peca.titulo || "Peça visual"}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-102"
                  />

                  {/* Badges de Posição e Ordem */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#272727]/80 backdrop-blur-xs text-white text-[11px] font-normal tabular-nums">
                      #{idx + 1}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-[4px] border text-[11px] font-medium backdrop-blur-xs ${statusInfo.badgeClass}`}
                    >
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Pop-up Dimensões Badge */}
                  {peca.tipo === "popup" && (peca.largura || peca.altura) && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2 py-0.5 rounded-[4px] bg-[#272727]/80 backdrop-blur-xs text-white text-[11px] tabular-nums font-normal">
                        {peca.largura || 600} × {peca.altura || 500} px
                      </span>
                    </div>
                  )}
                </div>

                {/* Conteúdo e Informações */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-[#272727] line-clamp-1">
                        {peca.titulo || <span className="text-[#9B998F] italic">Sem título definido</span>}
                      </h4>
                    </div>

                    {/* Link de destino */}
                    <div className="flex items-center gap-1.5 text-xs text-[#6B6A64]">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#9B998F]" />
                      <span className="truncate" title={peca.linkDestino || "Nenhum link associado"}>
                        {peca.linkDestino ? (
                          <span className="text-[#004AAD] font-mono text-[11px]">{peca.linkDestino}</span>
                        ) : (
                          <span className="text-[#9B998F]">Sem link (apenas visual)</span>
                        )}
                      </span>
                    </div>

                    {/* Período de Validade se houver */}
                    {hasDates && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B6A64] pt-1">
                        <Clock className="w-3 h-3 text-[#9B998F] shrink-0" />
                        <span>
                          {peca.dataInicio && peca.dataFim
                            ? `${formatFriendlyDate(peca.dataInicio)} até ${formatFriendlyDate(peca.dataFim)}`
                            : peca.dataInicio
                            ? `A partir de ${formatFriendlyDate(peca.dataInicio)}`
                            : `Até ${formatFriendlyDate(peca.dataFim)}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Controles de Ação e Reordenação */}
                  <div className="pt-3 border-t border-[#D6D3CC] flex items-center justify-between gap-2">
                    {/* Botões de Subir / Descer Ordem */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        title="Mover para cima"
                        className="p-1.5 rounded-[4px] border border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === currentPecas.length - 1}
                        title="Mover para baixo"
                        className="p-1.5 rounded-[4px] border border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Ativar/Desativar + Editar + Excluir */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleAtivo(peca)}
                        className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                          peca.ativo
                            ? "border-[#0F7A4F]/30 bg-[#0F7A4F]/5 text-[#0F7A4F] hover:bg-[#0F7A4F]/10"
                            : "border-[#D6D3CC] bg-[#EEEDE8] text-[#6B6A64] hover:text-[#272727]"
                        }`}
                        title={peca.ativo ? "Clique para desativar" : "Clique para ativar"}
                      >
                        {peca.ativo ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{peca.ativo ? "Ativo" : "Inativo"}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditModal(peca)}
                        className="p-1.5 rounded-[6px] border border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
                        title="Editar peça"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeletingId(peca.id)}
                        className="p-1.5 rounded-[6px] border border-[#D6D3CC] text-[#9B2C2C] hover:bg-[#9B2C2C]/5 transition-colors"
                        title="Excluir peça"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Criação / Edição de Peça */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-lg">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#D6D3CC] flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-[#272727]">
                  {editingPeca ? `Editar ${currentTabConfig.shortLabel}` : `Novo ${currentTabConfig.shortLabel}`}
                </h3>
                <p className="text-xs text-[#6B6A64] mt-0.5">
                  Preencha as informações visuais e regras de exibição na loja.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Formulário */}
            <form onSubmit={handleSave} className="p-6 space-y-5 flex-1">
              {/* Seletor de Tipo (se quiser mudar) */}
              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1.5">
                  Tipo de Peça
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {TABS.map((t) => (
                    <button
                      key={t.tipo}
                      type="button"
                      onClick={() => setFormTipo(t.tipo)}
                      className={`px-3 py-2 rounded-[6px] text-xs font-medium border text-center transition-all ${
                        formTipo === t.tipo
                          ? "border-[#004AAD] bg-[#004AAD]/5 text-[#004AAD] ring-1 ring-[#004AAD]"
                          : "border-[#D6D3CC] bg-[#EEEDE8] text-[#6B6A64] hover:text-[#272727]"
                      }`}
                    >
                      {t.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload de Imagem */}
              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1.5">
                  Arte / Imagem da Peça <span className="text-[#9B2C2C]">*</span>
                </label>

                {formImagemUrl ? (
                  <div className="relative border border-[#D6D3CC] rounded-[8px] overflow-hidden bg-[#E4E2DD] group">
                    <img
                      src={formImagemUrl}
                      alt="Preview da peça"
                      referrerPolicy="no-referrer"
                      className="w-full max-h-48 object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-[6px] bg-white text-[#272727] text-xs font-medium hover:bg-stone-100 flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Trocar Imagem</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormImagemUrl("")}
                        className="px-3 py-1.5 rounded-[6px] bg-[#9B2C2C] text-white text-xs font-medium hover:bg-[#802222] flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D6D3CC] hover:border-[#004AAD] rounded-[8px] p-6 text-center bg-[#EEEDE8] hover:bg-[#E4E2DD] transition-all cursor-pointer space-y-2"
                  >
                    <div className="w-10 h-10 rounded-[6px] bg-[#F4F3EF] text-[#004AAD] flex items-center justify-center mx-auto">
                      {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[#272727]">
                        {isUploading ? "Subindo imagem..." : "Clique para selecionar ou arraste o arquivo"}
                      </p>
                      <p className="text-[11px] text-[#6B6A64] mt-0.5">
                        JPG, PNG, WebP ou SVG. Dimensão recomendada: {TABS.find((t) => t.tipo === formTipo)?.recommendedSize}
                      </p>
                    </div>

                    {isUploading && (
                      <div className="w-full bg-[#D6D3CC] h-1.5 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-[#004AAD] h-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Título da Peça (Opcional) */}
              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1.5">
                  Título ou Rótulo Interno <span className="text-[#9B998F] font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Campanha Dia das Mães — Coleção Afeto"
                  className="w-full px-3.5 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] text-xs focus:outline-hidden focus:border-[#004AAD] focus:bg-white"
                />
              </div>

              {/* Link de Destino */}
              <div>
                <label className="block text-xs font-medium text-[#272727] mb-1.5">
                  Link de Destino / Redirecionamento <span className="text-[#9B998F] font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={formLinkDestino}
                  onChange={(e) => setFormLinkDestino(e.target.value)}
                  placeholder="Ex: /catalogo?categoria=kits-presenteaveis ou https://..."
                  className="w-full px-3.5 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] text-xs focus:outline-hidden focus:border-[#004AAD] focus:bg-white font-mono"
                />
                <p className="text-[11px] text-[#6B6A64] mt-1">
                  Ao clicar na peça na loja, o cliente será direcionado para esta URL ou categoria.
                </p>
              </div>

              {/* Ordem e Ativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#272727] mb-1.5">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formOrdem}
                    onChange={(e) => setFormOrdem(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] text-xs focus:outline-hidden focus:border-[#004AAD] focus:bg-white tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#272727] mb-1.5">
                    Status na Loja
                  </label>
                  <label className="flex items-center gap-2.5 px-3.5 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAtivo}
                      onChange={(e) => setFormAtivo(e.target.checked)}
                      className="w-4 h-4 text-[#004AAD] rounded-[4px] border-[#D6D3CC] focus:ring-0"
                    />
                    <span className="text-xs font-medium text-[#272727]">
                      {formAtivo ? "Peça Ativa (visível na loja)" : "Peça Inativa (pausada)"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Campos Exclusivos de Pop-up (Medidas Largura / Altura) */}
              {formTipo === "popup" && (
                <div className="p-3.5 rounded-[8px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="w-3.5 h-3.5 text-[#004AAD]" />
                    <span className="text-xs font-medium text-[#272727]">Medidas do Pop-up (px)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#6B6A64] mb-1">Largura (pixels)</label>
                      <input
                        type="number"
                        min="200"
                        max="1200"
                        value={formLargura || 600}
                        onChange={(e) => setFormLargura(parseInt(e.target.value) || 600)}
                        className="w-full px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs tabular-nums text-[#272727]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B6A64] mb-1">Altura (pixels)</label>
                      <input
                        type="number"
                        min="200"
                        max="1200"
                        value={formAltura || 500}
                        onChange={(e) => setFormAltura(parseInt(e.target.value) || 500)}
                        className="w-full px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs tabular-nums text-[#272727]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Agendamento de Validade */}
              <div className="p-3.5 rounded-[8px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#004AAD]" />
                    <span className="text-xs font-medium text-[#272727]">Agendar período de validade</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formHasValidity}
                    onChange={(e) => setFormHasValidity(e.target.checked)}
                    className="w-4 h-4 text-[#004AAD] rounded-[4px] border-[#D6D3CC] focus:ring-0"
                  />
                </label>

                {formHasValidity ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#D6D3CC]">
                    <div>
                      <label className="block text-[11px] text-[#6B6A64] mb-1">Data / Hora de Início</label>
                      <input
                        type="datetime-local"
                        value={formDataInicio}
                        onChange={(e) => setFormDataInicio(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs tabular-nums text-[#272727]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#6B6A64] mb-1">Data / Hora de Fim</label>
                      <input
                        type="datetime-local"
                        value={formDataFim}
                        onChange={(e) => setFormDataFim(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs tabular-nums text-[#272727]"
                      />
                    </div>
                    <p className="sm:col-span-2 text-[11px] text-[#6B6A64]">
                      A peça só será exibida na loja dentro deste intervalo de datas e horas.
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#6B6A64]">
                    Sem validade configurada: a peça será exibida continuamente enquanto estiver ativa.
                  </p>
                )}
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-[#D6D3CC] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] border border-[#D6D3CC] bg-[#EEEDE8] hover:bg-[#E4E2DD] text-[#272727] text-xs font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="px-5 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Salvar Peça</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none">
          <div className="bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] max-w-sm w-full p-6 space-y-4 shadow-lg text-center">
            <div className="w-10 h-10 rounded-[6px] bg-[#9B2C2C]/10 text-[#9B2C2C] flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-[#272727]">Excluir peça visual?</h4>
              <p className="text-xs text-[#6B6A64] mt-1 leading-relaxed">
                Esta peça será removida permanentemente do gerenciador e deixará de ser exibida na loja virtual.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-[6px] border border-[#D6D3CC] bg-[#EEEDE8] text-[#272727] text-xs font-medium hover:bg-[#E4E2DD]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 rounded-[6px] bg-[#9B2C2C] text-white text-xs font-medium hover:bg-[#802222]"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
