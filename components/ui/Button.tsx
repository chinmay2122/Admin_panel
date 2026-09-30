import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = "",
      variant = "secondary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#B8532F] disabled:opacity-50 disabled:pointer-events-none rounded-lg cursor-pointer";

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-[#B8532F] text-white hover:bg-[#A04423] active:bg-[#8D3A1D] border border-[#B8532F]",
      secondary:
        "bg-white text-[#141413] hover:bg-[#F5F5F0] border border-[#E8E8E3] active:bg-[#EBEBE5]",
      outline:
        "bg-transparent text-[#141413] hover:bg-[#F5F5F0] border border-[#E8E8E3] active:bg-[#EBEBE5]",
      ghost:
        "bg-transparent text-[#5B5B56] hover:text-[#141413] hover:bg-[#F5F5F0] active:bg-[#EBEBE5] border border-transparent",
      danger:
        "bg-[#FDF3F2] text-[#B83838] border border-[#F4CDCD] hover:bg-[#FBE8E7] active:bg-[#F7D8D7]",
    };

    const sizeStyles: Record<ButtonSize, string> = {
      sm: "h-8 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-sm gap-2",
      lg: "h-10 px-4.5 text-sm gap-2.5",
    };

    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && (
          <span className="inline-flex shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
