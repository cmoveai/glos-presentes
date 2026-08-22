import React from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "header";
  variant?: "dark" | "light";
  className?: string;
  showSubtitle?: boolean;
}

/**
 * Logo oficial da marca "glos."
 * Imagem da logo real da marca com fundo transparente, tipografia serifada e ponto cobalt (#004AAD).
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  variant = "dark",
  className = "",
  showSubtitle = false,
}) => {
  const sizeClasses = {
    sm: "h-6 sm:h-6.5",
    md: "h-7 sm:h-8",
    lg: "h-9 sm:h-10",
    header: "h-7 sm:h-8",
  };

  const logoSrc = variant === "light" ? "/glos-logo-white.svg" : "/glos-logo.svg";

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <img
        src={logoSrc}
        alt="glos."
        className={`${sizeClasses[size]} w-auto object-contain shrink-0 block`}
        loading="eager"
        decoding="sync"
      />
      {showSubtitle && (
        <span className="text-[10px] sm:text-[11px] tracking-widest text-[#6B6A64] uppercase font-medium">
          Presentes & Design
        </span>
      )}
    </div>
  );
};

