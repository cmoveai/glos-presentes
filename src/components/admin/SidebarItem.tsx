import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export interface SidebarItemProps {
  id?: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string | number;
  badgeType?: "count" | "ia" | "zapi" | "dre" | "novo" | "alerta";
  hasSubmenu?: boolean;
  isOpen?: boolean;
  onToggleSubmenu?: () => void;
  collapsed?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  icon,
  label,
  active,
  onClick,
  badge,
  badgeType = "count",
  hasSubmenu,
  isOpen,
  onToggleSubmenu,
  collapsed,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case "ia":
        return "bg-[#EDF1FF] text-[#2E5BFF] border-[#BFDBFE]";
      case "zapi":
        return "bg-[#D1FAE5] text-[#047857] border-[#A7F3D0]";
      case "dre":
        return "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]";
      case "alerta":
        return "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]";
      case "novo":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-stone-100 text-[#5B6270] border-stone-200";
    }
  };

  return (
    <div className="w-full">
      <button
        id={id}
        type="button"
        onClick={() => {
          onClick();
          if (hasSubmenu && onToggleSubmenu) {
            onToggleSubmenu();
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
          active
            ? "bg-[#EDF1FF] text-[#2E5BFF] font-semibold"
            : "text-[#5B6270] hover:text-[#1A1F27] hover:bg-[#F1F3F6]"
        } ${collapsed ? "justify-center px-2" : ""}`}
        title={label}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`shrink-0 ${active ? "text-[#2E5BFF]" : "text-[#8A8F98] group-hover:text-[#5B6270]"}`}>
            {icon}
          </span>
          {!collapsed && <span className="truncate">{label}</span>}
        </div>

        {!collapsed && (
          <div className="flex items-center gap-1.5 shrink-0">
            {badge !== undefined && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${getBadgeStyle()}`}
              >
                {badge}
              </span>
            )}
            {hasSubmenu && (
              <span className="text-[#8A8F98]">
                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
};
