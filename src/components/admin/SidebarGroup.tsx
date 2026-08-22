import React from "react";

interface SidebarGroupProps {
  label: string;
  children: React.ReactNode;
  isCollapsed?: boolean;
}

/**
 * Grupo de navegação na Sidebar do Painel glos.
 * Rótulo pequeno em maiúsculas cinza (#9B998F), com espaçamento rítmico.
 */
export const SidebarGroup: React.FC<SidebarGroupProps> = ({
  label,
  children,
  isCollapsed = false,
}) => {
  return (
    <div className="mb-4">
      {!isCollapsed && (
        <h3 className="px-3 mb-1 text-[11px] font-medium uppercase tracking-wider text-[#9B998F] select-none">
          {label}
        </h3>
      )}
      {isCollapsed && (
        <div className="h-px bg-[#D6D3CC] mx-3 my-2" title={label} />
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
};
