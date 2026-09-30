import React from "react";

export type BadgeVariant = "default" | "accent" | "success" | "warning" | "danger" | "outline";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  children,
  className = "",
  variant = "default",
  size = "sm",
  dot = false,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    default: {
      container: "bg-[#F3F3EF] text-[#3D3D39] border border-[#E5E5DF]",
      dot: "bg-[#71716D]",
    },
    accent: {
      container: "bg-[#F8EFEA] text-[#9E4323] border border-[#EACEC0]",
      dot: "bg-[#B8532F]",
    },
    success: {
      container: "bg-[#F0F5F1] text-[#28633B] border border-[#CDE3D4]",
      dot: "bg-[#28633B]",
    },
    warning: {
      container: "bg-[#FAF5EC] text-[#865E16] border border-[#ECDDBB]",
      dot: "bg-[#865E16]",
    },
    danger: {
      container: "bg-[#FDF2F2] text-[#9E3333] border border-[#F2C6C6]",
      dot: "bg-[#B83838]",
    },
    outline: {
      container: "bg-transparent text-[#52524D] border border-[#E8E8E3]",
      dot: "bg-[#71716D]",
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "text-[11px] px-2 py-0.5 leading-tight gap-1.5",
    md: "text-xs px-2.5 py-0.5 leading-normal gap-2",
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md tracking-tight ${
        variantStyles[variant].container
      } ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${variantStyles[variant].dot}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
