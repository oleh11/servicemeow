"use client";

import React, { useState, forwardRef } from "react";
import { X } from "lucide-react";

export interface M3OutlinedTextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onClear?: () => void;
  showClear?: boolean;
}

export const M3OutlinedTextField = forwardRef<HTMLInputElement, M3OutlinedTextFieldProps>(
  (
    {
      label,
      helperText,
      error = false,
      errorMessage,
      leadingIcon,
      trailingIcon,
      onClear,
      showClear = false,
      value,
      onChange,
      disabled,
      readOnly,
      className = "",
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const isFloating = focused || hasValue;

    return (
      <div className={`relative flex flex-col font-sans ${className}`}>
        {/* Outlined Container */}
        <div
          className={`relative flex items-center min-h-[56px] px-4 border-2 border-black transition-all duration-150 bg-white ${
            disabled
              ? "opacity-60 bg-neutral-100 cursor-not-allowed"
              : error
              ? "border-red-600 ring-2 ring-red-600"
              : focused
              ? "border-[#eb0029] ring-2 ring-[#eb0029]/20"
              : "hover:bg-neutral-50"
          }`}
        >
          {/* Leading Icon */}
          {leadingIcon && (
            <div className="mr-3 text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
              {leadingIcon}
            </div>
          )}

          {/* Floating Label */}
          <label
            className={`absolute left-4 pointer-events-none transition-all duration-150 origin-top-left ${
              isFloating
                ? "-top-2.5 px-1.5 bg-[var(--md-sys-color-surface-container-lowest)] text-xs font-medium tracking-[0.15px]"
                : "top-4 text-sm font-normal text-[var(--md-sys-color-on-surface-variant)]"
            } ${
              error
                ? "text-[var(--md-sys-color-error)] font-medium"
                : focused
                ? "text-[var(--md-sys-color-primary)] font-medium"
                : "text-[var(--md-sys-color-on-surface-variant)]"
            } ${leadingIcon && !isFloating ? "left-11" : "left-3.5"}`}
          >
            {label}
          </label>

          {/* Native Input */}
          <input
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            readOnly={readOnly}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent text-sm text-[var(--md-sys-color-on-surface)] outline-none placeholder-transparent pt-3 pb-1"
            placeholder={label}
            {...props}
          />

          {/* Clear Button */}
          {showClear && hasValue && !disabled && !readOnly && (
            <button
              type="button"
              onClick={onClear}
              className="p-1 text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] rounded-full hover:bg-[var(--md-sys-color-surface-container-high)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Trailing Icon */}
          {trailingIcon && (
            <div className="ml-2 text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
              {trailingIcon}
            </div>
          )}
        </div>

        {/* Supporting / Error Text */}
        {(errorMessage || helperText) && (
          <div
            className={`text-xs mt-1 px-4 ${
              error
                ? "text-[var(--md-sys-color-error)] font-medium"
                : "text-[var(--md-sys-color-on-surface-variant)]"
            }`}
          >
            {error ? errorMessage : helperText}
          </div>
        )}
      </div>
    );
  }
);

M3OutlinedTextField.displayName = "M3OutlinedTextField";
