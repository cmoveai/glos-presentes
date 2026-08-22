import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Address, Order, UserProfile } from "../types";
import { useToast } from "./ToastContext";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  orders: Order[];
  login: (email: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addAddress: (address: Omit<Address, "id">) => void;
  updateAddress: (address: Address) => void;
  deleteAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
  addOrder: (order: Order) => void;
  getOrderById: (orderId: string) => Order | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "ndm_user_profile";
const ORDERS_STORAGE_KEY = "ndm_user_orders";

const INITIAL_DEMO_ADDRESS: Address = {
  id: "addr-1",
  recipientName: "Cliente Demonstrativo",
  zipCode: "01310-100",
  street: "Avenida Paulista",
  number: "1000",
  complement: "Apto 82",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
  phone: "(11) 98765-4321",
  isDefault: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const login = useCallback(
    async (email: string, name?: string) => {
      const formattedName = name || email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const newUser: UserProfile = {
        id: "usr-" + Math.random().toString(36).substring(2, 9),
        email,
        name: formattedName,
        phone: "(11) 98765-4321",
        cpf: "123.456.789-00",
        addresses: [INITIAL_DEMO_ADDRESS],
      };
      setUser(newUser);
      showToast(`Bem-vindo(a) de volta, ${formattedName}!`, "success");
    },
    [showToast]
  );

  const loginWithGoogle = useCallback(async () => {
    const googleUser: UserProfile = {
      id: "usr-google-" + Math.random().toString(36).substring(2, 8),
      name: "Consumidor Google",
      email: "cliente.google@gmail.com",
      phone: "(11) 99123-4567",
      cpf: "345.678.912-34",
      addresses: [INITIAL_DEMO_ADDRESS],
    };
    setUser(googleUser);
    showToast("Login com Google realizado com sucesso!", "success");
  }, [showToast]);

  const register = useCallback(
    async (name: string, email: string, phone?: string) => {
      const newUser: UserProfile = {
        id: "usr-" + Math.random().toString(36).substring(2, 9),
        email,
        name,
        phone: phone || "(11) 98765-4321",
        cpf: "123.456.789-00",
        addresses: [],
      };
      setUser(newUser);
      showToast("Cadastro realizado com sucesso!", "success");
    },
    [showToast]
  );

  const logout = useCallback(() => {
    setUser(null);
    showToast("Você saiu da sua conta.", "info");
  }, [showToast]);

  const updateProfile = useCallback(
    (data: Partial<UserProfile>) => {
      setUser((prev) => (prev ? { ...prev, ...data } : null));
      showToast("Dados atualizados com sucesso!", "success");
    },
    [showToast]
  );

  const addAddress = useCallback(
    (addressData: Omit<Address, "id">) => {
      const newAddress: Address = {
        ...addressData,
        id: "addr-" + Date.now(),
      };
      setUser((prev) => {
        if (!prev) return null;
        const addresses = [...prev.addresses, newAddress];
        return { ...prev, addresses };
      });
      showToast("Endereço adicionado com sucesso!", "success");
    },
    [showToast]
  );

  const updateAddress = useCallback(
    (address: Address) => {
      setUser((prev) => {
        if (!prev) return null;
        const addresses = prev.addresses.map((a) => (a.id === address.id ? address : a));
        return { ...prev, addresses };
      });
      showToast("Endereço atualizado!", "success");
    },
    [showToast]
  );

  const deleteAddress = useCallback(
    (addressId: string) => {
      setUser((prev) => {
        if (!prev) return null;
        const addresses = prev.addresses.filter((a) => a.id !== addressId);
        return { ...prev, addresses };
      });
      showToast("Endereço excluído.", "info");
    },
    [showToast]
  );

  const setDefaultAddress = useCallback(
    (addressId: string) => {
      setUser((prev) => {
        if (!prev) return null;
        const addresses = prev.addresses.map((a) => ({
          ...a,
          isDefault: a.id === addressId,
        }));
        return { ...prev, addresses };
      });
      showToast("Endereço padrão atualizado.", "success");
    },
    [showToast]
  );

  const addOrder = useCallback((order: Order) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const getOrderById = useCallback(
    (orderId: string) => {
      return orders.find((o) => o.id === orderId);
    },
    [orders]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        orders,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        addOrder,
        getOrderById,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
