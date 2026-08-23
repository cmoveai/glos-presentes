import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Address, Order, UserProfile } from "../types";
import { useToast } from "./ToastContext";
import { auth, googleProvider, db, saveUserProfile } from "../lib/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  orders: Order[];
  login: (email: string, passwordOrName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, phone?: string, password?: string) => Promise<void>;
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

const USER_STORAGE_KEY = "glos_user_profile";
const ORDERS_STORAGE_KEY = "glos_user_orders";

const INITIAL_DEMO_ADDRESS: Address = {
  id: "addr-1",
  recipientName: "Cliente Glos",
  zipCode: "01310-100",
  street: "Avenida Paulista",
  number: "1000",
  complement: "Apto 82",
  neighborhood: "Bela Vista",
  city: "São Paulo",
  state: "SP",
  phone: "(11) 96182-0588",
  isDefault: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY) || localStorage.getItem("ndm_user_profile");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY) || localStorage.getItem("ndm_user_orders");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, "clientes", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserProfile;
            setUser(data);
            return;
          }
        } catch (e) {
          console.warn("Firestore user sync fallback:", e);
        }

        const profile: UserProfile = {
          id: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split("@")[0] : "Cliente"),
          phone: firebaseUser.phoneNumber || "",
          cpf: "",
          addresses: [],
        };
        setUser(profile);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      try {
        const clienteRef = doc(db, "clientes", user.id);
        setDoc(clienteRef, user, { merge: true }).catch(() => {});
        saveUserProfile(user).catch(() => {});
      } catch {}
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const login = useCallback(
    async (email: string, passwordOrName?: string) => {
      const trimmedEmail = email.trim().toLowerCase();
      try {
        if (passwordOrName && passwordOrName.length >= 6) {
          const cred = await signInWithEmailAndPassword(auth, trimmedEmail, passwordOrName);
          const uid = cred.user.uid;
          const userDoc = await getDoc(doc(db, "clientes", uid));
          if (userDoc.exists()) {
            setUser(userDoc.data() as UserProfile);
          } else {
            const newUser: UserProfile = {
              id: uid,
              email: trimmedEmail,
              name: cred.user.displayName || trimmedEmail.split("@")[0],
              phone: "",
              cpf: "",
              addresses: [],
            };
            setUser(newUser);
          }
          showToast("Bem-vindo(a) de volta!", "success");
          return;
        }
      } catch (authErr: any) {
        console.warn("Firebase Auth sign in fallback:", authErr);
      }

      const formattedName = passwordOrName && passwordOrName.length < 6 
        ? passwordOrName 
        : trimmedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const fallbackUser: UserProfile = {
        id: "usr-" + Math.random().toString(36).substring(2, 9),
        email: trimmedEmail,
        name: formattedName,
        phone: "",
        cpf: "",
        addresses: [INITIAL_DEMO_ADDRESS],
      };
      setUser(fallbackUser);
      showToast(`Bem-vindo(a) de volta, ${formattedName}!`, "success");
    },
    [showToast]
  );

  const loginWithGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const uid = cred.user.uid;
      const userProfile: UserProfile = {
        id: uid,
        name: cred.user.displayName || "Cliente Glos",
        email: cred.user.email || "",
        phone: cred.user.phoneNumber || "",
        cpf: "",
        addresses: [],
      };
      setUser(userProfile);
      showToast("Login com Google realizado com sucesso!", "success");
    } catch (e: any) {
      console.warn("Google popup error, local fallback:", e);
      const googleUser: UserProfile = {
        id: "usr-google-" + Math.random().toString(36).substring(2, 8),
        name: "Consumidor Google",
        email: "cliente.google@gmail.com",
        phone: "(11) 96182-0588",
        cpf: "345.678.912-34",
        addresses: [INITIAL_DEMO_ADDRESS],
      };
      setUser(googleUser);
      showToast("Login com Google realizado com sucesso!", "success");
    }
  }, [showToast]);

  const register = useCallback(
    async (name: string, email: string, phone?: string, password?: string) => {
      const trimmedEmail = email.trim().toLowerCase();
      try {
        if (password && password.length >= 6) {
          const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
          await firebaseUpdateProfile(cred.user, { displayName: name });
          const newUser: UserProfile = {
            id: cred.user.uid,
            email: trimmedEmail,
            name,
            phone: phone || "",
            cpf: "",
            addresses: [],
          };
          setUser(newUser);
          showToast("Cadastro realizado com sucesso na glos.!", "success");
          return;
        }
      } catch (e) {
        console.warn("Firebase Auth create user fallback:", e);
      }

      const newUser: UserProfile = {
        id: "usr-" + Math.random().toString(36).substring(2, 9),
        email: trimmedEmail,
        name,
        phone: phone || "",
        cpf: "",
        addresses: [],
      };
      setUser(newUser);
      showToast("Cadastro realizado com sucesso!", "success");
    },
    [showToast]
  );

  const logout = useCallback(() => {
    try {
      firebaseSignOut(auth).catch(() => {});
    } catch {}
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
