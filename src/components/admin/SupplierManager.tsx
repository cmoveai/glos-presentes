import React, { useState, useEffect, useMemo } from "react";
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  X,
  Save,
  MessageSquare,
  Package,
  FileText,
  HelpCircle,
  Filter,
} from "lucide-react";
import { Supplier, Product } from "../../types";
import {
  fetchSuppliers,
  saveSupplier,
  deleteSupplier,
  lookupCnpj,
  DEFAULT_SUPPLIER_FABRICACAO_PROPRIA,
} from "../../lib/firebase";
import { Card } from "./Card";
import { PageHeader } from "./PageHeader";

interface SupplierManagerProps {
  products?: Product[];
  onShowToast?: (message: string, type?: "success" | "error") => void;
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
function formatCnpjDisplay(cnpj?: string): string {
  if (!cnpj) return "—";
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  return cnpj;
}

/**
 * Formata Telefone ou WhatsApp para exibição
 */
function formatPhoneDisplay(phone?: string): string {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Gera link direto para WhatsApp
 */
function getWhatsAppUrl(phone?: string, contactName?: string): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return null;
  if (!cleaned.startsWith("55") && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = `55${cleaned}`;
  }
  const name = contactName ? contactName.trim().split(" ")[0] : "fornecedor";
  const msg = encodeURIComponent(`Olá ${name}, tudo bem? Aqui é da Glos Presentes.`);
  return `https://wa.me/${cleaned}?text=${msg}`;
}

export const SupplierManager: React.FC<SupplierManagerProps> = ({
  products = [],
  onShowToast,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("todos");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [cnpjSuccessMessage, setCnpjSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formCnpj, setFormCnpj] = useState("");
  const [formRazaoSocial, setFormRazaoSocial] = useState("");
  const [formNomeFantasia, setFormNomeFantasia] = useState("");
  const [formSituacaoCadastral, setFormSituacaoCadastral] = useState("ATIVA");
  const [formLogradouro, setFormLogradouro] = useState("");
  const [formNumero, setFormNumero] = useState("");
  const [formComplemento, setFormComplemento] = useState("");
  const [formBairro, setFormBairro] = useState("");
  const [formMunicipio, setFormMunicipio] = useState("");
  const [formUf, setFormUf] = useState("SP");
  const [formCep, setFormCep] = useState("");
  const [formTelefone, setFormTelefone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formContatoNome, setFormContatoNome] = useState("");
  const [formContatoWhatsapp, setFormContatoWhatsapp] = useState("");
  const [formContatoEmail, setFormContatoEmail] = useState("");
  const [formPrazoEntregaDias, setFormPrazoEntregaDias] = useState<number | "">(3);
  const [formCondicoesPagamento, setFormCondicoesPagamento] = useState("30 dias (Boleto/Pix)");
  const [formObservacoes, setFormObservacoes] = useState("");
  const [formAtivo, setFormAtivo] = useState(true);

  // Modal de confirmação de exclusão
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Carrega fornecedores do Firestore
  const loadSuppliersData = async () => {
    setLoading(true);
    try {
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Erro ao buscar fornecedores:", err);
      if (onShowToast) onShowToast("Erro ao carregar lista de fornecedores.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliersData();
  }, []);

  // Mapeia contagem de produtos vinculados a cada fornecedor
  const productCountBySupplier = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      // Se não tiver fornecedorId, conta como fabricação própria padrão
      const fId = p.fornecedorId || DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.id;
      map[fId] = (map[fId] || 0) + 1;
    });
    return map;
  }, [products]);

  // Filtra fornecedores
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      // Filtro de status
      if (statusFilter === "ativos" && !s.ativo) return false;
      if (statusFilter === "inativos" && s.ativo) return false;

      // Filtro de busca
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const matchRazao = (s.razaoSocial || "").toLowerCase().includes(term);
      const matchFantasia = (s.nomeFantasia || "").toLowerCase().includes(term);
      const matchCnpj = (s.cnpj || "").replace(/\D/g, "").includes(term.replace(/\D/g, ""));
      const matchCidade = (s.municipio || "").toLowerCase().includes(term);
      const matchUf = (s.uf || "").toLowerCase().includes(term);
      const matchContato = (s.contatoNome || "").toLowerCase().includes(term);

      return matchRazao || matchFantasia || matchCnpj || matchCidade || matchUf || matchContato;
    });
  }, [suppliers, searchTerm, statusFilter]);

  // Abertura do formulário (novo ou edição)
  const handleOpenNew = () => {
    setEditingSupplier(null);
    setFormCnpj("");
    setFormRazaoSocial("");
    setFormNomeFantasia("");
    setFormSituacaoCadastral("ATIVA");
    setFormLogradouro("");
    setFormNumero("");
    setFormComplemento("");
    setFormBairro("");
    setFormMunicipio("");
    setFormUf("SP");
    setFormCep("");
    setFormTelefone("");
    setFormEmail("");
    setFormContatoNome("");
    setFormContatoWhatsapp("");
    setFormContatoEmail("");
    setFormPrazoEntregaDias(3);
    setFormCondicoesPagamento("30 dias (Boleto/Pix)");
    setFormObservacoes("");
    setFormAtivo(true);
    setCnpjError(null);
    setCnpjSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormCnpj(supplier.cnpj || "");
    setFormRazaoSocial(supplier.razaoSocial || "");
    setFormNomeFantasia(supplier.nomeFantasia || "");
    setFormSituacaoCadastral(supplier.situacaoCadastral || "ATIVA");
    setFormLogradouro(supplier.logradouro || "");
    setFormNumero(supplier.numero || "");
    setFormComplemento(supplier.complemento || "");
    setFormBairro(supplier.bairro || "");
    setFormMunicipio(supplier.municipio || "");
    setFormUf(supplier.uf || "SP");
    setFormCep(supplier.cep || "");
    setFormTelefone(supplier.telefone || "");
    setFormEmail(supplier.email || "");
    setFormContatoNome(supplier.contatoNome || "");
    setFormContatoWhatsapp(supplier.contatoWhatsapp || "");
    setFormContatoEmail(supplier.contatoEmail || "");
    setFormPrazoEntregaDias(supplier.prazoEntregaDias ?? 3);
    setFormCondicoesPagamento(supplier.condicoesPagamento || "30 dias");
    setFormObservacoes(supplier.observacoes || "");
    setFormAtivo(supplier.ativo ?? true);
    setCnpjError(null);
    setCnpjSuccessMessage(null);
    setIsModalOpen(true);
  };

  // Dispara busca por CNPJ
  const handleCnpjLookup = async (cnpjToQuery?: string) => {
    const rawCnpj = (cnpjToQuery || formCnpj).replace(/\D/g, "");
    if (rawCnpj.length !== 14) {
      setCnpjError("Digite os 14 números do CNPJ para buscar os dados cadastrais.");
      return;
    }

    setIsSearchingCnpj(true);
    setCnpjError(null);
    setCnpjSuccessMessage(null);

    try {
      const res = await lookupCnpj(rawCnpj);
      if (res.success && res.data) {
        const data = res.data;
        if (data.razaoSocial) setFormRazaoSocial(data.razaoSocial);
        if (data.nomeFantasia) setFormNomeFantasia(data.nomeFantasia);
        if (data.situacaoCadastral) setFormSituacaoCadastral(data.situacaoCadastral);
        if (data.logradouro) setFormLogradouro(data.logradouro);
        if (data.numero) setFormNumero(data.numero);
        if (data.complemento) setFormComplemento(data.complemento);
        if (data.bairro) setFormBairro(data.bairro);
        if (data.municipio) setFormMunicipio(data.municipio);
        if (data.uf) setFormUf(data.uf);
        if (data.cep) setFormCep(data.cep);
        if (data.email) setFormEmail(data.email);
        if (data.telefone) {
          setFormTelefone(data.telefone);
          if (!formContatoWhatsapp) {
            setFormContatoWhatsapp(data.telefone);
          }
        }
        setCnpjSuccessMessage("Dados cadastrais importados com sucesso da Receita Federal.");
      } else {
        setCnpjError(
          res.error ||
            "Não foi possível buscar os dados automaticamente. Você pode preencher os campos manualmente abaixo."
        );
      }
    } catch (err: any) {
      setCnpjError(
        "Falha ao conectar com o serviço de CNPJ. Prossiga preenchendo os dados da empresa manualmente."
      );
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  // Handler para salvar fornecedor
  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formRazaoSocial.trim() && !formNomeFantasia.trim()) {
      setCnpjError("Informe ao menos a Razão Social ou Nome Fantasia do fornecedor.");
      return;
    }

    setIsSaving(true);
    try {
      const supplierId =
        editingSupplier?.id || `forn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const newSupplier: Supplier = {
        id: supplierId,
        cnpj: formCnpj.replace(/\D/g, "") || (editingSupplier?.cnpj ?? ""),
        razaoSocial: formRazaoSocial.trim() || formNomeFantasia.trim(),
        nomeFantasia: formNomeFantasia.trim() || formRazaoSocial.trim(),
        situacaoCadastral: formSituacaoCadastral || "ATIVA",
        logradouro: formLogradouro.trim() || undefined,
        numero: formNumero.trim() || undefined,
        complemento: formComplemento.trim() || undefined,
        bairro: formBairro.trim() || undefined,
        municipio: formMunicipio.trim() || undefined,
        uf: formUf || undefined,
        cep: formCep.replace(/\D/g, "") || undefined,
        telefone: formTelefone.trim() || undefined,
        email: formEmail.trim() || undefined,
        contatoNome: formContatoNome.trim() || undefined,
        contatoWhatsapp: formContatoWhatsapp.trim() || undefined,
        contatoEmail: formContatoEmail.trim() || undefined,
        prazoEntregaDias: formPrazoEntregaDias === "" ? undefined : Number(formPrazoEntregaDias),
        condicoesPagamento: formCondicoesPagamento.trim() || undefined,
        observacoes: formObservacoes.trim() || undefined,
        ativo: formAtivo,
        isDefaultFabricacaoPropria: editingSupplier?.isDefaultFabricacaoPropria ?? false,
        createdAt: editingSupplier?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveSupplier(newSupplier);

      // Atualiza lista local
      setSuppliers((prev) => {
        const index = prev.findIndex((s) => s.id === newSupplier.id);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = newSupplier;
          return clone;
        }
        return [newSupplier, ...prev];
      });

      setIsModalOpen(false);
      if (onShowToast) {
        onShowToast(
          editingSupplier ? "Fornecedor atualizado com sucesso!" : "Fornecedor cadastrado com sucesso!",
          "success"
        );
      }
    } catch (err: any) {
      console.error("Erro ao salvar fornecedor:", err);
      setCnpjError("Erro ao salvar fornecedor. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handler de exclusão
  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSupplier(supplierToDelete.id);
      setSuppliers((prev) => prev.filter((s) => s.id !== supplierToDelete.id));
      setSupplierToDelete(null);
      if (onShowToast) {
        onShowToast("Fornecedor removido com sucesso.", "success");
      }
    } catch (err: any) {
      console.error("Erro ao excluir fornecedor:", err);
      if (onShowToast) {
        onShowToast(err.message || "Erro ao excluir fornecedor.", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Estatísticas rápidas
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.ativo).length;
  const totalLinkedProducts = (Object.values(productCountBySupplier) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <PageHeader
        title="Fornecedores"
        subtitle="Cadastro de fornecedores de presentes, matéria-prima, embalagens e parceiros"
        breadcrumbs={[
          { label: "Painel do Lojista" },
          { label: "Cadastro" },
          { label: "Fornecedores" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadSuppliersData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
              title="Atualizar lista do Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Fornecedor</span>
            </button>
          </div>
        }
      />

      {/* Cartões de Indicadores (Métricas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6B6A64]">
            <span>Total Cadastrados</span>
            <Building2 className="w-4 h-4 text-[#004AAD]" />
          </div>
          <div className="text-2xl font-medium text-[#272727] tabular-nums">
            {totalSuppliers}
          </div>
          <div className="text-[11px] text-[#6B6A64]">
            {activeSuppliers} ativos no catálogo
          </div>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6B6A64]">
            <span>Produtos Vinculados</span>
            <Package className="w-4 h-4 text-[#004AAD]" />
          </div>
          <div className="text-2xl font-medium text-[#272727] tabular-nums">
            {totalLinkedProducts}
          </div>
          <div className="text-[11px] text-[#6B6A64]">
            Itens atribuídos a fornecedores
          </div>
        </Card>

        <Card padding="md" className="space-y-1">
          <div className="flex items-center justify-between text-xs text-[#6B6A64]">
            <span>Fabricação Própria</span>
            <CheckCircle2 className="w-4 h-4 text-[#0F7A4F]" />
          </div>
          <div className="text-2xl font-medium text-[#272727] tabular-nums">
            {productCountBySupplier[DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.id] || 0}
          </div>
          <div className="text-[11px] text-[#6B6A64]">
            Itens produzidos no atelier Glos
          </div>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card padding="md" className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Busca textual */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#9B998F] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por razão social, nome fantasia, CNPJ, cidade ou contato..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] placeholder:text-[#9B998F] focus:outline-none focus:border-[#004AAD]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B998F] hover:text-[#272727]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtro de Status */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
            <Filter className="w-3.5 h-3.5 text-[#6B6A64]" />
            <button
              onClick={() => setStatusFilter("todos")}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                statusFilter === "todos"
                  ? "bg-[#004AAD] text-white"
                  : "bg-[#EEEDE8] text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Todos ({suppliers.length})
            </button>
            <button
              onClick={() => setStatusFilter("ativos")}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                statusFilter === "ativos"
                  ? "bg-[#004AAD] text-white"
                  : "bg-[#EEEDE8] text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Ativos ({suppliers.filter((s) => s.ativo).length})
            </button>
            <button
              onClick={() => setStatusFilter("inativos")}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                statusFilter === "inativos"
                  ? "bg-[#004AAD] text-white"
                  : "bg-[#EEEDE8] text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Inativos ({suppliers.filter((s) => !s.ativo).length})
            </button>
          </div>
        </div>
      </Card>

      {/* Tabela de Fornecedores */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-[#6B6A64] text-xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#004AAD]" />
            <p>Carregando fornecedores do Firestore...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto px-4 space-y-3">
            <div className="w-10 h-10 rounded-[6px] bg-[#EEEDE8] text-[#004AAD] flex items-center justify-center mx-auto">
              <Truck className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-medium text-[#272727]">
              {searchTerm || statusFilter !== "todos"
                ? "Nenhum fornecedor encontrado para este filtro"
                : "Nenhum fornecedor cadastrado ainda"}
            </h4>
            <p className="text-xs text-[#6B6A64] leading-relaxed">
              {searchTerm || statusFilter !== "todos"
                ? "Tente ajustar sua busca ou limpar os filtros para ver outros registros."
                : "Cadastre seus fornecedores de canecas, caixas de madeira, papéis especiais e fitas para manter seu catálogo organizado."}
            </p>
            {searchTerm || statusFilter !== "todos" ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("todos");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs font-medium text-[#272727]"
              >
                Limpar filtros
              </button>
            ) : (
              <button
                onClick={handleOpenNew}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884]"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Fornecedor</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D6D3CC] bg-[#EEEDE8] text-[#6B6A64] font-medium">
                  <th className="py-3 px-4">Empresa / Fantasia</th>
                  <th className="py-3 px-4">CNPJ</th>
                  <th className="py-3 px-4">Contato / Vendedor</th>
                  <th className="py-3 px-4">Localização</th>
                  <th className="py-3 px-4 text-center">Produtos</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D3CC]">
                {filteredSuppliers.map((supplier) => {
                  const linkedCount = productCountBySupplier[supplier.id] || 0;
                  const isDefault = supplier.isDefaultFabricacaoPropria || supplier.id === DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.id;
                  const waUrl = getWhatsAppUrl(supplier.contatoWhatsapp || supplier.telefone, supplier.contatoNome);

                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-[#EEEDE8]/50 transition-colors"
                    >
                      {/* Empresa */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#272727]">
                              {supplier.nomeFantasia || supplier.razaoSocial}
                            </span>
                            {isDefault && (
                              <span className="px-1.5 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[10px] text-[#004AAD] font-medium">
                                Padrão Glos
                              </span>
                            )}
                          </div>
                          {supplier.razaoSocial && supplier.razaoSocial !== supplier.nomeFantasia && (
                            <p className="text-[11px] text-[#6B6A64] truncate max-w-xs">
                              {supplier.razaoSocial}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* CNPJ */}
                      <td className="py-3 px-4 font-mono text-[11px] text-[#272727] tabular-nums">
                        {formatCnpjDisplay(supplier.cnpj)}
                      </td>

                      {/* Contato Comercial & WhatsApp */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#272727]">
                              {supplier.contatoNome || "Comercial"}
                            </span>
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center text-[#0F7A4F] hover:underline"
                                title="Abrir conversa no WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B6A64]">
                            {supplier.contatoWhatsapp
                              ? formatPhoneDisplay(supplier.contatoWhatsapp)
                              : supplier.contatoEmail || supplier.email || "—"}
                          </div>
                        </div>
                      </td>

                      {/* Cidade / UF */}
                      <td className="py-3 px-4 text-[#6B6A64]">
                        {supplier.municipio ? (
                          <span>
                            {supplier.municipio}
                            {supplier.uf ? ` - ${supplier.uf}` : ""}
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* Nº de Produtos Vinculados */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs font-medium text-[#272727] tabular-nums">
                          {linkedCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {supplier.ativo ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#0F7A4F]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0F7A4F]" />
                            Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#9B2C2C]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#9B2C2C]" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(supplier)}
                            className="p-1.5 rounded-[4px] text-[#6B6A64] hover:text-[#004AAD] hover:bg-[#EEEDE8] transition-colors"
                            title="Editar fornecedor"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isDefault && (
                            <button
                              onClick={() => setSupplierToDelete(supplier)}
                              className="p-1.5 rounded-[4px] text-[#6B6A64] hover:text-[#9B2C2C] hover:bg-[#EEEDE8] transition-colors"
                              title="Excluir fornecedor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* MODAL / DRAWER: CADASTRO / EDIÇÃO DE FORNECEDOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Topo do Modal */}
            <div className="px-5 py-4 border-b border-[#D6D3CC] flex items-center justify-between shrink-0 bg-[#EEEDE8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[6px] bg-[#E4E2DD] text-[#004AAD] flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#272727]">
                    {editingSupplier ? "Editar Fornecedor" : "Cadastrar Novo Fornecedor"}
                  </h3>
                  <p className="text-[11px] text-[#6B6A64]">
                    Busca automática por CNPJ com suporte a preenchimento manual
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-[4px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#E4E2DD]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo do Formulário */}
            <form onSubmit={handleSaveSupplier} className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* SEÇÃO 1: CNPJ COM BUSCA AUTOMÁTICA */}
              <div className="p-4 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-[#272727]">
                    1. CNPJ da Empresa (Busca Automática na Receita)
                  </label>
                  <span className="text-[10px] text-[#6B6A64]">
                    BrasilAPI & ReceitaWS
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formCnpj}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormCnpj(val);
                      const digits = val.replace(/\D/g, "");
                      if (digits.length === 14 && !isSearchingCnpj && !editingSupplier) {
                        handleCnpjLookup(digits);
                      }
                    }}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className="flex-1 px-3 py-2 text-xs rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] font-mono text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                  <button
                    type="button"
                    onClick={() => handleCnpjLookup()}
                    disabled={isSearchingCnpj}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] disabled:opacity-50 transition-colors shrink-0"
                  >
                    {isSearchingCnpj ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        <span>Consultar CNPJ</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Feedback de sucesso ou aviso de fallback manual */}
                {cnpjSuccessMessage && (
                  <div className="flex items-center gap-2 p-2.5 rounded-[4px] bg-[rgba(15,122,79,0.08)] border border-[rgba(15,122,79,0.2)] text-[11px] text-[#0F7A4F]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{cnpjSuccessMessage}</span>
                  </div>
                )}

                {cnpjError && (
                  <div className="flex items-start gap-2 p-2.5 rounded-[4px] bg-[rgba(155,44,44,0.06)] border border-[rgba(155,44,44,0.2)] text-[11px] text-[#9B2C2C]">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span>{cnpjError}</span>
                      <p className="text-[10px] text-[#6B6A64]">
                        Você pode preencher os campos abaixo manualmente sem problemas.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: DADOS CADASTRAIS DA EMPRESA */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-[#272727] pb-1 border-b border-[#D6D3CC]">
                  2. Dados da Empresa
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={formRazaoSocial}
                      onChange={(e) => setFormRazaoSocial(e.target.value)}
                      placeholder="Ex: Cerâmica & Decorações Arte Ltda"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={formNomeFantasia}
                      onChange={(e) => setFormNomeFantasia(e.target.value)}
                      placeholder="Ex: Arte Cerâmicas"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Situação Cadastral
                    </label>
                    <input
                      type="text"
                      value={formSituacaoCadastral}
                      onChange={(e) => setFormSituacaoCadastral(e.target.value)}
                      placeholder="ATIVA"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Telefone da Empresa
                    </label>
                    <input
                      type="text"
                      value={formTelefone}
                      onChange={(e) => setFormTelefone(e.target.value)}
                      placeholder="(11) 3322-1100"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="contato@empresa.com.br"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Logradouro / Rua
                    </label>
                    <input
                      type="text"
                      value={formLogradouro}
                      onChange={(e) => setFormLogradouro(e.target.value)}
                      placeholder="Rua das Indústrias"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Número
                    </label>
                    <input
                      type="text"
                      value={formNumero}
                      onChange={(e) => setFormNumero(e.target.value)}
                      placeholder="120"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Complemento
                    </label>
                    <input
                      type="text"
                      value={formComplemento}
                      onChange={(e) => setFormComplemento(e.target.value)}
                      placeholder="Galpão 3"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={formBairro}
                      onChange={(e) => setFormBairro(e.target.value)}
                      placeholder="Distrito Industrial"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Município / Cidade
                    </label>
                    <input
                      type="text"
                      value={formMunicipio}
                      onChange={(e) => setFormMunicipio(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      UF (Estado)
                    </label>
                    <select
                      value={formUf}
                      onChange={(e) => setFormUf(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    >
                      {[
                        "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
                        "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
                        "RS", "RO", "RR", "SC", "SP", "SE", "TO",
                      ].map((uf) => (
                        <option key={uf} value={uf}>
                          {uf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SEÇÃO 3: CONTATO COMERCIAL & CONDIÇÕES */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-[#272727] pb-1 border-b border-[#D6D3CC]">
                  3. Contato Comercial & Negociação
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Nome do Vendedor / Representante
                    </label>
                    <input
                      type="text"
                      value={formContatoNome}
                      onChange={(e) => setFormContatoNome(e.target.value)}
                      placeholder="Ex: Carlos Oliveira"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      WhatsApp Comercial
                    </label>
                    <input
                      type="text"
                      value={formContatoWhatsapp}
                      onChange={(e) => setFormContatoWhatsapp(e.target.value)}
                      placeholder="(11) 99887-6655"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      E-mail Comercial
                    </label>
                    <input
                      type="email"
                      value={formContatoEmail}
                      onChange={(e) => setFormContatoEmail(e.target.value)}
                      placeholder="vendas@fornecedor.com.br"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Prazo Médio de Entrega (dias úteis)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formPrazoEntregaDias}
                      onChange={(e) =>
                        setFormPrazoEntregaDias(
                          e.target.value === "" ? "" : Math.max(0, parseInt(e.target.value) || 0)
                        )
                      }
                      placeholder="Ex: 5"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] font-medium tabular-nums focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#6B6A64] mb-1">
                      Condições de Pagamento Usuais
                    </label>
                    <input
                      type="text"
                      value={formCondicoesPagamento}
                      onChange={(e) => setFormCondicoesPagamento(e.target.value)}
                      placeholder="Ex: 28 DDL Boleto / 5% desc. Pix"
                      className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-[#6B6A64] mb-1">
                    Observações Internas (Pedido mínimo, Chave Pix, restrições)
                  </label>
                  <textarea
                    rows={2}
                    value={formObservacoes}
                    onChange={(e) => setFormObservacoes(e.target.value)}
                    placeholder="Ex: Pedido mínimo de 20 unidades. Envia por transportadora com frete CIF acima de R$ 800."
                    className="w-full px-2.5 py-1.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAtivo}
                      onChange={(e) => setFormAtivo(e.target.checked)}
                      className="rounded text-[#004AAD] focus:ring-0"
                    />
                    <span className="text-xs font-medium text-[#272727]">
                      Fornecedor Ativo (disponível para vincular a novos produtos)
                    </span>
                  </label>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-4 border-t border-[#D6D3CC] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs font-medium text-[#6B6A64] hover:text-[#272727]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? "Gravando no Firestore..." : "Salvar Fornecedor"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs select-none">
          <div className="w-full max-w-md bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#9B2C2C]">
              <div className="w-10 h-10 rounded-[6px] bg-[rgba(155,44,44,0.08)] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#272727]">
                  Excluir Fornecedor
                </h3>
                <p className="text-xs text-[#6B6A64]">
                  {supplierToDelete.nomeFantasia || supplierToDelete.razaoSocial}
                </p>
              </div>
            </div>

            <p className="text-xs text-[#6B6A64] leading-relaxed">
              Tem certeza que deseja remover este fornecedor? Se houver produtos vinculados, eles permanecerão no catálogo mas ficarão sem este parceiro associado.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#D6D3CC]">
              <button
                type="button"
                onClick={() => setSupplierToDelete(null)}
                className="px-4 py-2 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs font-medium text-[#6B6A64] hover:text-[#272727]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-[6px] bg-[#9B2C2C] text-white text-xs font-medium hover:bg-[#7d2424] disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
