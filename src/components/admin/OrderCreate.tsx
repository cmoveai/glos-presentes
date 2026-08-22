import React, { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Gift,
  User,
  MapPin,
  CreditCard,
  Sparkles,
  QrCode,
  Check,
  Package,
} from "lucide-react";
import { Order, OrderItem, OrderStep, ShippingOption, Address } from "../../types";
import { Card } from "./Card";
import { deriveOrderType } from "../../services/orderService";

interface OrderCreateProps {
  onBack: () => void;
  onOrderCreated: (newOrder: Order) => void;
}

// Produtos mockados para seleção rápida
const AVAILABLE_CATALOG_PRODUCTS = [
  {
    id: "prod-caneca-foto",
    name: "Caneca Foto & Frase Afeto",
    sku: "GLOS-CAN-FOT-001",
    price: 64.9,
    costPrice: 18.0,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80",
    productType: "personalizavel" as const,
    variantName: "Cerâmica Branca • 325ml",
  },
  {
    id: "prod-quadro-spotify",
    name: "Quadro Acrílico Spotify Interativo",
    sku: "GLOS-QDR-SPT-002",
    price: 119.9,
    costPrice: 32.0,
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80",
    productType: "personalizavel" as const,
    variantName: "Acrílico Cristal 20x25cm",
  },
  {
    id: "prod-vela-lavanda",
    name: "Vela Aromática Artesanal Lavanda & Baunilha",
    sku: "GLOS-VEL-LAV-003",
    price: 49.9,
    costPrice: 14.5,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=400&q=80",
    productType: "simples" as const,
    variantName: "Pote Âmbar • 180g",
  },
  {
    id: "prod-kit-cha-gourmet",
    name: "Kit Chá Afetivo com Xícara Cerâmica",
    sku: "GLOS-KIT-CHA-007",
    price: 159.9,
    costPrice: 52.0,
    image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&q=80",
    productType: "simples" as const,
    variantName: "Caixa Presente Kraft",
  },
];

export const OrderCreate: React.FC<OrderCreateProps> = ({
  onBack,
  onOrderCreated,
}) => {
  // 1. Cliente
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCpf, setCustomerCpf] = useState("");
  const [personType, setPersonType] = useState<"PF" | "PJ">("PF");

  // 2. Itens
  const [selectedItems, setSelectedItems] = useState<
    Array<{
      productId: string;
      name: string;
      sku: string;
      price: number;
      costPrice: number;
      quantity: number;
      image: string;
      productType: "simples" | "licenciado" | "personalizavel";
      variantName?: string;
      customText?: string;
      qrLink?: string;
      qrApplied?: boolean;
    }>
  >([
    {
      productId: AVAILABLE_CATALOG_PRODUCTS[0].id,
      name: AVAILABLE_CATALOG_PRODUCTS[0].name,
      sku: AVAILABLE_CATALOG_PRODUCTS[0].sku,
      price: AVAILABLE_CATALOG_PRODUCTS[0].price,
      costPrice: AVAILABLE_CATALOG_PRODUCTS[0].costPrice,
      quantity: 1,
      image: AVAILABLE_CATALOG_PRODUCTS[0].image,
      productType: AVAILABLE_CATALOG_PRODUCTS[0].productType,
      variantName: AVAILABLE_CATALOG_PRODUCTS[0].variantName,
      customText: "Com amor para você!",
      qrLink: "",
      qrApplied: false,
    },
  ]);

  // 3. Endereço & Entrega
  const [recipientName, setRecipientName] = useState("");
  const [zipCode, setZipCode] = useState("04571-010");
  const [street, setStreet] = useState("Avenida Engenheiro Luís Carlos Berrini");
  const [number, setNumber] = useState("1000");
  const [complement, setComplement] = useState("Apto 42");
  const [neighborhood, setNeighborhood] = useState("Brooklin");
  const [city, setCity] = useState("São Paulo");
  const [state, setState] = useState("SP");
  const [shippingMethod, setShippingMethod] = useState<"jadlog" | "sedex" | "gratis">("jadlog");
  const [shippingPrice, setShippingPrice] = useState(14.5);

  // 4. Presente
  const [giftWrap, setGiftWrap] = useState(true);
  const [giftCardMessage, setGiftCardMessage] = useState("Um presente com muito amor e carinho!");

  // 5. Pagamento
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card" | "link_pagamento">("pix");
  const [discountValue, setDiscountValue] = useState(0);

  // Subtotal e Total
  const subtotal = selectedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal + shippingPrice - discountValue);

  const handleAddItem = (product: typeof AVAILABLE_CATALOG_PRODUCTS[0]) => {
    setSelectedItems([
      ...selectedItems,
      {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        costPrice: product.costPrice,
        quantity: 1,
        image: product.image,
        productType: product.productType,
        variantName: product.variantName,
        customText: product.productType === "personalizavel" ? "" : undefined,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, idx) => idx !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    if (quantity < 1) return;
    const updated = [...selectedItems];
    updated[index].quantity = quantity;
    setSelectedItems(updated);
  };

  const handleShippingChange = (method: "jadlog" | "sedex" | "gratis") => {
    setShippingMethod(method);
    if (method === "jadlog") setShippingPrice(14.5);
    else if (method === "sedex") setShippingPrice(22.0);
    else setShippingPrice(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || selectedItems.length === 0) {
      alert("Por favor, preencha os dados do cliente e selecione ao menos 1 item.");
      return;
    }

    const orderType = deriveOrderType(selectedItems as any);
    const initialStep: OrderStep = orderType === "personalizado" ? "aguardando_arquivo" : "separar";

    const formattedOrderItems = selectedItems.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      productId: item.productId,
      name: item.name,
      sku: item.sku,
      image: item.image,
      price: item.price,
      costPrice: item.costPrice,
      quantity: item.quantity,
      variantName: item.variantName,
      productType: item.productType,
      personalization:
        item.productType === "personalizavel"
          ? {
              customerFiles: [],
              customText: item.customText || "",
              mockupUrl: item.image,
              qrLink: item.qrLink || "",
              qrApplied: item.qrApplied || false,
              approvalStatus: "aguardando_envio" as const,
            }
          : undefined,
    }));

    const newOrderNumber = `#${Math.floor(9500 + Math.random() * 500)}`;
    const newOrderId = `GLOS-${newOrderNumber.replace("#", "")}`;

    const newOrder: Order = {
      id: newOrderId,
      orderNumber: newOrderNumber,
      createdAt: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
      orderType,
      currentStep: initialStep,
      status: "PAGAMENTO_CONFIRMADO",
      statusHistory: [
        {
          status: "PEDIDO_REALIZADO",
          label: "Pedido criado manualmente pelo painel",
          date: "Hoje",
        },
        {
          status: "PAGAMENTO_CONFIRMADO",
          label: "Pagamento registrado",
          date: "Hoje",
        },
      ],
      stepHistory: [
        { step: "pago", label: "Pagamento Confirmado", date: "Hoje" },
        {
          step: initialStep,
          label: orderType === "personalizado" ? "Aguardando envio de arquivo" : "Aguardando separação",
          date: "Hoje",
          updatedBy: "Lojista (Criação Manual)",
        },
      ],
      items: formattedOrderItems,
      subtotal,
      shippingPrice,
      discount: discountValue,
      total,
      paymentMethod,
      paymentStatus: "pago",
      paymentDetails: {
        isLiveGateway: true,
      },
      shippingOption: {
        id: shippingMethod,
        name:
          shippingMethod === "sedex"
            ? "Sedex Correios"
            : shippingMethod === "jadlog"
            ? "Jadlog Package"
            : "Frete Grátis Glos",
        deadline: shippingMethod === "sedex" ? "1-2 dias úteis" : "3-4 dias úteis",
        price: shippingPrice,
        originalPrice: shippingPrice,
        isFree: shippingPrice === 0,
      },
      shippingAddress: {
        id: `addr-${Date.now()}`,
        recipientName: recipientName || customerName,
        zipCode,
        street,
        number,
        complement,
        neighborhood,
        city,
        state,
        phone: customerPhone,
      },
      customer: {
        name: customerName,
        email: customerEmail || "cliente@glospresentes.com.br",
        phone: customerPhone || "(11) 99999-9999",
        cpf: customerCpf || "000.000.000-00",
        personType,
        totalOrdersCount: 1,
      },
      giftWrap,
      giftCardMessage: giftWrap ? giftCardMessage : undefined,
      actionRequired:
        orderType === "personalizado"
          ? {
              needed: true,
              reason: "Pedido manual criado — aguardando arquivo do cliente",
              urgency: "media",
            }
          : undefined,
      internalNotes: [
        {
          id: `note-${Date.now()}`,
          text: "Pedido manual cadastrado pelo lojista via WhatsApp/Balcão.",
          date: "Hoje",
          author: "Lojista",
        },
      ],
    };

    onOrderCreated(newOrder);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* Topo do Formulário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D6D3CC]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-medium text-[#272727]">
              Criar Pedido Manual
            </h1>
            <p className="text-xs text-[#6B6A64] mt-0.5">
              Cadastre pedidos recebidos pelo WhatsApp, Instagram ou balcão de vendas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 rounded-[6px] bg-[#F4F3EF] border border-[#D6D3CC] text-xs font-medium text-[#6B6A64] hover:text-[#272727]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
          >
            Criar & Salvar Pedido
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Esquerda (2 cols): Cliente, Itens e Entrega */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Dados do Comprador */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>1. Dados do Comprador</span>
              </span>
              <div className="inline-flex rounded-[4px] bg-[#EEEDE8] p-0.5 border border-[#D6D3CC]">
                <button
                  type="button"
                  onClick={() => setPersonType("PF")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-[3px] ${
                    personType === "PF" ? "bg-[#F4F3EF] text-[#004AAD]" : "text-[#6B6A64]"
                  }`}
                >
                  Pessoa Física (PF)
                </button>
                <button
                  type="button"
                  onClick={() => setPersonType("PJ")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded-[3px] ${
                    personType === "PJ" ? "bg-[#F4F3EF] text-[#004AAD]" : "text-[#6B6A64]"
                  }`}
                >
                  Pessoa Jurídica (PJ)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: Mariana Silva Couto"
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  WhatsApp / Telefone *
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  E-mail
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="mariana.couto@gmail.com"
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  {personType === "PF" ? "CPF" : "CNPJ"}
                </label>
                <input
                  type="text"
                  value={customerCpf}
                  onChange={(e) => setCustomerCpf(e.target.value)}
                  placeholder={personType === "PF" ? "000.000.000-00" : "00.000.000/0001-00"}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>
            </div>
          </Card>

          {/* 2. Seleção de Itens */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>2. Itens do Pedido ({selectedItems.length})</span>
              </span>
            </div>

            {/* Itens selecionados */}
            <div className="space-y-3">
              {selectedItems.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-[4px] object-cover bg-white border border-[#D6D3CC] shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-[#272727] block truncate">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-[#6B6A64]">
                          {item.variantName || item.sku}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-[#F4F3EF] border border-[#D6D3CC] text-[#272727] text-xs font-medium"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-medium tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(index, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-[#F4F3EF] border border-[#D6D3CC] text-[#272727] text-xs font-medium"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-medium text-[#272727] tabular-nums w-20 text-right">
                        R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1 text-[#9B998F] hover:text-[#9B2C2C]"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Campo de Personalização Rápida */}
                  {item.productType === "personalizavel" && (
                    <div className="pt-2 border-t border-[#D6D3CC] space-y-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#004AAD] font-medium">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Detalhes da Personalização</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Texto ou Frase gravada..."
                          value={item.customText || ""}
                          onChange={(e) => {
                            const updated = [...selectedItems];
                            updated[index].customText = e.target.value;
                            setSelectedItems(updated);
                          }}
                          className="px-2.5 py-1 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[4px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                        />
                        <input
                          type="text"
                          placeholder="Link QR Code Sublima Play (opcional)..."
                          value={item.qrLink || ""}
                          onChange={(e) => {
                            const updated = [...selectedItems];
                            updated[index].qrLink = e.target.value;
                            setSelectedItems(updated);
                          }}
                          className="px-2.5 py-1 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[4px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Adicionar produtos do catálogo rápido */}
            <div className="pt-2 border-t border-[#D6D3CC] space-y-2">
              <span className="text-[11px] text-[#6B6A64] block">
                Adicionar mais produtos ao pedido:
              </span>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CATALOG_PRODUCTS.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddItem(prod)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-[#EEEDE8] border border-[#D6D3CC] text-[11px] text-[#272727] hover:bg-[#E4E2DD]"
                  >
                    <Plus className="w-3 h-3 text-[#004AAD]" />
                    <span>{prod.name} (R$ {prod.price.toFixed(2).replace(".", ",")})</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* 3. Endereço de Entrega */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>3. Endereço de Entrega & Frete</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  CEP *
                </label>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Rua / Avenida *
                </label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Número *
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>
            </div>

            {/* Opções de Frete */}
            <div className="pt-2 border-t border-[#D6D3CC] space-y-2">
              <span className="text-[11px] text-[#6B6A64] block font-medium">
                Escolha o Envio:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "jadlog", name: "Jadlog Package", time: "3 dias", price: 14.5 },
                  { id: "sedex", name: "Sedex Correios", time: "1 dia", price: 22.0 },
                  { id: "gratis", name: "Frete Grátis", time: "4 dias", price: 0 },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleShippingChange(opt.id as any)}
                    className={`p-2.5 rounded-[6px] border text-left text-xs transition-colors ${
                      shippingMethod === opt.id
                        ? "bg-[#EEEDE8] border-[#004AAD] text-[#004AAD]"
                        : "bg-[#EEEDE8] border-[#D6D3CC] text-[#272727]"
                    }`}
                  >
                    <div className="flex justify-between font-medium">
                      <span>{opt.name}</span>
                      <span className="tabular-nums">
                        {opt.price === 0 ? "Grátis" : `R$ ${opt.price.toFixed(2).replace(".", ",")}`}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#6B6A64]">{opt.time}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Coluna Direita (1 col): Presente & Pagamento */}
        <div className="space-y-6">
          {/* Experiência de Presente */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>Experiência de Presente</span>
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={giftWrap}
                  onChange={(e) => setGiftWrap(e.target.checked)}
                  className="rounded text-[#004AAD] focus:ring-0"
                />
                <span className="text-[#272727] font-medium">
                  Embalagem de Presente & Laço
                </span>
              </label>

              {giftWrap && (
                <div>
                  <label className="block text-[11px] text-[#6B6A64] mb-1">
                    Mensagem do Cartão Afetivo
                  </label>
                  <textarea
                    rows={3}
                    value={giftCardMessage}
                    onChange={(e) => setGiftCardMessage(e.target.value)}
                    placeholder="Digite a dedicatória..."
                    className="w-full p-2 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Resumo & Pagamento */}
          <Card className="p-4 bg-[#F4F3EF] border border-[#D6D3CC] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#D6D3CC]">
              <span className="text-xs font-medium text-[#272727] flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#004AAD]" />
                <span>Pagamento & Fechamento</span>
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                >
                  <option value="pix">PIX Instantâneo (Já pago)</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="link_pagamento">Gerar Link de Pagamento</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#6B6A64] mb-1">
                  Desconto Manual (R$)
                </label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-[#EEEDE8] border border-[#D6D3CC] rounded-[6px] text-xs text-[#272727] focus:outline-none focus:border-[#004AAD]"
                />
              </div>

              {/* Totais */}
              <div className="pt-3 border-t border-[#D6D3CC] space-y-1.5">
                <div className="flex justify-between text-[#6B6A64]">
                  <span>Subtotal:</span>
                  <span className="tabular-nums">
                    R$ {subtotal.toFixed(2).replace(".", ",")}
                  </span>
                </div>
                <div className="flex justify-between text-[#6B6A64]">
                  <span>Frete:</span>
                  <span className="tabular-nums">
                    {shippingPrice === 0 ? "Grátis" : `R$ ${shippingPrice.toFixed(2).replace(".", ",")}`}
                  </span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-[#0F7A4F]">
                    <span>Desconto:</span>
                    <span className="tabular-nums">
                      - R$ {discountValue.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-[#D6D3CC] flex justify-between font-medium text-sm text-[#272727]">
                  <span>Total Final:</span>
                  <span className="text-[#004AAD] tabular-nums">
                    R$ {total.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors mt-2"
              >
                Concluir & Criar Pedido
              </button>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
};
