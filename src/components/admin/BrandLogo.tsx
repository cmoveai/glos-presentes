import React, { useState } from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl" | "header";
  variant?: "dark" | "light";
  className?: string;
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  variant = "dark",
  className = "",
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const heightMap: Record<string, string> = {
    sm: "36px",
    md: "44px",
    lg: "56px",
    xl: "72px",
    header: "48px",
  };

  const height = heightMap[size] || "44px";

  if (hasError) {
    return (
      <span className="text-red-500 font-mono text-xs font-bold whitespace-nowrap">
        ARQUIVO NAO ENCONTRADO
      </span>
    );
  }

  return (
    <img
      src="/LOGO_OFICIAL_Nivah.png"
      alt="Logo Nivah"
      onError={() => setHasError(true)}
      style={{
        height,
        width: "auto",
        objectFit: "contain",
        filter: variant === "light" ? "brightness(0) invert(1)" : undefined,
        ...style,
      }}
      className={`shrink-0 block max-h-full transition-all ${className}`}
      loading="eager"
      decoding="sync"
    />
  );
};


