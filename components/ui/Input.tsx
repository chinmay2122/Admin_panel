import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-[#4A4A45] tracking-tight"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-[#8A8A84] pointer-events-none flex items-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={`w-full bg-white text-[#141413] text-sm placeholder:text-[#9A9A94] border ${
              error ? "border-[#D94E4E]" : "border-[#E8E8E3]"
            } rounded-lg py-2 ${leftIcon ? "pl-9" : "pl-3"} ${
              rightIcon ? "pr-9" : "pr-3"
            } transition-colors duration-150 focus:outline-none focus:border-[#B8532F] focus:ring-1 focus:ring-[#B8532F] disabled:bg-[#F7F7F4] disabled:text-[#8E8E88] disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#8A8A84] flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-[#B83838]">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#71716D]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
