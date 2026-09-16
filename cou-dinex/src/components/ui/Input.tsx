"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      onRightIconClick,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
            {props.required && (
              <span className="text-[var(--error)] ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none flex items-center">
              {leftIcon}
            </span>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              // Base
              "w-full h-11 bg-[var(--surface)] text-[var(--text-primary)]",
              "border border-[var(--border)] rounded-[var(--radius-md)]",
              "text-sm placeholder:text-[var(--text-muted)]",
              "transition-all duration-150",
              // Focus
              "outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)] focus:ring-opacity-20",
              // Padding
              leftIcon ? "pl-10" : "pl-4",
              rightIcon ? "pr-10" : "pr-4",
              // Error
              error && "border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]",
              // Disabled
              disabled && "opacity-50 cursor-not-allowed bg-[var(--surface-secondary)]",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />

          {rightIcon && (
            <button
              type="button"
              onClick={onRightIconClick}
              className={cn(
                "absolute right-3.5 text-[var(--text-muted)] flex items-center",
                onRightIconClick
                  ? "cursor-pointer hover:text-[var(--primary)] transition-colors"
                  : "pointer-events-none"
              )}
              tabIndex={onRightIconClick ? 0 : -1}
              aria-label="Input action"
            >
              {rightIcon}
            </button>
          )}
        </div>

        {error ? (
          <p
            id={`${inputId}-error`}
            className="text-xs text-[var(--error)] flex items-center gap-1"
            role="alert"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 11a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm.75-4.75a.75.75 0 0 1-1.5 0v-3a.75.75 0 0 1 1.5 0v3z"/>
            </svg>
            {error}
          </p>
        ) : helperText ? (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-[var(--text-muted)]"
          >
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
