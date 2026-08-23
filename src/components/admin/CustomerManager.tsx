import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Search,
  MessageSquare,
  ExternalLink,
  MapPin,
  ShoppingBag,
  X,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Phone,
  Mail,
  User,
  CreditCard,
  Clock,
} from "lucide-react";
import { Order, UserProfile, Address, CustomerRecord } from "../../types";
import { fetchAllCustomersAdmin } from "../../lib/firebase";

interface CustomerManagerProps {
  orders: Order[];
  onViewOrder?: (order: Order) => void;
  onNavigateToOrders?: () => void;
}

/**
 * Formata data no padrão Glos: DD mmm, AA (ex: 14 out, 25)
 */
function formatDateGlos(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const months = [
      "jan",
      "fev",
      "mar",
      "abr",
      "mai",
      "jun",
      "jul",
      "ago",
      "set",
      "out",
      "nov",
      "dez",
    ];
    const month = months[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);
    return `${day} ${month}, ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formatação de moeda BRL com tabular-nums
 */
function formatCurrency(val: number): string {
  return (val || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formata telefone brasileiro para exibição
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
 * Gera URL de WhatsApp com mensagem inicial amigável e afetiva
 */
function getWhatsAppUrl(phone?: string, customerName?: string): string | null {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return null;
  if (!cleaned.startsWith("55") && (cleaned.length === 10 || cleaned.length === 11)) {
    cleaned = `55${cleaned}`;
  }
  const firstName = customerName ? customerName.trim().split(" ")[0] : "cliente";
  const message = encodeURIComponent(
    `Olá ${firstName}, tudo bem? Aqui é a Cris da Glos Presentes.`
  );
  return `https://wa.me/${cleaned}?text=${message}`;
}

/**
 * Tradução simples e limpa de status do pedido para o lojista
 */
function translateOrderStatus(order: Order): { label: string; textClass: string } {
  const status = order.status;
  const statusPedido = order.statusPedido;
  const aprovacao = order.aprovacaoMockup;

  if (status === "CANCELADO" || statusPedido === "cancelado") {
    return { label: "Cancelado", textClass: "text-[#9B2C2C]" };
  }
  if (status === "ENTREGUE" || statusPedido === "entregue") {
    return { label: "Entregue", textClass: "text-[#0F7A4F]" };
  }
  if (status === "ENVIADO" || statusPedido === "despachado") {
    return { label: "Enviado", textClass: "text-[#004AAD]" };
  }
  if (statusPedido === "em_producao") {
    return { label: "Em produção", textClass: "text-[#272727]" };
  }
  if (aprovacao === "aguardando_aprovacao") {
    return { label: "Aguardando aprovação de arte", textClass: "text-[#004AAD]" };
  }
  if (aprovacao === "ajuste_solicitado") {
    return { label: "Ajuste de arte solicitado", textClass: "text-[#9B2C2C]" };
  }
  if (statusPedido === "aguardando_arquivo") {
    return { label: "Aguardando foto/arquivo", textClass: "text-[#6B6A64]" };
  }
  if (
    status === "PAGAMENTO_CONFIRMADO" ||
    order.statusPagamento === "pago" ||
    order.statusPagamento === "aprovado"
  ) {
    return { label: "Pago", textClass: "text-[#0F7A4F]" };
  }
  if (status === "PEDIDO_REALIZADO" || order.statusPagamento === "aguardando_pagamento") {
    return { label: "Aguardando pagamento", textClass: "text-[#6B6A64]" };
  }
  return { label: status || "Registrado", textClass: "text-[#272727]" };
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  orders,
  onViewOrder,
  onNavigateToOrders,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "spent" | "orders">("recent");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const [firestoreUsers, setFirestoreUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Carrega clientes do Firestore
  const loadCustomers = async () => {
    try {
      const users = await fetchAllCustomersAdmin();
      setFirestoreUsers(users);
    } catch (err) {
      console.warn("Erro ao carregar clientes do Firestore:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCustomers();
  };

  // Cruza clientes do Firestore com todos os pedidos reais
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerRecord>();

    // 1. Cadastra usuários do Firestore (coleção clientes / users)
    firestoreUsers.forEach((u) => {
      const emailKey = u.email ? u.email.toLowerCase().trim() : u.id;
      const key = u.id || emailKey;

      customerMap.set(key, {
        id: u.id,
        name: u.name || "Cliente Glos",
        email: u.email || "",
        phone: u.phone || "",
        cpf: u.cpf || "",
        createdAt: u.createdAt || new Date().toISOString(),
        addresses: Array.isArray(u.addresses) ? [...u.addresses] : [],
        totalOrders: 0,
        totalSpent: 0,
        orders: [],
      });
    });

    // 2. Cruza com os pedidos existentes
    orders.forEach((ord) => {
      const orderEmail = (ord.customer?.email || "").toLowerCase().trim();
      const orderClienteId = ord.clienteId || "";
      const orderPhone = ord.customer?.phone || ord.shippingAddress?.phone || "";
      const orderName = ord.customer?.name || ord.shippingAddress?.recipientName || "Cliente Glos";
      const orderCpf = ord.customer?.cpf || "";

      // Tenta encontrar o cliente por clienteId ou por email
      let matchedRecord: CustomerRecord | undefined;

      if (orderClienteId && customerMap.has(orderClienteId)) {
        matchedRecord = customerMap.get(orderClienteId);
      } else if (orderEmail) {
        for (const rec of customerMap.values()) {
          if (rec.email && rec.email.toLowerCase().trim() === orderEmail) {
            matchedRecord = rec;
            break;
          }
        }
      }

      // Se não encontrou no cadastro prévio, cria o registro derivado do pedido
      if (!matchedRecord) {
        const key = orderClienteId || orderEmail || `ord-cust-${ord.id}`;
        matchedRecord = {
          id: key,
          name: orderName,
          email: orderEmail,
          phone: orderPhone,
          cpf: orderCpf,
          createdAt: ord.createdAt || new Date().toISOString(),
          addresses: [],
          totalOrders: 0,
          totalSpent: 0,
          orders: [],
        };
        customerMap.set(key, matchedRecord);
      }

      // Atualiza dados de contato se estiverem vazios
      if (!matchedRecord.name && orderName) matchedRecord.name = orderName;
      if (!matchedRecord.phone && orderPhone) matchedRecord.phone = orderPhone;
      if (!matchedRecord.cpf && orderCpf) matchedRecord.cpf = orderCpf;

      // Adiciona endereço de entrega se ainda não estiver na lista
      if (ord.shippingAddress && ord.shippingAddress.street) {
        const exists = matchedRecord.addresses.some(
          (a) =>
            a.street === ord.shippingAddress.street &&
            a.number === ord.shippingAddress.number &&
            a.zipCode === ord.shippingAddress.zipCode
        );
        if (!exists) {
          matchedRecord.addresses.push(ord.shippingAddress);
        }
      }

      // Se a data do pedido for anterior à data de criação registrada, ajusta a data de cadastro
      if (ord.createdAt) {
        const ordTime = new Date(ord.createdAt).getTime();
        const curTime = new Date(matchedRecord.createdAt).getTime();
        if (!isNaN(ordTime) && (isNaN(curTime) || ordTime < curTime)) {
          matchedRecord.createdAt = ord.createdAt;
        }
      }

      // Adiciona pedido e métricas
      matchedRecord.totalOrders += 1;
      matchedRecord.totalSpent += ord.total || 0;
      matchedRecord.orders.push(ord);

      // Data do último pedido
      if (
        !matchedRecord.lastOrderDate ||
        new Date(ord.createdAt).getTime() > new Date(matchedRecord.lastOrderDate).getTime()
      ) {
        matchedRecord.lastOrderDate = ord.createdAt;
      }
    });

    // Ordena os pedidos de cada cliente do mais recente para o mais antigo
    const result = Array.from(customerMap.values());
    result.forEach((c) => {
      c.orders.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    });

    return result;
  }, [firestoreUsers, orders]);

  // Filtro de busca e ordenação
  const filteredCustomers = useMemo(() => {
    let list = customers.filter((cust) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const matchName = cust.name.toLowerCase().includes(term);
      const matchEmail = cust.email.toLowerCase().includes(term);
      const matchPhone = cust.phone.replace(/\D/g, "").includes(term.replace(/\D/g, ""));
      const matchCpf = cust.cpf ? cust.cpf.replace(/\D/g, "").includes(term.replace(/\D/g, "")) : false;
      return matchName || matchEmail || matchPhone || matchCpf;
    });

    // Aplica ordenação
    if (sortBy === "recent") {
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.lastOrderDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.lastOrderDate || 0).getTime();
        return timeB - timeA;
      });
    } else if (sortBy === "spent") {
      list.sort((a, b) => b.totalSpent - a.totalSpent);
    } else if (sortBy === "orders") {
      list.sort((a, b) => b.totalOrders - a.totalOrders);
    }

    return list;
  }, [customers, searchTerm, sortBy]);

  // Métricas do Topo
  const metrics = useMemo(() => {
    const totalClientes = customers.length;

    // Novos nos últimos 30 dias
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const novos30d = customers.filter((c) => {
      const created = new Date(c.createdAt).getTime();
      return !isNaN(created) && created >= thirtyDaysAgo;
    }).length;

    // Ticket médio geral
    const totalReceita = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalPedidosGeral = customers.reduce((sum, c) => sum + c.totalOrders, 0);
    const ticketMedioGeral = totalPedidosGeral > 0 ? totalReceita / totalPedidosGeral : 0;

    return {
      totalClientes,
      novos30d,
      ticketMedioGeral,
    };
  }, [customers]);

  return (
    <div className="space-y-4 font-normal text-[#272727]">
      {/* ========================================================================= */}
      {/* 1. CARTÕES RESUMO NO TOPO (MÉTRICAS SIMPLES COM TABULAR-NUMS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total de Clientes */}
        <div className="p-4 rounded-[8px] bg-[#F4F3EF] border border-[#D6D3CC] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B6A64]">
            <span className="text-xs font-medium">Total de clientes</span>
            <Users className="w-4 h-4 text-[#004AAD]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-medium text-[#272727] tabular-nums tracking-tight">
              {metrics.totalClientes}
            </span>
            <span className="text-[11px] text-[#9B998F] block mt-0.5">
              Cadastrados no login ou checkout
            </span>
          </div>
        </div>

        {/* Novos no período (30 dias) */}
        <div className="p-4 rounded-[8px] bg-[#F4F3EF] border border-[#D6D3CC] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B6A64]">
            <span className="text-xs font-medium">Novos (últimos 30 dias)</span>
            <Clock className="w-4 h-4 text-[#004AAD]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-medium text-[#272727] tabular-nums tracking-tight">
              {metrics.novos30d}
            </span>
            <span className="text-[11px] text-[#9B998F] block mt-0.5">
              Cadastros ou primeiros pedidos recentes
            </span>
          </div>
        </div>

        {/* Ticket Médio Geral */}
        <div className="p-4 rounded-[8px] bg-[#F4F3EF] border border-[#D6D3CC] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B6A64]">
            <span className="text-xs font-medium">Ticket médio geral</span>
            <CreditCard className="w-4 h-4 text-[#004AAD]" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-medium text-[#272727] tabular-nums tracking-tight">
              {formatCurrency(metrics.ticketMedioGeral)}
            </span>
            <span className="text-[11px] text-[#9B998F] block mt-0.5">
              Média por pedido realizado
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE BUSCA E ORDENAÇÃO */}
      {/* ========================================================================= */}
      <div className="p-3.5 rounded-[8px] bg-[#F4F3EF] border border-[#D6D3CC] flex flex-wrap items-center justify-between gap-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#9B998F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD] focus:bg-[#F4F3EF] transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9B998F] hover:text-[#272727]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Seletor de Ordenação */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#6B6A64] font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#9B998F]" />
            Ordenar por:
          </span>

          <div className="inline-flex rounded-[6px] border border-[#D6D3CC] bg-[#EEEDE8] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSortBy("recent")}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                sortBy === "recent"
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Mais recentes
            </button>
            <button
              type="button"
              onClick={() => setSortBy("spent")}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                sortBy === "spent"
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Total gasto
            </button>
            <button
              type="button"
              onClick={() => setSortBy("orders")}
              className={`px-2.5 py-1 rounded-[4px] font-medium transition-colors cursor-pointer ${
                sortBy === "orders"
                  ? "bg-[#004AAD] text-white"
                  : "text-[#6B6A64] hover:text-[#272727]"
              }`}
            >
              Nº de pedidos
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded-[6px] border border-[#D6D3CC] bg-[#EEEDE8] text-[#6B6A64] hover:text-[#272727] hover:bg-[#F4F3EF] transition-colors cursor-pointer"
            title="Atualizar lista de clientes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#004AAD]" : ""}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TABELA / LISTA DE CLIENTES */}
      {/* ========================================================================= */}
      <div className="rounded-[8px] bg-[#F4F3EF] border border-[#D6D3CC] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#6B6A64]">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-[#004AAD]" />
            <p className="text-xs">Carregando clientes do Firestore...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          /* Estado Vazio Honesto */
          <div className="p-12 text-center">
            <Users className="w-8 h-8 mx-auto mb-3 text-[#9B998F]" />
            {searchTerm ? (
              <>
                <p className="text-sm font-medium text-[#272727]">
                  Nenhum cliente encontrado para "{searchTerm}"
                </p>
                <p className="text-xs text-[#6B6A64] mt-1">
                  Tente buscar por outro termo, nome, e-mail ou WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="mt-3 text-xs text-[#004AAD] hover:underline cursor-pointer"
                >
                  Limpar busca
                </button>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-[#272727]">
                  Nenhum cliente cadastrado ainda
                </p>
                <p className="text-xs text-[#6B6A64] mt-1 max-w-md mx-auto">
                  Assim que um cliente criar uma conta no site ou realizar uma compra no checkout, ele aparecerá aqui com seus dados de contato, endereços e histórico de pedidos.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EEEDE8] border-b border-[#D6D3CC] text-[11px] font-medium text-[#6B6A64] uppercase tracking-wider">
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">WhatsApp / Telefone</th>
                  <th className="py-3 px-4">Cadastro</th>
                  <th className="py-3 px-4 text-center">Pedidos</th>
                  <th className="py-3 px-4 text-right">Total Gasto</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D3CC]/60 text-xs">
                {filteredCustomers.map((cust) => {
                  const waUrl = getWhatsAppUrl(cust.phone, cust.name);

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className="hover:bg-[#EEEDE8]/80 transition-colors cursor-pointer"
                    >
                      {/* Cliente (Nome + E-mail) */}
                      <td className="py-3 px-4">
                        <div className="min-w-0">
                          <span className="font-medium text-[#272727] block truncate">
                            {cust.name}
                          </span>
                          <span className="text-[11px] text-[#6B6A64] block truncate">
                            {cust.email || "Sem e-mail informado"}
                          </span>
                        </div>
                      </td>

                      {/* WhatsApp / Telefone */}
                      <td className="py-3 px-4">
                        {cust.phone ? (
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums text-[#272727]">
                              {formatPhoneDisplay(cust.phone)}
                            </span>
                            {waUrl && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded bg-[#EEEDE8] border border-[#D6D3CC] text-[#004AAD] hover:bg-[#F4F3EF] transition-colors"
                                title="Conversar no WhatsApp"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#9B998F]">—</span>
                        )}
                      </td>

                      {/* Data de Cadastro */}
                      <td className="py-3 px-4 text-[#6B6A64] tabular-nums">
                        {formatDateGlos(cust.createdAt)}
                      </td>

                      {/* Nº de Pedidos */}
                      <td className="py-3 px-4 text-center">
                        <span className="tabular-nums font-medium text-[#272727] px-2 py-0.5 rounded bg-[#EEEDE8] border border-[#D6D3CC]">
                          {cust.totalOrders}
                        </span>
                      </td>

                      {/* Total Gasto (R$) */}
                      <td className="py-3 px-4 text-right font-medium text-[#272727] tabular-nums">
                        {formatCurrency(cust.totalSpent)}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCustomer(cust);
                          }}
                          className="px-2.5 py-1 rounded-[6px] text-xs font-medium bg-[#EEEDE8] border border-[#D6D3CC] text-[#004AAD] hover:bg-[#F4F3EF] transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <span>Ver cliente</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Contador de Rodapé */}
            <div className="py-2.5 px-4 bg-[#EEEDE8] border-t border-[#D6D3CC] flex items-center justify-between text-[11px] text-[#6B6A64]">
              <span>
                Exibindo <strong className="font-medium text-[#272727] tabular-nums">{filteredCustomers.length}</strong> de{" "}
                <span className="tabular-nums">{customers.length}</span> clientes
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-[#004AAD] hover:underline cursor-pointer"
                >
                  Limpar filtro
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. DETALHE DO CLIENTE (PAINEL MODAL FLAT NO SISTEMA GLOS) */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-[#272727]/40 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div
            className="bg-[#F4F3EF] rounded-[8px] border border-[#D6D3CC] max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Detalhe */}
            <div className="p-4 border-b border-[#D6D3CC] flex items-start justify-between bg-[#EEEDE8]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] flex items-center justify-center text-[#004AAD] font-medium text-sm">
                  {selectedCustomer.name
                    ? selectedCustomer.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "CL"}
                </div>
                <div>
                  <h3 className="text-base font-medium text-[#272727]">
                    {selectedCustomer.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#6B6A64] mt-0.5">
                    <span>{selectedCustomer.email || "Sem e-mail"}</span>
                    <span>•</span>
                    <span className="tabular-nums">
                      Cliente desde {formatDateGlos(selectedCustomer.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-[6px] hover:bg-[#F4F3EF] text-[#6B6A64] hover:text-[#272727] transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo do Detalhe */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* Botão de Contato WhatsApp (Atalho Direto para a Cris) */}
              {selectedCustomer.phone && getWhatsAppUrl(selectedCustomer.phone, selectedCustomer.name) && (
                <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-[#004AAD] shrink-0" />
                    <div>
                      <span className="text-xs font-medium text-[#272727] block">
                        Conversa direta no WhatsApp
                      </span>
                      <span className="text-[11px] text-[#6B6A64] block tabular-nums">
                        {formatPhoneDisplay(selectedCustomer.phone)}
                      </span>
                    </div>
                  </div>

                  <a
                    href={getWhatsAppUrl(selectedCustomer.phone, selectedCustomer.name)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003882] transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Conversar no WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Métricas do Cliente */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]">
                  <span className="text-[10px] text-[#6B6A64] block">Total de pedidos</span>
                  <span className="text-base font-medium text-[#272727] tabular-nums mt-0.5 block">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]">
                  <span className="text-[10px] text-[#6B6A64] block">Total gasto (LTV)</span>
                  <span className="text-base font-medium text-[#272727] tabular-nums mt-0.5 block">
                    {formatCurrency(selectedCustomer.totalSpent)}
                  </span>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]">
                  <span className="text-[10px] text-[#6B6A64] block">Ticket médio</span>
                  <span className="text-base font-medium text-[#272727] tabular-nums mt-0.5 block">
                    {selectedCustomer.totalOrders > 0
                      ? formatCurrency(selectedCustomer.totalSpent / selectedCustomer.totalOrders)
                      : "R$ 0,00"}
                  </span>
                </div>

                <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]">
                  <span className="text-[10px] text-[#6B6A64] block">Última compra</span>
                  <span className="text-xs font-medium text-[#272727] tabular-nums mt-1 block truncate">
                    {selectedCustomer.lastOrderDate
                      ? formatDateGlos(selectedCustomer.lastOrderDate)
                      : "Sem compras"}
                  </span>
                </div>
              </div>

              {/* Dados de Contato & CPF */}
              <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-2">
                <span className="text-xs font-medium text-[#272727] block">
                  Informações de Contato
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#6B6A64] block">E-mail</span>
                    <span className="text-[#272727] break-all">
                      {selectedCustomer.email || "Não informado"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6A64] block">Telefone</span>
                    <span className="text-[#272727] tabular-nums">
                      {formatPhoneDisplay(selectedCustomer.phone)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#6B6A64] block">CPF</span>
                    <span className="text-[#272727] tabular-nums">
                      {selectedCustomer.cpf || "Não informado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Endereço(s) Usados */}
              <div className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-2">
                <span className="text-xs font-medium text-[#272727] block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#004AAD]" />
                  <span>Endereço(s) de Entrega</span>
                </span>

                {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedCustomer.addresses.map((addr, idx) => (
                      <div
                        key={addr.id || `addr-${idx}`}
                        className="p-2 rounded bg-[#F4F3EF] border border-[#D6D3CC] text-xs text-[#272727]"
                      >
                        <p>
                          {addr.street}, {addr.number}
                          {addr.complement ? ` - ${addr.complement}` : ""}
                        </p>
                        <p className="text-[11px] text-[#6B6A64] mt-0.5">
                          {addr.neighborhood} • {addr.city}/{addr.state} • CEP{" "}
                          <span className="tabular-nums">{addr.zipCode}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#9B998F] italic">
                    Nenhum endereço registrado até o momento.
                  </p>
                )}
              </div>

              {/* Histórico de Pedidos do Cliente */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-[#004AAD]" />
                    <span>Histórico de Pedidos ({selectedCustomer.orders.length})</span>
                  </span>
                </div>

                {selectedCustomer.orders.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedCustomer.orders.map((ord) => {
                      const statusInfo = translateOrderStatus(ord);
                      const orderNum = ord.orderNumber || ord.id;

                      return (
                        <div
                          key={ord.id}
                          className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-[#272727] tabular-nums">
                                #{orderNum}
                              </span>
                              <span
                                className={`text-[11px] px-1.5 py-0.2 rounded bg-[#F4F3EF] border border-[#D6D3CC] ${statusInfo.textClass}`}
                              >
                                {statusInfo.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#6B6A64] mt-1">
                              <span className="tabular-nums">
                                {formatDateGlos(ord.createdAt)}
                              </span>
                              <span>•</span>
                              <span>
                                {ord.items?.length || 0}{" "}
                                {ord.items?.length === 1 ? "item" : "itens"}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-medium text-[#272727] tabular-nums block">
                              {formatCurrency(ord.total)}
                            </span>

                            {onViewOrder && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(null);
                                  onViewOrder(ord);
                                }}
                                className="text-[11px] text-[#004AAD] hover:underline font-medium mt-0.5 block cursor-pointer"
                              >
                                Ver pedido &rarr;
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#9B998F] italic p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC]">
                    Este cliente ainda não possui pedidos concluídos.
                  </p>
                )}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3 border-t border-[#D6D3CC] bg-[#EEEDE8] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#272727] hover:bg-[#EEEDE8] transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
