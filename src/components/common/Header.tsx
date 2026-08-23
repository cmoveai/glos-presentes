import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  ShieldCheck,
  Truck,
  CreditCard,
  Phone,
  ChevronDown,
  Sparkles,
  Gift,
  Flame,
  Percent,
} from "lucide-react";
import { BRAND_CONFIG } from "../../config/brand";
import { useCart } from "../../context/CartContext";
import { useFavorites } from "../../context/FavoritesContext";
import { useAuth } from "../../context/AuthContext";
import { PRODUCTS } from "../../data/products";
import { CATEGORIES } from "../../data/categories";
import { OCCASIONS } from "../../data/occasions";
import { ProductCategory, ProductOccasion } from "../../types";
import { BrandLogo } from "../admin/BrandLogo";

interface HeaderProps {
  onNavigateHome: () => void;
  onNavigateCatalog: (category?: ProductCategory, occasion?: ProductOccasion, tag?: string, search?: string) => void;
  onNavigateProduct: (slug: string) => void;
  onNavigateFavorites: () => void;
  onNavigateAccount: (tab?: "profile" | "orders" | "addresses" | "favorites") => void;
  onNavigateCart: () => void;
  onNavigateAdmin?: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateHome,
  onNavigateCatalog,
  onNavigateProduct,
  onNavigateFavorites,
  onNavigateAccount,
  onNavigateCart,
  onNavigateAdmin,
  onOpenAuthModal,
}) => {
  const { itemCount, openCart } = useCart();
  const { favoritesCount } = useFavorites();
  const { user, isAuthenticated, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOccasionsDropdownOpen, setIsOccasionsDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Live search suggestions
  const searchSuggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery]);

  // Click outside search container to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      setIsMobileMenuOpen(false);
      onNavigateCatalog(undefined, undefined, undefined, searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-stone-950 text-stone-200 text-xs py-2 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto no-scrollbar whitespace-nowrap text-[11px] sm:text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Entrega expressa para todo o Brasil</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Compra 100% segura e protegida</span>
            </span>
            <span className="hidden lg:flex items-center gap-1.5 font-medium">
              <CreditCard className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Até {BRAND_CONFIG.maxInstallmentsWithoutInterest}x sem juros no cartão</span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`https://wa.me/${BRAND_CONFIG.whatsapp}?text=Olá!%20Gostaria%20de%20tirar%20uma%20dúvida%20sobre%20a%20loja.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] sm:text-xs text-stone-300 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>WhatsApp: {BRAND_CONFIG.whatsappDisplay}</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Logo, Search, Action Icons) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Mobile Menu Trigger & Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Abrir menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* BRAND LOGO */}
            <button
              onClick={onNavigateHome}
              className="flex items-center text-left group focus:outline-none py-1"
              aria-label="Ir para a página inicial"
            >
              <BrandLogo size="header" />
            </button>
          </div>

          {/* BROAD & SMART SEARCH BAR (Desktop) */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-xl relative">
            <form onSubmit={handleSearchSubmit} className="w-full relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Busque por presentes, kits, café, tecnologia, decoração..."
                className="w-full pl-10 pr-10 py-2.5 bg-stone-100/90 hover:bg-stone-100 focus:bg-white text-stone-900 placeholder-stone-600 text-xs sm:text-sm rounded-full border border-stone-200 focus:border-stone-900 focus:outline-none transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="w-5 h-5 rounded-full bg-stone-300 hover:bg-stone-400 text-stone-700 flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </form>

            {/* Live Autocomplete Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {searchQuery.trim().length > 0 ? (
                  <div>
                    <div className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
                      Resultados correspondentes ({searchSuggestions.length})
                    </div>
                    {searchSuggestions.length > 0 ? (
                      <div className="space-y-2">
                        {searchSuggestions.map((prod) => (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              setIsSearchFocused(false);
                              onNavigateProduct(prod.slug);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 transition-colors text-left"
                          >
                            <img
                              src={prod.images[0]}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-stone-900 truncate">
                                {prod.name}
                              </p>
                              <p className="text-[11px] text-stone-600">
                                {prod.categoryName} • R${" "}
                                {(prod.promotionalPrice ?? prod.price).toFixed(2)}
                              </p>
                            </div>
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="w-full text-center py-2 text-xs font-semibold text-stone-900 hover:bg-stone-100 rounded-lg transition-colors mt-2"
                        >
                          Ver todos os resultados para "{searchQuery}"
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-stone-600 py-3 text-center">
                        Nenhum produto encontrado com esse termo.
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5">
                      Buscas mais populares
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Prensa Francesa",
                        "Kits Presenteáveis",
                        "Fone Bluetooth",
                        "Garrafa Térmica",
                        "Luminária LED",
                        "Café Especial",
                        "Velas Aromáticas",
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setSearchQuery(tag);
                            setIsSearchFocused(false);
                            onNavigateCatalog(undefined, undefined, undefined, tag);
                          }}
                          className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-xs font-medium transition-colors"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ACTION BUTTONS (Wishlist, Account, Cart) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Wishlist */}
            <button
              id="header-wishlist-btn"
              type="button"
              onClick={onNavigateFavorites}
              className="relative p-2.5 rounded-xl hover:bg-stone-100 text-stone-700 hover:text-stone-950 transition-colors flex items-center gap-1.5"
              title="Meus Favoritos"
            >
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {favoritesCount}
                </span>
              )}
              <span className="hidden xl:inline text-xs font-medium">Favoritos</span>
            </button>

            {/* Account / Login */}
            <div className="relative">
              {isAuthenticated ? (
                <button
                  id="header-account-btn"
                  type="button"
                  onClick={() => setIsAccountDropdownOpen((p) => !p)}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-stone-100 text-stone-700 hover:text-stone-950 transition-colors flex items-center gap-2 text-xs font-medium"
                >
                  <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
                    {user?.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:flex flex-col text-left">
                    <span className="text-[10px] text-stone-600 leading-none">Olá,</span>
                    <span className="font-semibold text-stone-900 leading-tight truncate max-w-[100px]">
                      {user?.name.split(" ")[0]}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 hidden lg:block text-stone-600" />
                </button>
              ) : (
                <button
                  id="header-login-btn"
                  type="button"
                  onClick={onOpenAuthModal}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl hover:bg-stone-100 text-stone-700 hover:text-stone-950 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                >
                  <User className="w-5 h-5 text-stone-700" />
                  <span className="hidden lg:inline">Entrar / Cadastrar</span>
                </button>
              )}

              {/* Account Dropdown */}
              {isAccountDropdownOpen && isAuthenticated && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      onNavigateAccount("overview");
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 font-medium"
                  >
                    Meu Painel Geral
                  </button>
                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      onNavigateAccount("orders");
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 font-medium"
                  >
                    Meus Pedidos & Rastreio
                  </button>
                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      onNavigateAccount("addresses");
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 font-medium"
                  >
                    Meus Endereços
                  </button>
                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      onNavigateAccount("profile");
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-stone-700 hover:bg-stone-100 font-medium"
                  >
                    Dados da Conta
                  </button>
                  <div className="my-1 border-t border-stone-100" />
                  <button
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium"
                  >
                    Sair da Conta
                  </button>
                </div>
              )}
            </div>

            {/* Cart Trigger */}
            <button
              id="header-cart-btn"
              type="button"
              onClick={onNavigateCart}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white transition-colors flex items-center gap-2 shadow-xs"
              title="Ver Carrinho de Compras"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-amber-400 text-stone-950 text-[10px] font-black rounded-full flex items-center justify-center px-1">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-semibold">Carrinho</span>
            </button>
          </div>
        </div>

        {/* Search for mobile view */}
        <div className="mt-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="O que você está procurando hoje?"
              className="w-full pl-9 pr-8 py-2 bg-stone-100 text-stone-900 placeholder-stone-600 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-stone-900"
            />
            <Search className="w-4 h-4 text-stone-600 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
        </div>
      </div>

      {/* 3. CATEGORY NAVIGATION BAR (Desktop) */}
      <nav className="hidden lg:block border-t border-stone-100 bg-stone-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <ul className="flex items-center gap-1 text-xs font-semibold text-stone-700 py-1">
            <li>
              <button
                onClick={() => onNavigateCatalog("presentes-criativos")}
                className="px-3 py-2 rounded-lg hover:bg-stone-200/70 hover:text-stone-950 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-stone-900" />
                <span>Presentes</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateCatalog("cozinha")}
                className="px-3 py-2 rounded-lg hover:bg-stone-200/70 hover:text-stone-950 transition-colors"
              >
                Cozinha & Mesa
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateCatalog("eletronicos")}
                className="px-3 py-2 rounded-lg hover:bg-stone-200/70 hover:text-stone-950 transition-colors"
              >
                Eletrônicos & Tech
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateCatalog("casa-utilidades")}
                className="px-3 py-2 rounded-lg hover:bg-stone-200/70 hover:text-stone-950 transition-colors"
              >
                Casa & Utilidades
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateCatalog("kits-presenteaveis")}
                className="px-3 py-2 rounded-lg hover:bg-stone-200/70 hover:text-stone-950 transition-colors flex items-center gap-1"
              >
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-900">Kits Presenteáveis</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateCatalog("copos-garrafas")}
                className="px-3 py-2 rounded-lg hover:bg-stone-200/70 hover:text-stone-950 transition-colors"
              >
                Copos & Garrafas
              </button>
            </li>

            {/* Ocasiões Dropdown */}
            <li className="relative">
              <button
                onClick={() => setIsOccasionsDropdownOpen((p) => !p)}
                className="px-3 py-2 rounded-lg hover:bg-stone-200/70 hover:text-stone-950 transition-colors flex items-center gap-1"
              >
                <span>Por Ocasião</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-600" />
              </button>

              {isOccasionsDropdownOpen && (
                <div
                  onMouseLeave={() => setIsOccasionsDropdownOpen(false)}
                  className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-stone-200 p-2 z-50 grid grid-cols-1 gap-1 animate-in fade-in duration-150"
                >
                  {OCCASIONS.map((occ) => (
                    <button
                      key={occ.id}
                      onClick={() => {
                        setIsOccasionsDropdownOpen(false);
                        onNavigateCatalog(undefined, occ.id);
                      }}
                      className="text-left px-3 py-2 rounded-lg hover:bg-stone-100 text-xs font-medium text-stone-800 transition-colors flex items-center justify-between"
                    >
                      <span>{occ.name}</span>
                      <span className="text-[10px] text-stone-600">Ver presentes</span>
                    </button>
                  ))}
                </div>
              )}
            </li>

            <li>
              <button
                onClick={() => onNavigateCatalog("novidades")}
                className="px-3 py-2 rounded-lg hover:bg-stone-200/70 hover:text-stone-950 transition-colors flex items-center gap-1 text-emerald-700"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Novidades</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigateCatalog(undefined, undefined, "ofertas")}
                className="px-3 py-2 rounded-lg hover:bg-rose-100 text-rose-700 transition-colors flex items-center gap-1 font-bold"
              >
                <Percent className="w-3.5 h-3.5" />
                <span>Ofertas</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* 4. MOBILE DRAWER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
          />
          <div className="relative w-4/5 max-w-sm h-full bg-white shadow-2xl flex flex-col p-5 overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-stone-200">
              <BrandLogo size="sm" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-stone-500 hover:text-stone-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="py-4 space-y-1">
              <div className="text-xs font-bold text-stone-600 uppercase tracking-wider px-2 mb-2">
                Categorias Principais
              </div>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateCatalog(cat.id);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-stone-100 text-sm font-medium text-stone-800 flex items-center justify-between"
                >
                  <span>{cat.name}</span>
                  <span className="text-xs text-stone-600">{cat.itemCount} itens</span>
                </button>
              ))}
            </div>

            <div className="py-4 border-t border-stone-200 space-y-1">
              <div className="text-xs font-bold text-stone-600 uppercase tracking-wider px-2 mb-2">
                Presentes por Ocasião
              </div>
              {OCCASIONS.slice(0, 5).map((occ) => (
                <button
                  key={occ.id}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateCatalog(undefined, occ.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-xs font-medium text-stone-700"
                >
                  {occ.name}
                </button>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-stone-200 space-y-2">
              <div className="text-xs text-stone-500 mb-1">Atendimento WhatsApp</div>
              <a
                href={`https://wa.me/${BRAND_CONFIG.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>{BRAND_CONFIG.whatsappDisplay}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
