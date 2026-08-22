import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

/**
 * Card padrão do Design System glos.
 * Superfície #F4F3EF, borda #D6D3CC, raio 8px, flat (sem sombras).
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  ...props
}) => {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      className={`bg-[#F4F3EF] border border-[#D6D3CC] rounded-[8px] text-[#272727] ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
