import React, { useState } from "react";
import {
  Link as LinkIcon,
  Plus,
  Copy,
  Check,
  Share2,
  MessageCircle,
  ExternalLink,
  Trash2,
  Clock,
  Sparkles,
} from "lucide-react";
import { CartLink, CartLinkItem } from "../../types";
import { Card } from "./Card";

interface CartLinkManagerProps {
  cartLinks: CartLink[];
  onCreateLink: (newLink: CartLink) => void;
  onDeleteLink: (linkId: string) => void;
}

export const CartLinkManager: React.FC<CartLinkManagerProps> = ({
  cartLinks,
  onCreateLink,
  onDeleteLink,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [couponCode, setCouponCode] = useState("");

  const handleCopyLink = (link: CartLink) => {
    navigator.clipboard.writeText(link.url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (link: CartLink) => {
    const rawPhone = link.targetPhone ? link.targetPhone.replace(/\D/g, "") : "";
    const msg = encodeURIComponent(
      `Olá ${link.targetCustomerName || "tudo bem"}! Preparei um carrinho especial para você na Glos Presentes com os itens que conversamos: ${link.url}`
    );
    const url = rawPhone ? `https://wa.me/55${rawPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, "_blank");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const code = title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .slice(0, 20)
      .toUpperCase();

    const sampleItems: CartLinkItem[] = [
      {
        productId: "prod-caneca-foto",
        productName: "Caneca Foto & Frase Afeto (325ml)",
        price: 64.9,
        quantity: 1,
      },
    ];

    const subtotal = 64.9;
    const discount = (subtotal * (discountPercent || 0)) / 100;
    const total = subtotal - discount;

    const newLink: CartLink = {
      id: `link-${Date.now()}`,
      title: title.trim(),
      code,
      targetCustomerName: customerName.trim() || undefined,
      targetPhone: customerPhone.trim() || undefined,
      items: sampleItems,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      couponCode: couponCode.trim() || undefined,
      subtotal,
      total,
      url: `https://glos.com.br/c/${code}`,
      createdAt: new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" }),
      clicksCount: 0,
      converted: false,
      status: "ativo",
    };

    onCreateLink(newLink);
    setShowCreateModal(false);
    setTitle("");
    setCustomerName("");
    setCustomerPhone("");
    setDiscountPercent(0);
    setCouponCode("");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D6D3CC]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-[#272727]">
              Links de Carrinho Pré-Montados
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[#6B6A64] tabular-nums">
              {cartLinks.length} links
            </span>
          </div>
          <p className="text-xs text-[#6B6A64] mt-0.5">
            Monte carrinhos exclusivos para clientes no WhatsApp ou Direct com desconto pré-aplicado e checkout em 1 clique.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Criar Link de Carrinho</span>
        </button>
      </div>

      {/* Grid de Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cartLinks.map((link) => (
          <Card key={link.id} className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#272727]">
                    {link.title}
                  </span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-[3px] text-[10px] font-medium border ${
                      link.status === "convertido"
                        ? "bg-[#EEEDE8] border-[#D6D3CC] text-[#0F7A4F]"
                        : "bg-[#EEEDE8] border-[#D6D3CC] text-[#004AAD]"
                    }`}
                  >
                    ● {link.status === "convertido" ? "Convertido em Venda" : "Ativo"}
                  </span>
                </div>
                {link.targetCustomerName && (
                  <p className="text-[11px] text-[#6B6A64]">
                    Para: <strong className="font-medium text-[#272727]">{link.targetCustomerName}</strong>
                    {link.targetPhone && ` • ${link.targetPhone}`}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDeleteLink(link.id)}
                className="p-1 text-[#9B998F] hover:text-[#9B2C2C]"
                title="Excluir link"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Link Box */}
            <div className="p-2.5 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-[#004AAD] truncate">
                {link.url}
              </span>
              <button
                type="button"
                onClick={() => handleCopyLink(link)}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-[4px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#272727] hover:bg-[#E4E2DD]"
              >
                {copiedId === link.id ? (
                  <>
                    <Check className="w-3 h-3 text-[#0F7A4F]" />
                    <span className="text-[11px] text-[#0F7A4F]">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-[#6B6A64]" />
                    <span className="text-[11px]">Copiar</span>
                  </>
                )}
              </button>
            </div>

            {/* Estatísticas e Ação WhatsApp */}
            <div className="flex items-center justify-between pt-2 border-t border-[#D6D3CC] text-xs">
              <div className="flex items-center gap-3 text-[#6B6A64] text-[11px]">
                <span className="tabular-nums">Cliques: {link.clicksCount}</span>
                <span className="tabular-nums">Total: R$ {link.total.toFixed(2).replace(".", ",")}</span>
              </div>

              <button
                type="button"
                onClick={() => handleShareWhatsApp(link)}
                className="inline-flex items-center gap-1 text-xs text-[#004AAD] font-medium hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar pelo WhatsApp</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Criação */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] overflow-hidden"
          >
            <div className="p-3 border-b border-[#D6D3CC] flex items-center justify-between bg-[#EEEDE8]">
              <span className="font-medium text-[#272727] text-xs">
                Novo Link de Carrinho Pré-Montado
              </span>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#6B6A64] hover:text-[#272727]"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Título de Referência Interna *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Combo Aniversário Camila • 2 Canecas"
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#6B6A64] mb-1">
                    Nome do Cliente
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex: Camila Rocha"
                    className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#6B6A64] mb-1">
                    WhatsApp do Cliente
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#6B6A64] mb-1">
                    Desconto Especial (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-[#6B6A64] mb-1">
                    Cupom Vinculado
                  </label>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Ex: AFETO10"
                    className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D6D3CC]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-[6px] bg-[#EEEDE8] text-[#6B6A64]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[6px] bg-[#004AAD] text-white font-medium hover:bg-[#003884]"
                >
                  Gerar Link
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
