import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  ShoppingBag,
  ExternalLink,
  DollarSign,
  Calendar,
  ChevronRight,
  X,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { Order } from "../../types";

interface CustomerManagerProps {
  orders: Order[];
  onViewOrder?: (order: Order) => void;
  onNavigateToOrders?: () => void;
}

interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  city: string;
  state: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderStatus: string;
  orders: Order[];
}

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  orders,
  onViewOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<"ALL" | "RECURRENT" | "VIP" | "NEW">("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Group and aggregate customers from orders
  const customers = useMemo(() => {
    const map = new Map<string, CustomerRecord>();

    // Baseline sample customers if orders list is small
    const sampleSeed = orders.length > 0 ? orders : [
      {
        id: "PED-101",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        status: "PAGAMENTO_CONFIRMADO",
        statusHistory: [],
        items: [],
        subtotal: 5089.9,
        shippingPrice: 0,
        discount: 0,
        total: 5089.9,
        shippingOption: { id: "sedex", name: "Sedex", deadline: "2 dias", price: 0, originalPrice: 0 },
        shippingAddress: {
          id: "addr-1",
          recipientName: "Mariana Souza",
          zipCode: "01310-100",
          street: "Av. Paulista",
          number: "1000",
          neighborhood: "Bela Vista",
          city: "São Paulo",
          state: "SP",
          phone: "11998765432",
        },
        paymentMethod: "pix" as const,
        customer: {
          name: "Mariana Souza",
          email: "mariana.souza@gmail.com",
          cpf: "123.456.789-00",
          phone: "11998765432",
        },
      },
      {
        id: "PED-102",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        status: "ENVIADO",
        statusHistory: [],
        items: [],
        subtotal: 349.9,
        shippingPrice: 18.9,
        discount: 0,
        total: 368.8,
        shippingOption: { id: "pac", name: "PAC", deadline: "5 dias", price: 18.9, originalPrice: 18.9 },
        shippingAddress: {
          id: "addr-2",
          recipientName: "Carlos Eduardo Silva",
          zipCode: "22041-001",
          street: "Av. Atlântica",
          number: "500",
          neighborhood: "Copacabana",
          city: "Rio de Janeiro",
          state: "RJ",
          phone: "21988887777",
        },
        paymentMethod: "credit_card" as const,
        customer: {
          name: "Carlos Eduardo Silva",
          email: "carlos.eduardo@outlook.com",
          cpf: "234.567.890-11",
          phone: "21988887777",
        },
      },
      {
        id: "PED-103",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
        status: "ENTREGUE",
        statusHistory: [],
        items: [],
        subtotal: 219.0,
        shippingPrice: 15.0,
        discount: 0,
        total: 234.0,
        shippingOption: { id: "pac", name: "PAC", deadline: "4 dias", price: 15.0, originalPrice: 15.0 },
        shippingAddress: {
          id: "addr-3",
          recipientName: "Fernanda Costa",
          zipCode: "30130-110",
          street: "Rua da Bahia",
          number: "1200",
          neighborhood: "Centro",
          city: "Belo Horizonte",
          state: "MG",
          phone: "31977776666",
        },
        paymentMethod: "pix" as const,
        customer: {
          name: "Fernanda Costa",
          email: "fernanda.costa@gmail.com",
          cpf: "345.678.901-22",
          phone: "31977776666",
        },
      },
    ];

    sampleSeed.forEach((ord) => {
      const email = ord.customer?.email || ord.shippingAddress?.recipientName || "cliente@loja.com";
      const key = email.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: ord.customer?.name || ord.shippingAddress?.recipientName || "Cliente",
          email: ord.customer?.email || "Não informado",
          phone: ord.customer?.phone || ord.shippingAddress?.phone || "",
          cpf: ord.customer?.cpf || "Não informado",
          city: ord.shippingAddress?.city || "São Paulo",
          state: ord.shippingAddress?.state || "SP",
          totalOrders: 0,
          totalSpent: 0,
          lastOrderDate: ord.createdAt,
          lastOrderStatus: ord.status,
          orders: [],
        });
      }

      const rec = map.get(key)!;
      rec.totalOrders += 1;
      rec.totalSpent += ord.total || 0;
      rec.orders.push(ord);

      if (new Date(ord.createdAt) > new Date(rec.lastOrderDate)) {
        rec.lastOrderDate = ord.createdAt;
        rec.lastOrderStatus = ord.status;
      }
    });

    return Array.from(map.values());
  }, [orders]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchesSearch =
        cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.phone.includes(searchTerm);

      if (!matchesSearch) return false;

      if (segmentFilter === "RECURRENT") return cust.totalOrders > 1;
      if (segmentFilter === "VIP") return cust.totalSpent >= 500;
      if (segmentFilter === "NEW") return cust.totalOrders === 1;

      return true;
    });
  }, [customers, searchTerm, segmentFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = customers.length;
    const totalSpentAll = customers.reduce((s, c) => s + c.totalSpent, 0);
    const avgSpent = totalCount > 0 ? totalSpentAll / totalCount : 0;
    const recurrentCount = customers.filter((c) => c.totalOrders > 1).length;
    const recurrentRate = totalCount > 0 ? ((recurrentCount / totalCount) * 100).toFixed(0) : 0;

    return {
      totalCount,
      totalSpentAll,
      avgSpent,
      recurrentCount,
      recurrentRate,
    };
  }, [customers]);

  const handleExportCSV = () => {
    const headers = ["Nome", "E-mail", "Telefone", "Cidade", "UF", "Total Pedidos", "Total Gasto (R$)", "Último Pedido"];
    const rows = filteredCustomers.map((c) => [
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.city}"`,
      `"${c.state}"`,
      c.totalOrders,
      c.totalSpent.toFixed(2),
      `"${new Date(c.lastOrderDate).toLocaleDateString("pt-BR")}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clientes_loja_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* ========================================================================= */}
      {/* 1. TOP STATS CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-700">Total de Clientes</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-950">{metrics.totalCount}</div>
          <span className="text-[11px] text-stone-400 font-medium mt-1 block">
            Base ativa de compradores
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-700">LTV Médio</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-950">
            R$ {metrics.avgSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-stone-400 font-medium mt-1 block">
            Valor médio gerado por cliente
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-700">Taxa de Recompra</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-950">{metrics.recurrentRate}%</div>
          <span className="text-[11px] text-stone-400 font-medium mt-1 block">
            {metrics.recurrentCount} clientes com 2+ compras
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold text-stone-700">Faturamento Acumulado</span>
            <UserCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-stone-950">
            R$ {metrics.totalSpentAll.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-stone-400 font-medium mt-1 block">
            Receita total da carteira
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOOLBAR (SEARCH, FILTERS, EXPORT) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, e-mail, telefone ou cidade..."
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-stone-900 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setSegmentFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                segmentFilter === "ALL" ? "bg-white text-stone-950 shadow-xs" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Todos ({customers.length})
            </button>
            <button
              onClick={() => setSegmentFilter("RECURRENT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                segmentFilter === "RECURRENT" ? "bg-white text-stone-950 shadow-xs" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Recorrentes
            </button>
            <button
              onClick={() => setSegmentFilter("VIP")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                segmentFilter === "VIP" ? "bg-white text-stone-950 shadow-xs" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              VIP (R$ 500+)
            </button>
            <button
              onClick={() => setSegmentFilter("NEW")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                segmentFilter === "NEW" ? "bg-white text-stone-950 shadow-xs" : "text-stone-600 hover:text-stone-950"
              }`}
            >
              Novos
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CUSTOMER LIST TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                <th className="py-3.5 px-6">Cliente</th>
                <th className="py-3.5 px-4">Localização</th>
                <th className="py-3.5 px-4">Pedidos</th>
                <th className="py-3.5 px-4">Total Gasto (LTV)</th>
                <th className="py-3.5 px-4">Última Atividade</th>
                <th className="py-3.5 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs">
              {filteredCustomers.map((cust) => {
                const initials = cust.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const isVip = cust.totalSpent >= 500;

                return (
                  <tr
                    key={cust.id}
                    className="hover:bg-stone-50/70 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCustomer(cust)}
                  >
                    {/* Customer Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-950">{cust.name}</span>
                            {isVip && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[9px]">
                                VIP
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                            <span>{cust.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="py-4 px-4 text-stone-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{cust.city}, {cust.state}</span>
                      </div>
                    </td>

                    {/* Orders count */}
                    <td className="py-4 px-4 font-bold text-stone-950">
                      {cust.totalOrders} {cust.totalOrders === 1 ? "pedido" : "pedidos"}
                    </td>

                    {/* Total spent */}
                    <td className="py-4 px-4 font-extrabold text-stone-950">
                      R$ {cust.totalSpent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Last order date */}
                    <td className="py-4 px-4 text-stone-500 text-[11px]">
                      {new Date(cust.lastOrderDate).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {cust.phone && (
                          <a
                            href={`https://wa.me/55${cust.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-[11px] transition-colors"
                        >
                          Ver Perfil
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    <p className="font-bold text-stone-700 text-xs">Nenhum cliente encontrado</p>
                    <p className="text-[11px] text-stone-400">Tente ajustar a pesquisa ou o filtro.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. CUSTOMER PROFILE MODAL */}
      {/* ========================================================================= */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-6 animate-scale-up">
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-stone-950 text-white font-black text-base flex items-center justify-center">
                  {selectedCustomer.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-lg text-stone-950">{selectedCustomer.name}</h3>
                    {selectedCustomer.totalSpent >= 500 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">{selectedCustomer.email}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Total Pedidos</span>
                <span className="text-base font-extrabold text-stone-950">{selectedCustomer.totalOrders}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Total Gasto</span>
                <span className="text-base font-extrabold text-stone-950">
                  R$ {selectedCustomer.totalSpent.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Telefone</span>
                <span className="text-xs font-bold text-stone-800">{selectedCustomer.phone || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Cidade / UF</span>
                <span className="text-xs font-bold text-stone-800">
                  {selectedCustomer.city} / {selectedCustomer.state}
                </span>
              </div>
            </div>

            {/* Order History */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs text-stone-950 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                <span>Histórico de Pedidos ({selectedCustomer.orders.length})</span>
              </h4>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {selectedCustomer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200 flex items-center justify-between hover:border-stone-300 transition-all text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-950 flex items-center gap-2">
                        <span>#{ord.id}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {ord.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-stone-400 mt-0.5 block">
                        {new Date(ord.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-stone-950 text-sm">
                        R$ {ord.total?.toFixed(2)}
                      </span>
                      {onViewOrder && (
                        <button
                          onClick={() => {
                            setSelectedCustomer(null);
                            onViewOrder(ord);
                          }}
                          className="text-[11px] text-blue-600 font-bold block hover:underline mt-0.5"
                        >
                          Ver pedido &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-stone-100">
              {selectedCustomer.phone ? (
                <a
                  href={`https://wa.me/55${selectedCustomer.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chamar no WhatsApp</span>
                </a>
              ) : <div />}

              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
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
