import React, { useState, useEffect } from "react";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { CartProvider } from "./context/CartContext";

// Global Components
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { CartDrawer } from "./components/common/CartDrawer";
import { QuickViewModal } from "./components/common/QuickViewModal";
import { AuthModal } from "./components/common/AuthModal";
import { ExitIntentModal } from "./components/common/ExitIntentModal";

// Pages
import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { AccountPage } from "./pages/AccountPage";
import { StaticPages } from "./pages/StaticPages";
import { AdminPage } from "./pages/AdminPage";
import { AppShell } from "./components/admin/AppShell";

import { Product, ProductCategory, ProductOccasion } from "./types";
import { BRAND_CONFIG } from "./config/brand";
import { MessageCircle, LayoutDashboard } from "lucide-react";
import { getMarketingSettings } from "./services/api";
import { applyMarketingAndTracking } from "./services/marketing";

type PageRoute =
  | { name: "home" }
  | {
      name: "catalog";
      category?: ProductCategory;
      occasion?: ProductOccasion;
      tag?: string;
      search?: string;
    }
  | { name: "product"; slug: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "account"; tab?: "overview" | "orders" | "favorites" | "addresses" | "profile" | "coupons" | "help" }
  | { name: "admin" }
  | {
      name: "static";
      pageId: "sobre" | "trocas" | "privacidade" | "termos" | "ajuda" | "entregas" | "pagamentos";
    };

function parseRouteFromLocation(): PageRoute {
  try {
    const rawHash = window.location.hash.replace(/^#\/?/, "");
    const hash = rawHash.toLowerCase();
    const searchParams = new URLSearchParams(window.location.search);
    const pageParam = searchParams.get("page")?.toLowerCase();

    if (hash === "admin" || hash.startsWith("admin") || pageParam === "admin") {
      return { name: "admin" };
    }
    if (hash.startsWith("product/")) {
      const slug = rawHash.replace(/^product\//i, "");
      if (slug) return { name: "product", slug };
    }
    if (hash === "cart" || hash === "carrinho" || pageParam === "cart" || pageParam === "carrinho") {
      return { name: "cart" };
    }
    if (hash === "checkout" || pageParam === "checkout") {
      return { name: "checkout" };
    }
    if (hash === "catalog" || pageParam === "catalog") {
      return { name: "catalog" };
    }
    if (
      hash.startsWith("account") ||
      hash.startsWith("minha-conta") ||
      hash.startsWith("pedidos") ||
      hash.startsWith("conta") ||
      pageParam === "account" ||
      pageParam === "minha-conta" ||
      pageParam === "pedidos"
    ) {
      const tab = hash.includes("profile") ? "profile" : "orders";
      return { name: "account", tab };
    }
    // Default to admin view for Glos Painel do Lojista unless storefront requested
    if (pageParam === "loja" || hash === "loja" || hash === "home" || hash === "") {
      return { name: "home" };
    }
    return { name: "admin" };
  } catch (e) {
    console.error("Route parsing error:", e);
  }
  return { name: "admin" };
}

function AppContent() {
  const [route, setRoute] = useState<PageRoute>(() => parseRouteFromLocation());
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync route on hash change (back/forward or manual hash change)
  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseRouteFromLocation());
    };
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);
    return () => {
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, []);

  // Initialize Marketing & Tracking (GTM, GA4, Ads, Meta, SEO)
  useEffect(() => {
    async function initMarketing() {
      try {
        const settings = await getMarketingSettings();
        if (settings) {
          applyMarketingAndTracking(settings);
        }
      } catch (err) {
        console.warn("Could not initialize marketing settings:", err);
      }
    }
    initMarketing();
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route]);

  const navigateTo = (newRoute: PageRoute) => {
    setRoute(newRoute);
    try {
      if (newRoute.name === "admin") {
        localStorage.setItem("ativva_admin_active", "true");
        window.location.hash = "admin";
      } else {
        localStorage.removeItem("ativva_admin_active");
        if (newRoute.name === "home") {
          if (window.location.hash) window.location.hash = "";
        } else if (newRoute.name === "cart") {
          window.location.hash = "carrinho";
        } else if (newRoute.name === "checkout") {
          window.location.hash = "checkout";
        } else if (newRoute.name === "account") {
          window.location.hash = "account";
        } else if (newRoute.name === "catalog") {
          window.location.hash = "catalog";
        } else if (newRoute.name === "product") {
          window.location.hash = `product/${newRoute.slug}`;
        } else if (newRoute.name === "static") {
          window.location.hash = `static/${newRoute.pageId}`;
        }
      }
    } catch (e) {
      // Ignore hash update failure if in sandboxed iframe
    }
  };

  const handleNavigateHome = () => {
    navigateTo({ name: "home" });
  };

  const handleNavigateCatalog = (
    category?: ProductCategory,
    occasion?: ProductOccasion,
    tag?: string,
    search?: string
  ) => {
    navigateTo({
      name: "catalog",
      category,
      occasion,
      tag,
      search,
    });
  };

  const handleNavigateProduct = (slug: string) => {
    navigateTo({ name: "product", slug });
  };

  const handleNavigateCart = () => {
    navigateTo({ name: "cart" });
  };

  const handleNavigateCheckout = () => {
    navigateTo({ name: "checkout" });
  };

  const handleNavigateAccount = (tab?: "overview" | "orders" | "favorites" | "addresses" | "profile" | "coupons" | "help") => {
    navigateTo({ name: "account", tab });
  };

  const handleNavigateAdmin = () => {
    navigateTo({ name: "admin" });
  };

  const handleNavigateStatic = (
    pageId: "sobre" | "trocas" | "privacidade" | "termos" | "ajuda" | "entregas" | "pagamentos"
  ) => {
    navigateTo({ name: "static", pageId });
  };

  if (route.name === "admin") {
    return <AppShell onOpenStorefront={() => navigateTo({ name: "home" })} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-100/50 text-stone-900 font-sans selection:bg-stone-900 selection:text-white">
      {/* GLOBAL HEADER */}
      <Header
        onNavigateHome={handleNavigateHome}
        onNavigateCatalog={handleNavigateCatalog}
        onNavigateProduct={handleNavigateProduct}
        onNavigateFavorites={() => handleNavigateAccount("favorites")}
        onNavigateAccount={handleNavigateAccount}
        onNavigateCart={handleNavigateCart}
        onNavigateAdmin={handleNavigateAdmin}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* MAIN VIEW ROUTING */}
      <main className="flex-1">
        {route.name === "home" && (
          <HomePage
            onNavigateCatalog={handleNavigateCatalog}
            onNavigateProduct={handleNavigateProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {route.name === "catalog" && (
          <CatalogPage
            key={`${route.category}-${route.occasion}-${route.tag}-${route.search}`}
            initialCategory={route.category}
            initialOccasion={route.occasion}
            initialTag={route.tag}
            initialSearch={route.search}
            onNavigateProduct={handleNavigateProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {route.name === "product" && (
          <ProductDetailPage
            key={route.slug}
            slug={route.slug}
            onNavigateProduct={handleNavigateProduct}
            onNavigateCheckout={handleNavigateCheckout}
            onNavigateCatalog={handleNavigateCatalog}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {route.name === "cart" && (
          <CartPage
            onNavigateHome={handleNavigateHome}
            onNavigateCatalog={() => handleNavigateCatalog()}
            onNavigateProduct={handleNavigateProduct}
            onNavigateCheckout={handleNavigateCheckout}
            onQuickView={(p) => setQuickViewProduct(p)}
          />
        )}

        {route.name === "checkout" && (
          <CheckoutPage
            onNavigateHome={handleNavigateHome}
            onNavigateCatalog={() => handleNavigateCatalog()}
            onNavigateAccount={handleNavigateAccount}
          />
        )}

        {route.name === "account" && (
          <AccountPage
            key={route.tab || "overview"}
            initialTab={route.tab}
            onNavigateCatalog={() => handleNavigateCatalog()}
            onNavigateProduct={handleNavigateProduct}
            onQuickView={(p) => setQuickViewProduct(p)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {route.name === "static" && (
          <StaticPages
            key={route.pageId}
            pageId={route.pageId}
            onNavigateCatalog={() => handleNavigateCatalog()}
          />
        )}
      </main>

      {/* GLOBAL FOOTER */}
      <Footer
        onNavigateStaticPage={handleNavigateStatic}
        onNavigateCatalog={(cat) => handleNavigateCatalog(cat)}
        onNavigateAdmin={handleNavigateAdmin}
      />

      {/* GLOBAL CART DRAWER */}
      <CartDrawer
        onNavigateToCheckout={handleNavigateCheckout}
        onNavigateToCart={handleNavigateCart}
        onNavigateToCatalog={() => handleNavigateCatalog()}
      />

      {/* QUICK VIEW MODAL */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onNavigateProduct={handleNavigateProduct}
      />

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* AI EXIT INTENT RESCUE MODAL */}
      <ExitIntentModal
        onProceedToCheckout={handleNavigateCheckout}
      />

      {/* FLOATING ADMIN QUICK ACCESS (VISIBLE FOR STORE OWNER) */}
      <button
        onClick={handleNavigateAdmin}
        className="fixed bottom-6 left-6 z-40 px-3.5 py-2 rounded-full bg-[#004AAD] text-white border border-[#004AAD] shadow-md flex items-center gap-2 text-xs font-medium transition-all hover:bg-[#003884]"
        title="Acessar Painel do Lojista"
      >
        <LayoutDashboard className="w-3.5 h-3.5" />
        <span>Painel do Lojista (glos.)</span>
      </button>

      {/* FLOATING WHATSAPP BUTTON */}
      <a
        href={`https://wa.me/${BRAND_CONFIG.whatsapp}?text=Ol%C3%A1!%20Gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20um%20presente%20na%20${encodeURIComponent(
          BRAND_CONFIG.name
        )}.`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 w-13 h-13 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all hover:scale-108 group border-2 border-white"
        aria-label="Atendimento via WhatsApp"
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        <span className="absolute right-full mr-3 bg-stone-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          Fale Conosco no WhatsApp
        </span>
      </a>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <FavoritesProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

