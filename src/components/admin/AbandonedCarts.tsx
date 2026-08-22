import React, { useState } from "react";
import {
  ShoppingCart,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Search,
  ExternalLink,
  DollarSign,
  User,
  Send,
} from "lucide-react";
import { AbandonedCart } from "../../types";
import { Card } from "./Card";

interface AbandonedCartsProps {
  abandonedCarts: AbandonedCart[];
  onUpdateCart: (updatedCart: AbandonedCart) => void;
}

export const AbandonedCarts: React.FC<AbandonedCartsProps> = ({
  abandonedCarts,
  onUpdateCart,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecoveryCart, setSelectedRecoveryCart] = useState<AbandonedCart | null>(null);
  const [customDiscount, setCustomDiscount] = useState("VOLTA5");

  const totalValue = abandonedCarts.reduce((acc, c) => acc + c.total, 0);
  const notContactedCount = abandonedCarts.filter(
    (c) => c.recoveryStatus === "nao_contatado"
  ).length;
  const recoveredCount = abandonedCarts.filter(
    (c) => c.recoveryStatus === "recuperado"
  ).length;

  const filtered = abandonedCarts.filter((cart) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cart.customerName.toLowerCase().includes(q) ||
      cart.customerPhone.toLowerCase().includes(q) ||
      cart.customerEmail.toLowerCase().includes(q) ||
      cart.items.some((i) => i.name.toLowerCase().includes(q))
    );
  });

  const handleOpenRecoveryModal = (cart: AbandonedCart) => {
    setSelectedRecoveryCart(cart);
  };

  const handleSendWhatsAppRecovery = () => {
    if (!selectedRecoveryCart) return;

    const rawPhone = selectedRecoveryCart.customerPhone.replace(/\D/g, "");
    const firstItemName = selectedRecoveryCart.items[0]?.name || "seu presente";
    const msg = encodeURIComponent(
      `Olá ${selectedRecoveryCart.customerName}! 🌸 Notamos que você estava escolhendo ${firstItemName} na Glos Presentes e não finalizou. Para te ajudar a presentear quem você ama, liberamos o cupom ${customDiscount} com desconto exclusivo! Podemos te ajudar a concluir?`
    );

    const url = `https://wa.me/55${rawPhone}?text=${msg}`;
    window.open(url, "_blank");

    // Atualizar status do carrinho
    const updated: AbandonedCart = {
      ...selectedRecoveryCart,
      recoveryStatus: "mensagem_enviada",
      recoveryDiscountCode: customDiscount,
      lastContactDate: "Hoje",
      recoveryAttemptsCount: (selectedRecoveryCart.recoveryAttemptsCount || 0) + 1,
    };
    onUpdateCart(updated);
    setSelectedRecoveryCart(null);
  };

  const handleMarkAsRecovered = (cart: AbandonedCart) => {
    const updated: AbandonedCart = {
      ...cart,
      recoveryStatus: "recuperado",
    };
    onUpdateCart(updated);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D6D3CC]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-[#272727]">
              Carrinhos Abandonados
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#6B6A64] tabular-nums">
              {abandonedCarts.length} registros
            </span>
          </div>
          <p className="text-xs text-[#6B6A64] mt-0.5">
            Recupere vendas iniciadas que não foram concluídas pelo cliente no checkout.
          </p>
        </div>
      </div>

      {/* Métricas de Recuperação */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC]">
          <span className="text-[11px] text-[#6B6A64] block">
            Potencial em Carrinhos
          </span>
          <span className="text-lg font-medium text-[#272727] tabular-nums mt-1 block">
            R$ {totalValue.toFixed(2).replace(".", ",")}
          </span>
        </Card>

        <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC]">
          <span className="text-[11px] text-[#6B6A64] block">
            Aguardando Contato
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#004AAD]" />
            <span className="text-lg font-medium text-[#004AAD] tabular-nums">
              {notContactedCount} carrinhos
            </span>
          </div>
        </Card>

        <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC]">
          <span className="text-[11px] text-[#6B6A64] block">
            Recuperados com Sucesso
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#0F7A4F]" />
            <span className="text-lg font-medium text-[#0F7A4F] tabular-nums">
              {recoveredCount} pedidos salvos
            </span>
          </div>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#9B998F] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por cliente, telefone ou produto no carrinho..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] placeholder-[#9B998F] focus:outline-none focus:border-[#004AAD]"
        />
      </div>

      {/* Tabela de Carrinhos Abandonados */}
      <div className="w-full bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#D6D3CC] bg-[#EEEDE8] text-[#6B6A64]">
                <th className="py-2.5 px-4 font-medium">Cliente</th>
                <th className="py-2.5 px-4 font-medium">Itens no Carrinho</th>
                <th className="py-2.5 px-4 font-medium text-right">Valor</th>
                <th className="py-2.5 px-4 font-medium">Abandono</th>
                <th className="py-2.5 px-4 font-medium">Status do Contato</th>
                <th className="py-2.5 px-4 font-medium text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D3CC]">
              {filtered.map((cart) => (
                <tr key={cart.id} className="hover:bg-[#EEEDE8] transition-colors">
                  {/* Cliente */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span className="font-medium text-[#272727] block">
                        {cart.customerName}
                      </span>
                      <span className="text-[10px] text-[#6B6A64] block">
                        {cart.customerPhone}
                      </span>
                    </div>
                  </td>

                  {/* Itens */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {cart.items.slice(0, 2).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="inline-block h-7 w-7 rounded-[4px] object-cover ring-1 ring-[#D6D3CC] bg-white"
                          />
                        ))}
                      </div>
                      <span className="text-[11px] text-[#272727] truncate max-w-[200px]">
                        {cart.items[0]?.name}
                        {cart.items.length > 1 && ` (+${cart.items.length - 1})`}
                      </span>
                    </div>
                  </td>

                  {/* Valor */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-medium text-[#272727] tabular-nums">
                      R$ {cart.total.toFixed(2).replace(".", ",")}
                    </span>
                  </td>

                  {/* Data */}
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <span className="text-[#272727] block">{cart.timeAgo}</span>
                      <span className="text-[10px] text-[#9B998F] block tabular-nums">
                        {cart.abandonedAt}
                      </span>
                    </div>
                  </td>

                  {/* Status do Contato (Rótulo + Ponto) */}
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          cart.recoveryStatus === "recuperado"
                            ? "bg-[#0F7A4F]"
                            : cart.recoveryStatus === "mensagem_enviada"
                            ? "bg-[#004AAD]"
                            : "bg-[#9B998F]"
                        }`}
                      />
                      <span className="text-[11px] font-medium text-[#272727]">
                        {cart.recoveryStatus === "recuperado"
                          ? "Recuperado"
                          : cart.recoveryStatus === "mensagem_enviada"
                          ? "Mensagem Enviada"
                          : "Não Contatado"}
                      </span>
                    </div>
                  </td>

                  {/* Ação */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {cart.recoveryStatus !== "recuperado" ? (
                        <button
                          type="button"
                          onClick={() => handleOpenRecoveryModal(cart)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#004AAD] text-white text-[11px] font-medium hover:bg-[#003884] transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>Recuperar</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#0F7A4F] font-medium">
                          Concluído
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Recuperação via WhatsApp */}
      {selectedRecoveryCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden">
            <div className="p-3 border-b border-[#D6D3CC] flex items-center justify-between bg-[#EEEDE8]">
              <span className="font-medium text-[#272727] text-xs flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>Recuperar Carrinho via WhatsApp</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedRecoveryCart(null)}
                className="text-[#6B6A64] hover:text-[#272727]"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-1">
                <span className="text-[11px] text-[#6B6A64] block">Destinatário:</span>
                <span className="font-medium text-[#272727] block">
                  {selectedRecoveryCart.customerName} ({selectedRecoveryCart.customerPhone})
                </span>
                <span className="text-[11px] text-[#004AAD] block tabular-nums">
                  Total: R$ {selectedRecoveryCart.total.toFixed(2).replace(".", ",")}
                </span>
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Cupom de Desconto para Incentivo
                </label>
                <input
                  type="text"
                  value={customDiscount}
                  onChange={(e) => setCustomDiscount(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] font-medium focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px] text-[#272727] italic">
                "Olá {selectedRecoveryCart.customerName}! 🌸 Notamos que você estava escolhendo {selectedRecoveryCart.items[0]?.name} e liberamos o cupom {customDiscount} exclusivo para você finalizar seu presente..."
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D6D3CC]">
                <button
                  type="button"
                  onClick={() => setSelectedRecoveryCart(null)}
                  className="px-3 py-1.5 rounded-[6px] bg-[#EEEDE8] text-[#6B6A64]"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppRecovery}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[6px] bg-[#004AAD] text-white font-medium hover:bg-[#003884]"
                >
                  <Send className="w-3 h-3" />
                  <span>Abrir WhatsApp & Enviar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
