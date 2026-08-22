import React, { useState } from "react";
import {
  Menu,
  RefreshCw,
  Bell,
  ExternalLink,
  Check,
  Store,
} from "lucide-react";
import { BRAND_CONFIG } from "../../config/brand";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMobileMenu?: () => void;
  onOpenStorefront?: () => void;
  onSync?: () => void;
}

/**
 * Topbar Oficial do Painel do Lojista glos.
 * Fundo #E4E2DD, borda inferior #D6D3CC.
 * Título + subtítulo, ações rápidas e acesso à loja.
 */
export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  onOpenMobileMenu,
  onOpenStorefront,
  onSync,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSyncClick = () => {
    setIsSyncing(true);
    if (onSync) onSync();
    setTimeout(() => {
      setIsSyncing(false);
    }, 800);
  };

  return (
    <header className="h-16 px-4 lg:px-8 bg-[#E4E2DD] border-b border-[#D6D3CC] flex items-center justify-between shrink-0 select-none z-20">
      {/* Lado Esquerdo: Mobile Trigger + Título e Subtítulo */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-medium text-[#272727] truncate leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs font-normal text-[#6B6A64] truncate leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Lado Direito: Sincronizar, Notificações, Nome da Loja, Botão Ver Loja */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Botão Sincronizar */}
        <button
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-[6px] text-xs font-medium text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors border border-[#D6D3CC]"
          title="Sincronizar dados com Firestore"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-[#004AAD]" : "text-[#6B6A64]"}`}
          />
          <span className="hidden sm:inline">
            {isSyncing ? "Sincronizando..." : "Sincronizar"}
          </span>
        </button>

        {/* Sino de Notificações */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-[6px] text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] transition-colors relative border border-[#D6D3CC]"
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#004AAD]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] p-3 text-xs z-50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#D6D3CC]">
                <span className="font-medium text-[#272727]">Notificações</span>
                <span className="text-[10px] text-[#9B998F]">Atualizado agora</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-[6px] bg-[#EEEDE8]">
                  <p className="text-[#272727] font-medium">Novo pedido recebido</p>
                  <p className="text-[#6B6A64] text-[11px]">Kit Mimo Afetivo com cartão personalizado.</p>
                </div>
                <div className="p-2 rounded-[6px] bg-[#EEEDE8]">
                  <p className="text-[#272727] font-medium">Foto UGC aprovada</p>
                  <p className="text-[#6B6A64] text-[11px]">Cliente enviou unboxing no Instagram.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Badge do Nome da Loja */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#EEEDE8] border border-[#D6D3CC] text-xs text-[#272727]">
          <Store className="w-3.5 h-3.5 text-[#6B6A64]" />
          <span className="font-medium">{BRAND_CONFIG.displayName}</span>
        </div>

        {/* Botão Primário "Ver Loja" */}
        <button
          onClick={onOpenStorefront}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-[#004AAD] text-white text-xs font-medium hover:bg-[#003884] transition-colors"
        >
          <span>Ver Loja</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
