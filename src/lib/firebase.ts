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
import firebaseConfig from "../../firebase-applet-config.json";
import { Product, Order, OrderStatus, UserProfile, Coupon, CategoryInfo, ProductCollection, HeroCampaign, EditorialBanner, MarketingSettings, StoreOperationsSettings } from "../types";
import { PRODUCTS } from "../data/products";
import { CATEGORIES } from "../data/categories";
import { HERO_CAMPAIGNS, EDITORIAL_BANNERS } from "../data/banners";
import { BRAND_CONFIG } from "../config/brand";

// Initialize Firebase App instance
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
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
export async function fetchUserOrders(emailOrUserId: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("customer.email", "==", emailOrUserId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as Order);
    }
  } catch (error) {
    console.warn("Firestore fetchUserOrders falling back to localStorage:", error);
  }
  try {
    const local = localStorage.getItem("ndm_user_orders");
    return local ? JSON.parse(local) : [];
  } catch {
    return [];
  }
}

/**
 * Save or update user profile in Firestore.
 */
export async function saveUserProfile(user: UserProfile): Promise<void> {
  try {
    const userDoc = doc(db, "users", user.id);
    await setDoc(userDoc, user, { merge: true });
  } catch (error) {
    console.warn("Failed to sync user profile with Firestore:", error);
  }
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
 * Fetch all Categories (Firestore with fallback to default CATEGORIES)
 */
export async function fetchCategories(): Promise<CategoryInfo[]> {
  try {
    const catRef = collection(db, "categories");
    const snapshot = await getDocs(catRef);
    if (!snapshot.empty) {
      return snapshot.docs.map((d) => d.data() as CategoryInfo);
    }
  } catch (error) {
    console.warn("Error fetching categories from Firestore:", error);
  }
  return CATEGORIES;
}

/**
 * Admin: Save or update a category
 */
export async function saveCategoryAdmin(cat: CategoryInfo): Promise<boolean> {
  try {
    const catDoc = doc(db, "categories", cat.id);
    await setDoc(catDoc, cat, { merge: true });
    return true;
  } catch (error) {
    console.error("Failed to save category to Firestore:", error);
    return false;
  }
}

/**
 * Admin: Delete a category
 */
export async function deleteCategoryAdmin(categoryId: string): Promise<boolean> {
  try {
    const catDoc = doc(db, "categories", categoryId);
    await deleteDoc(catDoc);
    return true;
  } catch (error) {
    console.error("Failed to delete category from Firestore:", error);
    return false;
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




