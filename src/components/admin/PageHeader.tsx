import React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  className?: string;
}

/**
 * Cabeçalho de página padrão do Painel do Lojista glos.
 * Hierarquia visual baseada em escala e espaço, sem negrito pesado.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = "",
}) => {
  return (
    <div className={`mb-6 lg:mb-8 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-1.5 text-xs text-[#9B998F] mb-2">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-[#D6D3CC]">/</span>}
              <span className={idx === breadcrumbs.length - 1 ? "text-[#6B6A64]" : "hover:text-[#272727]"}>
                {crumb.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#272727] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm font-normal text-[#6B6A64] max-w-3xl">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};
