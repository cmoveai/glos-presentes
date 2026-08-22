import React, { useState } from "react";
import { LucideIcon, ChevronDown, ChevronRight } from "lucide-react";

export interface SubMenuItem {
  id: string;
  label: string;
  badge?: string | number;
}

interface SidebarItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  subItems?: SubMenuItem[];
  activeSubId?: string;
  badge?: string | number;
  isCollapsed?: boolean;
  onSelect: (id: string, subId?: string) => void;
}

/**
 * Item individual da Sidebar glos.
 * Estado ativo: fundo cobalt suave rgba(0,74,173,0.08) + texto/ícone cobalt (#004AAD).
 * Suporte a accordion para submenus hierárquicos.
 */
export const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  label,
  icon: Icon,
  active = false,
  subItems,
  activeSubId,
  badge,
  isCollapsed = false,
  onSelect,
}) => {
  const hasSubItems = subItems && subItems.length > 0;
  const isParentActive = active || (hasSubItems && subItems.some((s) => s.id === activeSubId));
  const [isOpen, setIsOpen] = useState(isParentActive);

  const handleClick = () => {
    if (hasSubItems) {
      setIsOpen(!isOpen);
      if (!isOpen && subItems[0]) {
        onSelect(id, subItems[0].id);
      }
    } else {
      onSelect(id);
    }
  };

  return (
    <div className="mb-0.5">
      <button
        onClick={handleClick}
        title={isCollapsed ? label : undefined}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-[6px] text-[13px] transition-colors text-left select-none ${
          isParentActive && !hasSubItems
            ? "bg-[rgba(0,74,173,0.08)] text-[#004AAD] font-medium"
            : isParentActive && hasSubItems
            ? "text-[#004AAD] font-medium hover:bg-[#EEEDE8]"
            : "text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] font-normal"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`w-4 h-4 shrink-0 ${
              isParentActive ? "text-[#004AAD]" : "text-[#6B6A64]"
            }`}
          />
          {!isCollapsed && <span className="truncate">{label}</span>}
        </div>

        {!isCollapsed && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {badge !== undefined && (
              <span className="text-[11px] font-normal tabular-nums px-1.5 py-0.2 rounded bg-[#EEEDE8] text-[#6B6A64]">
                {badge}
              </span>
            )}
            {hasSubItems && (
              <span className="text-[#9B998F]">
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Subitens em cascata */}
      {hasSubItems && isOpen && !isCollapsed && (
        <div className="ml-5 pl-2.5 mt-0.5 mb-1 border-l border-[#D6D3CC] space-y-0.5">
          {subItems.map((sub) => {
            const isSubActive = activeSubId === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => onSelect(id, sub.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[4px] text-xs transition-colors text-left ${
                  isSubActive
                    ? "bg-[rgba(0,74,173,0.08)] text-[#004AAD] font-medium"
                    : "text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] font-normal"
                }`}
              >
                <span className="truncate">{sub.label}</span>
                {sub.badge !== undefined && (
                  <span className="text-[10px] font-normal tabular-nums px-1 py-0.2 rounded bg-[#EEEDE8] text-[#6B6A64]">
                    {sub.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
