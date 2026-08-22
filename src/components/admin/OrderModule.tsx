import React, { useState, useEffect } from "react";
import {
  Order,
  CartLink,
  AbandonedCart,
} from "../../types";
import {
  getOrdersFromStorage,
  saveOrdersToStorage,
  getCartLinksFromStorage,
  saveCartLinksToStorage,
  getAbandonedCartsFromStorage,
  saveAbandonedCartsToStorage,
} from "../../services/orderService";
import { OrderList } from "./OrderList";
import { OrderDetail } from "./OrderDetail";
import { OrderCreate } from "./OrderCreate";
import { CartLinkManager } from "./CartLinkManager";
import { AbandonedCarts } from "./AbandonedCarts";
import { ApprovalCenter } from "./ApprovalCenter";

interface OrderModuleProps {
  subSection?: string;
  onNavigateSubSection?: (subId: string) => void;
}

export const OrderModule: React.FC<OrderModuleProps> = ({
  subSection = "listar",
  onNavigateSubSection,
}) => {
  const [orders, setOrders] = useState<Order[]>(getOrdersFromStorage);
  const [cartLinks, setCartLinks] = useState<CartLink[]>(getCartLinksFromStorage);
  const [abandonedCarts, setAbandonedCarts] = useState<AbandonedCart[]>(getAbandonedCartsFromStorage);

  const [currentSubView, setCurrentSubView] = useState<string>(subSection);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Sincronizar com subSection passado via prop da Sidebar
  useEffect(() => {
    if (subSection) {
      setCurrentSubView(subSection);
      if (subSection !== "detalhes") {
        // Se mudou de aba, limpar seleção detalhada se aplicável
      }
    }
  }, [subSection]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentSubView("detalhes");
  };

  const handleBackToList = () => {
    setSelectedOrderId(null);
    setCurrentSubView("listar");
    if (onNavigateSubSection) onNavigateSubSection("listar");
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    const nextOrders = orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));
    setOrders(nextOrders);
    saveOrdersToStorage(nextOrders);
  };

  const handleOrderCreated = (newOrder: Order) => {
    const nextOrders = [newOrder, ...orders];
    setOrders(nextOrders);
    saveOrdersToStorage(nextOrders);
    setSelectedOrderId(newOrder.id);
    setCurrentSubView("detalhes");
  };

  const handleCreateCartLink = (newLink: CartLink) => {
    const nextLinks = [newLink, ...cartLinks];
    setCartLinks(nextLinks);
    saveCartLinksToStorage(nextLinks);
  };

  const handleDeleteCartLink = (linkId: string) => {
    const nextLinks = cartLinks.filter((l) => l.id !== linkId);
    setCartLinks(nextLinks);
    saveCartLinksToStorage(nextLinks);
  };

  const handleUpdateAbandonedCart = (updatedCart: AbandonedCart) => {
    const nextCarts = abandonedCarts.map((c) => (c.id === updatedCart.id ? updatedCart : c));
    setAbandonedCarts(nextCarts);
    saveAbandonedCartsToStorage(nextCarts);
  };

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  // Renderização da Sub-View
  if (currentSubView === "detalhes" && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={handleBackToList}
        onUpdateOrder={handleUpdateOrder}
      />
    );
  }

  if (currentSubView === "aprovacoes") {
    return (
      <ApprovalCenter
        onViewOrderDetails={(orderId) => {
          handleSelectOrder(orderId);
        }}
      />
    );
  }

  if (currentSubView === "criar") {
    return (
      <OrderCreate
        onBack={handleBackToList}
        onOrderCreated={handleOrderCreated}
      />
    );
  }

  if (currentSubView === "link-carrinho") {
    return (
      <CartLinkManager
        cartLinks={cartLinks}
        onCreateLink={handleCreateCartLink}
        onDeleteLink={handleDeleteCartLink}
      />
    );
  }

  if (currentSubView === "carrinhos-abandonados") {
    return (
      <AbandonedCarts
        abandonedCarts={abandonedCarts}
        onUpdateCart={handleUpdateAbandonedCart}
      />
    );
  }

  return (
    <OrderList
      orders={orders}
      onSelectOrder={handleSelectOrder}
      onCreateOrder={() => {
        setCurrentSubView("criar");
        if (onNavigateSubSection) onNavigateSubSection("criar");
      }}
      onOpenCartLinks={() => {
        setCurrentSubView("link-carrinho");
        if (onNavigateSubSection) onNavigateSubSection("link-carrinho");
      }}
      onOpenAbandonedCarts={() => {
        setCurrentSubView("carrinhos-abandonados");
        if (onNavigateSubSection) onNavigateSubSection("carrinhos-abandonados");
      }}
    />
  );
};
