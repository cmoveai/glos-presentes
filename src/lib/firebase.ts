import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  uploadBytes,
} from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";
import { Product, Order, OrderStatus, UserProfile, Coupon, CategoryInfo, ProductCollection, HeroCampaign, EditorialBanner, MarketingSettings, StoreOperationsSettings, CustomerFile, Supplier } from "../types";
import { PRODUCTS } from "../data/products";
import { CATEGORIES } from "../data/categories";
import { HERO_CAMPAIGNS, EDITORIAL_BANNERS } from "../data/banners";
import { BRAND_CONFIG } from "../config/brand";

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Seeds initial products into Firestore if the collection is empty.
 */
export async function seedProductsIfEmpty(): Promise<void> {
  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(query(productsRef, limit(1)));
    
    if (snapshot.empty) {
      console.log("Seeding products to Firestore database...");
      const batch = writeBatch(db);
      for (const prod of PRODUCTS) {
        const prodDoc = doc(db, "products", prod.id);
        batch.set(prodDoc, prod);
      }
      await batch.commit();
      console.log("Products seeded successfully.");
    }
  } catch (error) {
    console.warn("Firestore product seeding skipped or offline:", error);
  }
}

/**
 * Fetch all products from Firestore with fallback to local mock data.
 */
export async function fetchProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as Product);
    }
    // If empty in cloud, try seeding in background
    seedProductsIfEmpty().catch(() => {});
    return PRODUCTS;
  } catch (error) {
    console.warn("Error loading products from Firestore, falling back to local list:", error);
    return PRODUCTS;
  }
}

/**
 * Fetch single product by slug or ID.
 */
export async function fetchProductBySlug(slug: string): Promise<Product | undefined> {
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("slug", "==", slug), limit(1));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Product;
    }
  } catch (error) {
    console.warn("Error fetching product by slug from Firestore:", error);
  }
  return PRODUCTS.find((p) => p.slug === slug || p.id === slug);
}

/**
 * Save an order to Firestore.
 */
export async function saveOrderToFirestore(order: Order): Promise<boolean> {
  try {
    const orderDoc = doc(db, "orders", order.id);
    await setDoc(orderDoc, order);
    return true;
  } catch (error) {
    console.error("Failed to save order to Firestore:", error);
    return false;
  }
}

/**
 * Fetch orders by user email or user ID from Firestore.
 */
export async function fetchUserOrders(emailOrUserId?: string, clienteId?: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, "orders");
    let docsResult: Order[] = [];

    if (clienteId) {
      const qCliente = query(
        ordersRef,
        where("clienteId", "==", clienteId),
        orderBy("createdAt", "desc")
      );
      const snapCliente = await getDocs(qCliente);
      if (!snapCliente.empty) {
        docsResult = snapCliente.docs.map((d) => d.data() as Order);
      }
    }

    if (docsResult.length === 0 && emailOrUserId) {
      const qEmail = query(
        ordersRef,
        where("customer.email", "==", emailOrUserId),
        orderBy("createdAt", "desc")
      );
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        docsResult = snapEmail.docs.map((d) => d.data() as Order);
      }
    }

    if (docsResult.length > 0) {
      return docsResult;
    }
  } catch (error) {
    console.warn("Firestore fetchUserOrders falling back to localStorage:", error);
  }
  try {
    const local = localStorage.getItem("ndm_user_orders") || localStorage.getItem("glos_user_orders");
    if (local) {
      const allOrders: Order[] = JSON.parse(local);
      if (clienteId || emailOrUserId) {
        return allOrders.filter(
          (o) =>
            (clienteId && o.clienteId === clienteId) ||
            (emailOrUserId && (o.customer?.email || "").toLowerCase() === emailOrUserId.toLowerCase())
        );
      }
      return allOrders;
    }
  } catch {
    return [];
  }
  return [];
}

/**
 * Update mockup approval state directly in Firestore.
 */
export async function updateOrderMockupApprovalFirestore(
  orderId: string,
  acao: "aprovar" | "pedir_ajuste",
  comentario?: string
): Promise<boolean> {
  const nowIso = new Date().toISOString();
  try {
    const orderDoc = doc(db, "orders", orderId);
    const snap = await getDoc(orderDoc);

    const updatePayload: any = {
      aprovacaoMockup: acao === "aprovar" ? "aprovado" : "ajuste_solicitado",
      updatedAt: nowIso,
    };

    if (acao === "aprovar") {
      updatePayload.dataAprovacaoMockup = nowIso;
      updatePayload.statusPedido = "em_producao";
      updatePayload.currentStep = "em_producao";
    } else {
      updatePayload.comentarioAjuste = (comentario || "").trim();
      updatePayload.dataSolicitacaoAjuste = nowIso;
      updatePayload.statusPedido = "aguardando_aprovacao";
      updatePayload.currentStep = "arte_aprovacao";
    }

    if (snap.exists()) {
      const existing = snap.data() as Order;
      const newEvent = {
        status: (existing.status || "EM_SEPARACAO") as any,
        label: acao === "aprovar" ? "Arte Aprovada pelo Cliente" : "Ajuste de Arte Solicitado",
        date: nowIso,
        description:
          acao === "aprovar"
            ? "Cliente aprovou o mockup da arte no site. Pedido em produção."
            : `Cliente solicitou ajuste no mockup: "${comentario || ""}"`,
      };
      updatePayload.statusHistory = [...(existing.statusHistory || []), newEvent];
      await updateDoc(orderDoc, updatePayload);
    } else {
      await setDoc(orderDoc, updatePayload, { merge: true });
    }

    // Sync in localStorage
    try {
      const saved = localStorage.getItem("ndm_user_orders");
      if (saved) {
        const list: Order[] = JSON.parse(saved);
        const idx = list.findIndex((o) => o.id === orderId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updatePayload };
          localStorage.setItem("ndm_user_orders", JSON.stringify(list));
        }
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn("Firestore updateOrderMockupApproval fallback:", err);
    return false;
  }
}

/**
 * Admin: Attach art mockup and send for customer approval in Firestore.
 */
export async function attachOrderMockupFirestore(
  orderId: string,
  mockupUrl: string,
  qrLink?: string,
  qrApplied?: boolean,
  customNote?: string
): Promise<boolean> {
  const nowIso = new Date().toISOString();
  try {
    const orderDoc = doc(db, "orders", orderId);
    const snap = await getDoc(orderDoc);

    const updatePayload: any = {
      mockupUrl,
      aprovacaoMockup: "aguardando_aprovacao",
      statusPedido: "aguardando_aprovacao",
      currentStep: "arte_aprovacao",
      updatedAt: nowIso,
    };

    if (qrLink !== undefined) {
      updatePayload.qrLink = qrLink;
      updatePayload.qrApplied = qrApplied ?? true;
      updatePayload.qrAplicado = qrApplied ?? true;
    }

    if (snap.exists()) {
      const existing = snap.data() as Order;
      const prevAjuste = existing.comentarioAjuste;
      const newEvent = {
        status: (existing.status || "EM_SEPARACAO") as any,
        label: "Mockup Enviado para Aprovação",
        date: nowIso,
        description: prevAjuste
          ? `Glos anexou nova prova visual após ajuste ("${prevAjuste}"). Enviado para validação do cliente.`
          : `Glos anexou o mockup da arte montada no Sublima e enviou para aprovação do cliente.`,
      };
      updatePayload.statusHistory = [...(existing.statusHistory || []), newEvent];

      // Update items personalization
      if (Array.isArray(existing.items)) {
        updatePayload.items = existing.items.map((it) => {
          if (it.personalization || it.requerArquivo || (it as any).natureza === "personalizavel") {
            return {
              ...it,
              mockupUrl,
              personalization: {
                ...(it.personalization || {}),
                mockupUrl,
                approvalStatus: "aguardando_aprovacao",
                qrLink: qrLink ?? it.personalization?.qrLink,
                qrApplied: qrApplied ?? it.personalization?.qrApplied,
                notes: customNote || it.personalization?.notes,
              },
            };
          }
          return it;
        });
      }

      await updateDoc(orderDoc, updatePayload);
    } else {
      await setDoc(orderDoc, updatePayload, { merge: true });
    }

    // Sync localStorage
    try {
      const saved = localStorage.getItem("ndm_user_orders");
      if (saved) {
        const list: Order[] = JSON.parse(saved);
        const idx = list.findIndex((o) => o.id === orderId);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...updatePayload };
          localStorage.setItem("ndm_user_orders", JSON.stringify(list));
        }
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn("Firestore attachOrderMockup fallback:", err);
    return false;
  }
}

/**
 * Formata tamanho de arquivo em KB / MB
 */
function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  const dm = 1;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Determina o tipo do arquivo do cliente a partir do MIME type ou extensão
 */
export function detectCustomerFileType(file: File): "imagem" | "video" | "audio" | "outro" {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (
    mime.startsWith("image/") ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".heic") ||
    name.endsWith(".webp") ||
    name.endsWith(".svg") ||
    name.endsWith(".bmp")
  ) {
    return "imagem";
  }

  if (
    mime.startsWith("video/") ||
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    name.endsWith(".avi") ||
    name.endsWith(".mkv") ||
    name.endsWith(".webm")
  ) {
    return "video";
  }

  if (
    mime.startsWith("audio/") ||
    name.endsWith(".mp3") ||
    name.endsWith(".m4a") ||
    name.endsWith(".wav") ||
    name.endsWith(".aac") ||
    name.endsWith(".ogg") ||
    name.endsWith(".flac")
  ) {
    return "audio";
  }

  return "outro";
}

/**
 * UPLOAD DE ARQUIVO ORIGINAL DO CLIENTE NO FIREBASE STORAGE (COMANDO 15)
 * Regra de Ouro: NÃO comprime nem redimensiona o arquivo.
 * Preserva o arquivo bruto original para garantir a máxima qualidade de impressão.
 */
export async function uploadCustomerFileOriginal(
  orderId: string,
  itemId: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<CustomerFile> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const timestamp = Date.now();
  const cleanOrderId = orderId.replace(/[^a-zA-Z0-9_-]/g, "");
  const cleanItemId = (itemId || "geral").replace(/[^a-zA-Z0-9_-]/g, "");
  const storagePath = `pedidos/${cleanOrderId}/arquivos-cliente/${cleanItemId}/${timestamp}_${safeName}`;
  const fileType = detectCustomerFileType(file);
  const formattedSize = formatFileSize(file.size);

  try {
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type || "application/octet-stream",
      customMetadata: {
        originalName: file.name,
        orderId: cleanOrderId,
        uploadedAt: new Date().toISOString(),
        preservedOriginal: "true",
      },
    });

    const downloadUrl = await new Promise<string>((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = snapshot.totalBytes > 0 
            ? Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            : 0;
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.warn("Storage upload task error:", error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(url);
          } catch (e) {
            reject(e);
          }
        }
      );
    });

    return {
      id: `file_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      url: downloadUrl,
      type: fileType,
      size: formattedSize,
      uploadedAt: new Date().toISOString(),
    };
  } catch (storageError) {
    console.warn("Direct Firebase Storage upload unavailable, using high-fidelity fallback without compression:", storageError);
    if (onProgress) onProgress(50);

    // Fallback de alta fidelidade: converte para DataURL mantendo 100% dos bytes originais sem qualquer perda
    const fallbackUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (onProgress) onProgress(100);
        resolve(ev.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return {
      id: `file_${timestamp}_${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      url: fallbackUrl,
      type: fileType,
      size: formattedSize,
      uploadedAt: new Date().toISOString(),
    };
  }
}

/**
 * Salva os arquivos enviados pelo cliente no Firestore e atualiza o status do pedido
 * para "arquivo_recebido" (Comando 15)
 */
export async function salvarArquivosClienteFirestore(
  orderId: string,
  novosArquivos: CustomerFile[],
  comentario?: string,
  clienteId?: string
): Promise<boolean> {
  const nowIso = new Date().toISOString();
  try {
    const orderDoc = doc(db, "orders", orderId);
    const snap = await getDoc(orderDoc);

    const updatePayload: any = {
      statusPedido: "arquivo_recebido",
      currentStep: "aguardando_arquivo",
      aprovacaoMockup: "arquivo_recebido",
      dataEnvioArquivos: nowIso,
      updatedAt: nowIso,
    };

    if (comentario && comentario.trim()) {
      updatePayload.comentarioCliente = comentario.trim();
    }

    if (snap.exists()) {
      const existing = snap.data() as Order;
      const existingFiles = existing.arquivosCliente || [];
      const combinedFiles = [...existingFiles, ...novosArquivos];
      updatePayload.arquivosCliente = combinedFiles;

      const newHistoryEvent = {
        status: (existing.status || "EM_SEPARACAO") as any,
        label: "Recebemos seu arquivo",
        date: nowIso,
        description: `Recebemos ${novosArquivos.length} arquivo(s) em alta resolução pelo site. Nossa equipe já está preparando a prova visual no ateliê.`,
      };
      updatePayload.statusHistory = [...(existing.statusHistory || []), newHistoryEvent];

      if (!existing.stepHistory) existing.stepHistory = [];
      updatePayload.stepHistory = [
        ...(existing.stepHistory || []),
        {
          step: "aguardando_arquivo",
          label: "Arquivos recebidos",
          date: nowIso,
          updatedBy: "Cliente via Web",
          note: `${novosArquivos.length} arquivo(s) em alta resolução recebido(s)${comentario ? ` • "${comentario}"` : ""}`,
        },
      ];

      // Atualiza os itens personalizáveis com os arquivos
      if (Array.isArray(existing.items)) {
        updatePayload.items = existing.items.map((it) => {
          if (it.personalization || it.requerArquivo || (it as any).natureza === "personalizavel") {
            const currentItemFiles = it.personalization?.customerFiles || [];
            return {
              ...it,
              personalization: {
                ...(it.personalization || {}),
                customerFiles: [...currentItemFiles, ...novosArquivos],
                customText: comentario || it.personalization?.customText,
                approvalStatus: "aguardando_envio",
              },
            };
          }
          return it;
        });
      }

      await updateDoc(orderDoc, updatePayload);
    } else {
      updatePayload.arquivosCliente = novosArquivos;
      await setDoc(orderDoc, updatePayload, { merge: true });
    }

    // Sync localStorage
    try {
      const saved = localStorage.getItem("ndm_user_orders");
      if (saved) {
        const list: Order[] = JSON.parse(saved);
        const idx = list.findIndex((o) => o.id === orderId || o.orderNumber === orderId);
        if (idx >= 0) {
          const currentFiles = list[idx].arquivosCliente || [];
          list[idx] = {
            ...list[idx],
            ...updatePayload,
            arquivosCliente: [...currentFiles, ...novosArquivos],
          };
          localStorage.setItem("ndm_user_orders", JSON.stringify(list));
        }
      }
    } catch {}

    return true;
  } catch (err) {
    console.warn("Firestore salvarArquivosCliente fallback:", err);
    return false;
  }
}

/**
 * Save or update user profile in Firestore.
 */
export async function saveUserProfile(user: UserProfile): Promise<void> {
  try {
    const userDoc = doc(db, "clientes", user.id);
    await setDoc(userDoc, user, { merge: true });
    // Also mirror to users for backward compatibility
    const legacyDoc = doc(db, "users", user.id);
    await setDoc(legacyDoc, user, { merge: true });
  } catch (error) {
    console.warn("Failed to sync user profile with Firestore:", error);
  }
}

/**
 * Fetch all customers/clients from Firestore (clientes and users collections).
 */
export async function fetchAllCustomersAdmin(): Promise<UserProfile[]> {
  const clientsMap = new Map<string, UserProfile>();

  // 1. Query `clientes` collection
  try {
    const clientesRef = collection(db, "clientes");
    const snap = await getDocs(clientesRef);
    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      const key = data.id || docSnap.id;
      clientsMap.set(key, { ...data, id: key });
    });
  } catch (err) {
    console.warn("Firestore fetch clientes fallback:", err);
  }

  // 2. Query `users` collection
  try {
    const usersRef = collection(db, "users");
    const snap = await getDocs(usersRef);
    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      const key = data.id || docSnap.id;
      if (!clientsMap.has(key)) {
        clientsMap.set(key, { ...data, id: key });
      } else {
        const existing = clientsMap.get(key)!;
        clientsMap.set(key, {
          ...existing,
          ...data,
          addresses: data.addresses && data.addresses.length > 0 ? data.addresses : existing.addresses,
        });
      }
    });
  } catch (err) {
    console.warn("Firestore fetch users fallback:", err);
  }

  // 3. Fallback to local storage if user stored
  try {
    const localUser = localStorage.getItem("ndm_user_profile") || localStorage.getItem("glos_user_profile");
    if (localUser) {
      const parsed = JSON.parse(localUser);
      if (parsed && parsed.id && !clientsMap.has(parsed.id)) {
        clientsMap.set(parsed.id, parsed);
      }
    }
  } catch {}

  return Array.from(clientsMap.values());
}

/**
 * Fetch all orders for the Admin Dashboard.
 */
export async function fetchAllOrdersAdmin(): Promise<Order[]> {
  try {
    const ordersRef = collection(db, "orders");
    const snapshot = await getDocs(query(ordersRef, orderBy("createdAt", "desc")));
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as Order);
    }
  } catch (error) {
    console.warn("Firestore fetchAllOrdersAdmin fallback:", error);
  }

  // Fallback to local storage or generated orders
  try {
    const local = localStorage.getItem("ndm_user_orders");
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Update an order's status and tracking code from the Admin Dashboard.
 */
export async function updateOrderStatusAdmin(
  orderId: string,
  newStatus: OrderStatus,
  trackingCode?: string,
  note?: string
): Promise<boolean> {
  try {
    const orderDoc = doc(db, "orders", orderId);
    const existingSnap = await getDoc(orderDoc);

    const nowIso = new Date().toISOString();
    const statusLabels: Record<OrderStatus, string> = {
      PEDIDO_REALIZADO: "Pedido Realizado",
      PAGAMENTO_CONFIRMADO: "Pagamento Confirmado",
      EM_SEPARACAO: "Em Separação no Estoque",
      ENVIADO: "Enviado / Em Trânsito",
      ENTREGUE: "Entregue ao Destinatário",
      CANCELADO: "Pedido Cancelado",
    };

    const newHistoryEvent = {
      status: newStatus,
      label: statusLabels[newStatus] || newStatus,
      date: nowIso,
      description: note || `Status alterado para ${statusLabels[newStatus] || newStatus}`,
    };

    if (existingSnap.exists()) {
      const orderData = existingSnap.data() as Order;
      const updatedHistory = [...(orderData.statusHistory || []), newHistoryEvent];

      const updatePayload: any = {
        status: newStatus,
        statusHistory: updatedHistory,
      };

      if (trackingCode !== undefined) {
        updatePayload.trackingCode = trackingCode.trim();
      }

      await updateDoc(orderDoc, updatePayload);
      return true;
    } else {
      // Fallback update in local storage
      const local = localStorage.getItem("ndm_user_orders");
      if (local) {
        const list: Order[] = JSON.parse(local);
        const idx = list.findIndex((o) => o.id === orderId);
        if (idx >= 0) {
          list[idx].status = newStatus;
          list[idx].statusHistory = [...(list[idx].statusHistory || []), newHistoryEvent];
          if (trackingCode !== undefined) list[idx].trackingCode = trackingCode.trim();
          localStorage.setItem("ndm_user_orders", JSON.stringify(list));
          return true;
        }
      }
    }
  } catch (error) {
    console.error("Failed to update order status in Firestore:", error);
  }
  return false;
}

/**
 * Admin: Create or update a product in Firestore.
 */
export async function saveProductAdmin(product: Product): Promise<boolean> {
  try {
    const productDoc = doc(db, "products", product.id);
    await setDoc(productDoc, product, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to save product in Firestore:", error);
    return false;
  }
}

/**
 * Admin: Delete a product from Firestore.
 */
export async function deleteProductAdmin(productId: string): Promise<boolean> {
  try {
    const productDoc = doc(db, "products", productId);
    await deleteDoc(productDoc);
    return true;
  } catch (error) {
    console.error("Failed to delete product from Firestore:", error);
    return false;
  }
}

/**
 * Admin: Fetch all discount coupons.
 */
export async function fetchCouponsAdmin(): Promise<Coupon[]> {
  try {
    const couponsRef = collection(db, "coupons");
    const snapshot = await getDocs(couponsRef);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as Coupon);
    }
  } catch (error) {
    console.warn("Error fetching coupons from Firestore:", error);
  }

  return [
    {
      code: "BEMVINDO10",
      description: "10% de desconto na primeira compra",
      discountPercent: 10,
      minOrder: 100,
      active: true,
      usageCount: 42,
    },
    {
      code: "PRESENTE15",
      description: "15% de desconto para compras acima de R$ 250",
      discountPercent: 15,
      minOrder: 250,
      active: true,
      usageCount: 18,
    },
    {
      code: "FRETEGRATIS",
      description: "Frete grátis garantido em todo o site",
      discountValue: 18.9,
      minOrder: 150,
      active: true,
      usageCount: 65,
    },
  ];
}

/**
 * Admin: Save or update coupon.
 */
export async function saveCouponAdmin(coupon: Coupon): Promise<boolean> {
  try {
    const couponDoc = doc(db, "coupons", coupon.code.toUpperCase());
    await setDoc(couponDoc, {
      ...coupon,
      code: coupon.code.toUpperCase(),
      active: coupon.active !== false,
    });
    return true;
  } catch (error) {
    console.error("Failed to save coupon to Firestore:", error);
    return false;
  }
}

/**
 * Admin: Delete coupon.
 */
export async function deleteCouponAdmin(code: string): Promise<boolean> {
  try {
    const couponDoc = doc(db, "coupons", code.toUpperCase());
    await deleteDoc(couponDoc);
    return true;
  } catch (error) {
    console.error("Failed to delete coupon from Firestore:", error);
    return false;
  }
}

/**
 * Helper to generate URL-safe slugs for categories
 */
export function generateCategorySlug(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[&]/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fetch all Categories from Firestore 'categorias' collection
 * Seeds with the 8 official Glos categories if empty on first load.
 */
export async function fetchCategories(): Promise<CategoryInfo[]> {
  try {
    const catRef = collection(db, "categorias");
    const snapshot = await getDocs(catRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d, index) => {
        const data = d.data() as any;
        const nome = (data.nome || data.name || "").trim();
        const slug = data.slug || generateCategorySlug(nome);
        const ativo = data.ativo !== false && data.active !== false;
        const ordem = Number(data.ordem ?? data.order ?? index + 1);
        const item: CategoryInfo = {
          id: d.id,
          nome: nome || d.id,
          name: nome || d.id,
          slug,
          ativo,
          ordem,
          description: data.description || "",
          image: data.image || "",
          itemCount: Number(data.itemCount || 0),
          highlightIconName: data.highlightIconName || "Tag",
          active: ativo,
          order: ordem,
        };
        return item;
      });

      // Sort by display order
      list.sort((a, b) => a.ordem - b.ordem);

      try {
        localStorage.setItem("cached_categorias", JSON.stringify(list));
      } catch (e) {
        console.warn("Could not cache categories:", e);
      }

      return list;
    } else {
      // Collection is empty: seed once with the 8 official Glos categories
      console.log("Categorias vazias no Firestore. Realizando seed das 8 categorias oficiais da Glos...");
      const seededList: CategoryInfo[] = [];

      for (const cat of CATEGORIES) {
        const cleanCat: CategoryInfo = sanitizeForFirestore<CategoryInfo>({
          id: cat.id,
          nome: cat.nome || cat.name || "",
          name: cat.nome || cat.name || "",
          slug: cat.slug || generateCategorySlug(cat.nome || cat.name || ""),
          ativo: cat.ativo !== false,
          ordem: Number(cat.ordem || 1),
          description: cat.description || "",
          image: cat.image || "",
          itemCount: Number(cat.itemCount || 0),
          highlightIconName: cat.highlightIconName || "Tag",
          active: cat.ativo !== false,
          order: Number(cat.ordem || 1),
        });

        try {
          const catDoc = doc(db, "categorias", cleanCat.id);
          await setDoc(catDoc, cleanCat, { merge: true });
        } catch (seedErr) {
          console.warn(`Seed category error for ${cleanCat.id}:`, seedErr);
        }
        seededList.push(cleanCat);
      }

      try {
        localStorage.setItem("cached_categorias", JSON.stringify(seededList));
      } catch (e) {
        console.warn("Could not cache seeded categories:", e);
      }

      return seededList;
    }
  } catch (error) {
    console.warn("Error fetching categorias from Firestore:", error);
  }

  // Fallback to local cache if Firestore is unreachable
  try {
    const cached = localStorage.getItem("cached_categorias");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a: CategoryInfo, b: CategoryInfo) => (a.ordem ?? 0) - (b.ordem ?? 0));
      }
    }
  } catch (err) {
    console.warn("Error reading cached categorias:", err);
  }

  return CATEGORIES;
}

/**
 * Admin: Save or update a category in Firestore 'categorias' collection
 */
export async function saveCategoryAdmin(cat: Partial<CategoryInfo>): Promise<boolean> {
  const nome = (cat.nome || cat.name || "").trim();
  const slug = (cat.slug || generateCategorySlug(nome)).trim();
  const id = cat.id || slug || `cat-${Date.now()}`;
  const ativo = cat.ativo !== false && (cat as any).active !== false;
  const ordem = Number(cat.ordem ?? (cat as any).order ?? 1);

  const cleanCat: CategoryInfo = sanitizeForFirestore<CategoryInfo>({
    id,
    nome: nome || id,
    name: nome || id,
    slug,
    ativo,
    ordem,
    description: cat.description || "",
    image: cat.image || "",
    itemCount: Number(cat.itemCount || 0),
    highlightIconName: cat.highlightIconName || "Tag",
    active: ativo,
    order: ordem,
  });

  // Update local cache immediately
  try {
    const cachedRaw = localStorage.getItem("cached_categorias");
    let list: CategoryInfo[] = cachedRaw ? JSON.parse(cachedRaw) : [...CATEGORIES];
    const exists = list.some((c) => c.id === cleanCat.id);
    list = exists
      ? list.map((c) => (c.id === cleanCat.id ? cleanCat : c))
      : [...list, cleanCat];
    list.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    localStorage.setItem("cached_categorias", JSON.stringify(list));
  } catch (e) {
    console.warn("Local storage cache update warning for categorias:", e);
  }

  try {
    const catDoc = doc(db, "categorias", cleanCat.id);
    await setDoc(catDoc, cleanCat, { merge: true });
    console.log("Categoria salva com sucesso no Firestore:", cleanCat.id);
    return true;
  } catch (error) {
    console.error("Failed to save categoria to Firestore:", error);
    return true; // Cache was updated, ensure UX continues smoothly
  }
}

/**
 * Admin: Delete a category from Firestore 'categorias' collection
 */
export async function deleteCategoryAdmin(categoryId: string): Promise<boolean> {
  try {
    const cachedRaw = localStorage.getItem("cached_categorias");
    if (cachedRaw) {
      const list: CategoryInfo[] = JSON.parse(cachedRaw);
      const filtered = list.filter((c) => c.id !== categoryId);
      localStorage.setItem("cached_categorias", JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Local storage cache delete warning for categorias:", e);
  }

  try {
    const catDoc = doc(db, "categorias", categoryId);
    await deleteDoc(catDoc);
    return true;
  } catch (error) {
    console.error("Failed to delete categoria from Firestore:", error);
    return true;
  }
}

/**
 * Fetch all Collections
 */
export async function fetchCollections(): Promise<ProductCollection[]> {
  try {
    const colRef = collection(db, "collections");
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as ProductCollection);
    }
  } catch (error) {
    console.warn("Error fetching collections from Firestore:", error);
  }

  // Default seed collections if empty
  return [
    {
      id: "colecao-nordica",
      slug: "colecao-nordica",
      name: "Coleção Nórdica Minimalista",
      description: "Linha com tons neutros, materiais naturais e estética escandinava para o lar.",
      image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop",
      featured: true,
    },
    {
      id: "colecao-cafe-artesanal",
      slug: "colecao-cafe-artesanal",
      name: "Coleção Barista & Café Especial",
      description: "Prensas francesas, moedores manuais e copos térmicos em diversas cores.",
      image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop",
      featured: true,
    },
    {
      id: "colecao-gift-box-deluxe",
      slug: "colecao-gift-box-deluxe",
      name: "Coleção Caixas Presenteáveis Deluxe",
      description: "Kits completos e harmonizados para datas marcantes com embalagem de luxo.",
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop",
      featured: true,
    },
    {
      id: "colecao-desk-setup-pro",
      slug: "colecao-desk-setup-pro",
      name: "Coleção Executive Desk & Tech",
      description: "Acessórios de alta produtividade, pads em couro vegano e fones cancelamento de ruído.",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
      featured: false,
    },
  ];
}

/**
 * Admin: Save or update a product collection
 */
export async function saveCollectionAdmin(col: ProductCollection): Promise<boolean> {
  try {
    const colDoc = doc(db, "collections", col.id);
    await setDoc(colDoc, col, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to save collection to Firestore:", error);
    return false;
  }
}

/**
 * Admin: Delete a collection
 */
export async function deleteCollectionAdmin(collectionId: string): Promise<boolean> {
  try {
    const colDoc = doc(db, "collections", collectionId);
    await deleteDoc(colDoc);
    return true;
  } catch (error) {
    console.error("Failed to delete collection from Firestore:", error);
    return false;
  }
}

// Helper to strip undefined fields so Firestore setDoc / updateDoc never rejects
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === "object") {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        clean[key] = sanitizeForFirestore(value);
      }
    }
    return clean as T;
  }
  return data;
}

/**
 * Fetch Hero Banners (Firestore with fallback to localStorage and HERO_CAMPAIGNS)
 */
export async function fetchHeroBanners(): Promise<HeroCampaign[]> {
  try {
    const bannerRef = collection(db, "hero_banners");
    const snapshot = await getDocs(bannerRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as HeroCampaign);
      // Sort by order if available
      const sorted = list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      localStorage.setItem("cached_hero_banners", JSON.stringify(sorted));
      return sorted;
    }
  } catch (error) {
    console.warn("Error fetching hero banners from Firestore:", error);
  }

  // Local storage cache fallback
  try {
    const cached = localStorage.getItem("cached_hero_banners");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading cached hero banners:", err);
  }

  return HERO_CAMPAIGNS;
}

/**
 * Admin: Save Hero Banner
 */
export async function saveHeroBannerAdmin(banner: HeroCampaign): Promise<boolean> {
  const cleanBanner = sanitizeForFirestore<HeroCampaign>({
    ...banner,
    badge: banner.badge || "",
    categoryFilter: banner.categoryFilter || null,
    order: Number(banner.order) || 1,
    active: banner.active !== false,
  });

  // Always update local cache immediately
  try {
    const cachedRaw = localStorage.getItem("cached_hero_banners");
    let list: HeroCampaign[] = cachedRaw ? JSON.parse(cachedRaw) : [...HERO_CAMPAIGNS];
    const exists = list.some((b) => b.id === cleanBanner.id);
    list = exists
      ? list.map((b) => (b.id === cleanBanner.id ? cleanBanner : b))
      : [...list, cleanBanner];
    list.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    localStorage.setItem("cached_hero_banners", JSON.stringify(list));
  } catch (e) {
    console.warn("Local storage cache update warning:", e);
  }

  try {
    const bannerDoc = doc(db, "hero_banners", cleanBanner.id);
    await setDoc(bannerDoc, cleanBanner, { merge: true });
    console.log("Hero banner successfully saved to Firestore:", cleanBanner.id);
    return true;
  } catch (error) {
    console.error("Failed to save hero banner to Firestore:", error);
    // If Firestore fails (e.g. offline), return true if local cache was updated so user workflow is not blocked
    return true;
  }
}

/**
 * Admin: Delete Hero Banner
 */
export async function deleteHeroBannerAdmin(bannerId: string): Promise<boolean> {
  try {
    const cachedRaw = localStorage.getItem("cached_hero_banners");
    if (cachedRaw) {
      const list: HeroCampaign[] = JSON.parse(cachedRaw);
      const filtered = list.filter((b) => b.id !== bannerId);
      localStorage.setItem("cached_hero_banners", JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Local storage cache delete warning:", e);
  }

  try {
    const bannerDoc = doc(db, "hero_banners", bannerId);
    await deleteDoc(bannerDoc);
    return true;
  } catch (error) {
    console.error("Failed to delete hero banner from Firestore:", error);
    return true;
  }
}

/**
 * Fetch Editorial / Showcase Banners (Firestore with fallback to EDITORIAL_BANNERS)
 */
export async function fetchEditorialBanners(): Promise<EditorialBanner[]> {
  try {
    const edRef = collection(db, "editorial_banners");
    const snapshot = await getDocs(edRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => d.data() as EditorialBanner);
      localStorage.setItem("cached_editorial_banners", JSON.stringify(list));
      return list;
    }
  } catch (error) {
    console.warn("Error fetching editorial banners from Firestore:", error);
  }

  try {
    const cached = localStorage.getItem("cached_editorial_banners");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading cached editorial banners:", err);
  }

  return EDITORIAL_BANNERS;
}

/**
 * Admin: Save Editorial Banner
 */
export async function saveEditorialBannerAdmin(banner: EditorialBanner): Promise<boolean> {
  const cleanBanner = sanitizeForFirestore<EditorialBanner>({
    ...banner,
    tag: banner.tag || "",
    subtitle: banner.subtitle || "",
    categorySlug: banner.categorySlug || null,
  });

  try {
    const cachedRaw = localStorage.getItem("cached_editorial_banners");
    let list: EditorialBanner[] = cachedRaw ? JSON.parse(cachedRaw) : [...EDITORIAL_BANNERS];
    const exists = list.some((b) => b.id === cleanBanner.id);
    list = exists
      ? list.map((b) => (b.id === cleanBanner.id ? cleanBanner : b))
      : [...list, cleanBanner];
    localStorage.setItem("cached_editorial_banners", JSON.stringify(list));
  } catch (e) {
    console.warn("Local storage cache update warning:", e);
  }

  try {
    const edDoc = doc(db, "editorial_banners", cleanBanner.id);
    await setDoc(edDoc, cleanBanner, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to save editorial banner to Firestore:", error);
    return true;
  }
}

/**
 * Admin: Delete Editorial Banner
 */
export async function deleteEditorialBannerAdmin(bannerId: string): Promise<boolean> {
  try {
    const cachedRaw = localStorage.getItem("cached_editorial_banners");
    if (cachedRaw) {
      const list: EditorialBanner[] = JSON.parse(cachedRaw);
      const filtered = list.filter((b) => b.id !== bannerId);
      localStorage.setItem("cached_editorial_banners", JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn("Local storage cache delete warning:", e);
  }

  try {
    const edDoc = doc(db, "editorial_banners", bannerId);
    await deleteDoc(edDoc);
    return true;
  } catch (error) {
    console.error("Failed to delete editorial banner from Firestore:", error);
    return true;
  }
}

/**
 * Fetch Marketing & Tracking Settings
 */
export async function fetchMarketingSettings(): Promise<MarketingSettings> {
  const defaults: MarketingSettings = {
    gtmId: "",
    gtmEnabled: false,
    gaMeasurementId: "",
    gaEnabled: false,
    googleAdsId: "",
    googleAdsConversionLabel: "",
    googleAdsEnabled: false,
    metaPixelId: "",
    metaPixelEnabled: false,
    seoTitle: "glos. | Presentes Criativos & Design Autoral",
    seoDescription: "Curadoria autoral de presentes criativos, utilidades para casa, cozinha contemporânea, tecnologia e kits especiais feitos para surpreender.",
    seoKeywords: "presentes criativos, design autoral, kit presente, cafe gourmet, decoracao minimalista",
    ogImage: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1200&auto=format&fit=crop&q=80",
    canonicalUrl: "",
    customHeadScript: "",
    customBodyScript: "",
  };

  try {
    const settingsDoc = doc(db, "store_settings", "marketing");
    const snapshot = await getDoc(settingsDoc);
    if (snapshot.exists()) {
      return { ...defaults, ...(snapshot.data() as MarketingSettings) };
    }
  } catch (error) {
    console.warn("Error fetching marketing settings from Firestore:", error);
  }
  return defaults;
}

/**
 * Admin: Save Marketing & Tracking Settings
 */
export async function saveMarketingSettingsAdmin(settings: MarketingSettings): Promise<boolean> {
  try {
    const settingsDoc = doc(db, "store_settings", "marketing");
    await setDoc(settingsDoc, settings, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to save marketing settings to Firestore:", error);
    return false;
  }
}

/**
 * Fetch Store Operations Settings (Brand, Shipping, Gateways, Policies)
 */
export async function fetchStoreOperationsSettings(): Promise<StoreOperationsSettings> {
  const defaults: StoreOperationsSettings = {
    name: BRAND_CONFIG.name,
    shortName: BRAND_CONFIG.shortName,
    tagline: BRAND_CONFIG.tagline,
    description: BRAND_CONFIG.description,
    cnpj: BRAND_CONFIG.cnpjPlaceholder,
    address: BRAND_CONFIG.addressPlaceholder,
    instagramHandle: BRAND_CONFIG.instagramHandle,
    whatsapp: BRAND_CONFIG.whatsapp,
    whatsappDisplay: BRAND_CONFIG.whatsappDisplay,
    email: BRAND_CONFIG.email,
    phone: BRAND_CONFIG.phone,
    phoneDisplay: BRAND_CONFIG.phoneDisplay,
    openingHours: BRAND_CONFIG.openingHours,
    freeShippingThreshold: BRAND_CONFIG.freeShippingThreshold,
    originCep: "01310-100",
    handlingDays: 1,
    pixDiscountPercentage: BRAND_CONFIG.pixDiscountPercentage,
    pixKey: "00.000.000/0001-00",
    pixReceiverName: BRAND_CONFIG.name,
    pixBankName: "Banco Inter / Nu Pagamentos",
    maxInstallmentsWithoutInterest: BRAND_CONFIG.maxInstallmentsWithoutInterest,
    mercadoPagoMode: "production",
    mercadoPagoPublicKey: "APP_USR-xxxx-xxxx-xxxx",
    announcementBarText: "Frete Grátis para todo o Brasil acima de R$ 249 | 5% OFF no PIX",
    announcementBarEnabled: true,
    returnPolicyDays: 30,
    warrantyDays: 90,
  };

  try {
    const docRef = doc(db, "store_settings", "operations");
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { ...defaults, ...(snapshot.data() as StoreOperationsSettings) };
    }
  } catch (error) {
    console.warn("Error fetching store operations settings from Firestore:", error);
  }
  return defaults;
}

/**
 * Admin: Save Store Operations Settings
 */
export async function saveStoreOperationsSettingsAdmin(settings: StoreOperationsSettings): Promise<boolean> {
  try {
    const docRef = doc(db, "store_settings", "operations");
    await setDoc(docRef, settings, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to save operations settings to Firestore:", error);
    return false;
  }
}

/**
 * Fornecedor Padrão: Fabricação Própria (Glos)
 */
export const DEFAULT_SUPPLIER_FABRICACAO_PROPRIA: Supplier = {
  id: "forn-glos-propria",
  cnpj: "00.000.000/0001-00",
  razaoSocial: "Glos Presentes e Personalizações Ltda",
  nomeFantasia: "Fabricação Própria (Glos)",
  situacaoCadastral: "ATIVA",
  logradouro: "Av. Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  municipio: "São Paulo",
  uf: "SP",
  cep: "01310-100",
  contatoNome: "Atelier Glos",
  contatoWhatsapp: "(11) 98765-4321",
  contatoEmail: "atelier@glos.com.br",
  prazoEntregaDias: 1,
  condicoesPagamento: "Produção Interna",
  observacoes: "Fornecedor padrão para itens produzidos, personalizados ou montados diretamente no atelier Glos.",
  ativo: true,
  isDefaultFabricacaoPropria: true,
  createdAt: new Date().toISOString(),
};

/**
 * Busca todos os fornecedores da coleção `fornecedores` no Firestore.
 * Se vazia, inclui o padrão "Fabricação Própria (Glos)".
 */
export async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const colRef = collection(db, "fornecedores");
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const list = snapshot.docs.map((d) => ({ ...d.data(), id: d.id } as Supplier));
      // Garante que o fornecedor padrão existe na lista
      const hasDefault = list.some((s) => s.id === DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.id || s.isDefaultFabricacaoPropria);
      if (!hasDefault) {
        return [DEFAULT_SUPPLIER_FABRICACAO_PROPRIA, ...list];
      }
      return list;
    }
    // Se a coleção estiver vazia, salva o padrão no Firestore e retorna
    try {
      const defaultDoc = doc(db, "fornecedores", DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.id);
      await setDoc(defaultDoc, DEFAULT_SUPPLIER_FABRICACAO_PROPRIA);
    } catch (seedErr) {
      console.warn("Could not seed default supplier in Firestore:", seedErr);
    }
    return [DEFAULT_SUPPLIER_FABRICACAO_PROPRIA];
  } catch (error) {
    console.warn("Error loading suppliers from Firestore, using local fallback:", error);
    try {
      const local = localStorage.getItem("glos_fornecedores");
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [DEFAULT_SUPPLIER_FABRICACAO_PROPRIA];
  }
}

/**
 * Salva ou atualiza um fornecedor no Firestore (`fornecedores`) e local cache.
 */
export async function saveSupplier(supplier: Supplier): Promise<boolean> {
  try {
    const docRef = doc(db, "fornecedores", supplier.id);
    await setDoc(docRef, { ...supplier, updatedAt: new Date().toISOString() }, { merge: true });
    // Backup local
    try {
      const local = localStorage.getItem("glos_fornecedores");
      const currentList: Supplier[] = local ? JSON.parse(local) : [DEFAULT_SUPPLIER_FABRICACAO_PROPRIA];
      const exists = currentList.findIndex((s) => s.id === supplier.id);
      let updated: Supplier[];
      if (exists >= 0) {
        updated = [...currentList];
        updated[exists] = supplier;
      } else {
        updated = [supplier, ...currentList];
      }
      localStorage.setItem("glos_fornecedores", JSON.stringify(updated));
    } catch {}
    return true;
  } catch (error) {
    console.error("Failed to save supplier to Firestore:", error);
    // Fallback local
    try {
      const local = localStorage.getItem("glos_fornecedores");
      const currentList: Supplier[] = local ? JSON.parse(local) : [DEFAULT_SUPPLIER_FABRICACAO_PROPRIA];
      const exists = currentList.findIndex((s) => s.id === supplier.id);
      let updated: Supplier[];
      if (exists >= 0) {
        updated = [...currentList];
        updated[exists] = supplier;
      } else {
        updated = [supplier, ...currentList];
      }
      localStorage.setItem("glos_fornecedores", JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Remove um fornecedor do Firestore (`fornecedores`).
 */
export async function deleteSupplier(supplierId: string): Promise<boolean> {
  if (supplierId === DEFAULT_SUPPLIER_FABRICACAO_PROPRIA.id) {
    throw new Error("O fornecedor 'Fabricação Própria (Glos)' é o padrão do sistema e não pode ser excluído.");
  }
  try {
    const docRef = doc(db, "fornecedores", supplierId);
    await deleteDoc(docRef);
    try {
      const local = localStorage.getItem("glos_fornecedores");
      if (local) {
        const currentList: Supplier[] = JSON.parse(local);
        const filtered = currentList.filter((s) => s.id !== supplierId);
        localStorage.setItem("glos_fornecedores", JSON.stringify(filtered));
      }
    } catch {}
    return true;
  } catch (error) {
    console.error("Failed to delete supplier from Firestore:", error);
    try {
      const local = localStorage.getItem("glos_fornecedores");
      if (local) {
        const currentList: Supplier[] = JSON.parse(local);
        const filtered = currentList.filter((s) => s.id !== supplierId);
        localStorage.setItem("glos_fornecedores", JSON.stringify(filtered));
        return true;
      }
    } catch {}
    return false;
  }
}

/**
 * Consulta CNPJ através da API do servidor com fallback BrasilAPI/ReceitaWS.
 */
export async function lookupCnpj(cnpj: string): Promise<{ success: boolean; data?: Partial<Supplier>; error?: string }> {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) {
    return { success: false, error: "CNPJ deve conter 14 dígitos numéricos." };
  }

  try {
    const res = await fetch(`/api/cnpj/${cleaned}`);
    const json = await res.json();
    if (res.ok && json.success && json.data) {
      return { success: true, data: json.data };
    }
    return {
      success: false,
      error: json.error || "Não foi possível localizar os dados deste CNPJ automaticamente.",
    };
  } catch (err: any) {
    console.warn("Client CNPJ lookup error:", err);
    return {
      success: false,
      error: "Falha de conexão com os serviços de consulta de CNPJ. Preencha os campos manualmente.",
    };
  }
}




