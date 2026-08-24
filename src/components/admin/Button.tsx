import React from "react";
import { LucideIcon } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

/**
 * Botão padrão do Design System glos.
 * Montserrat 500, flat, sem sombras dramáticas.
 * Destaque único Cobalt #004AAD para ações primárias.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled,
  className = "",
  type = "button",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variantClasses = {
    primary:
      "bg-[#004AAD] text-white hover:bg-[#003c8d] active:bg-[#003070] border border-transparent rounded-[6px]",
    secondary:
      "bg-[#EEEDE8] text-[#272727] border border-[#D6D3CC] hover:bg-[#E4E2DD] active:bg-[#D6D3CC] rounded-[6px]",
    danger:
      "bg-[#EEEDE8] text-[#9B2C2C] border border-[#D6D3CC] hover:bg-[#9B2C2C] hover:text-white rounded-[6px]",
    ghost:
      "bg-transparent text-[#6B6A64] hover:text-[#272727] hover:bg-[#EEEDE8] border border-transparent rounded-[6px]",
  };

  const sizeClasses = {
    xs: "text-[11px] px-2 py-1 gap-1 min-h-[26px]",
    sm: "text-xs px-3 py-1.5 gap-1.5 min-h-[32px]",
    md: "text-xs px-4 py-2 gap-2 min-h-[36px]",
    lg: "text-sm px-5 py-2.5 gap-2.5 min-h-[42px]",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-4 h-4",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        Icon && iconPosition === "left" && <Icon className={`${iconSizes[size]} shrink-0`} />
      )}
      {children && <span>{children}</span>}
      {!loading && Icon && iconPosition === "right" && (
        <Icon className={`${iconSizes[size]} shrink-0`} />
      )}
    </button>
  );
};
