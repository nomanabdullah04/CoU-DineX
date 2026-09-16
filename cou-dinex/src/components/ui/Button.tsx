"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-semibold transition-all duration-150 cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--primary)] text-white",
          "hover:bg-[var(--primary-dark)] active:scale-[0.98]",
          "shadow-[var(--shadow-primary)]",
          "focus-visible:ring-[var(--primary)]",
        ].join(" "),

        secondary: [
          "bg-[var(--surface)] text-[var(--text-primary)]",
          "border border-[var(--border)] hover:border-[var(--primary)]",
          "hover:bg-[var(--primary-light)] hover:text-[var(--primary)]",
          "active:scale-[0.98]",
        ].join(" "),

        outline: [
          "bg-transparent border-2 border-[var(--primary)] text-[var(--primary)]",
          "hover:bg-[var(--primary)] hover:text-white",
          "active:scale-[0.98]",
        ].join(" "),

        ghost: [
          "bg-transparent text-[var(--text-secondary)]",
          "hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]",
          "active:scale-[0.98]",
        ].join(" "),

        danger: [
          "bg-[var(--error)] text-white",
          "hover:opacity-90 active:scale-[0.98]",
          "shadow-sm",
        ].join(" "),

        accent: [
          "bg-[var(--accent)] text-white",
          "hover:opacity-90 active:scale-[0.98]",
          "shadow-sm",
        ].join(" "),

        success: [
          "bg-[var(--success)] text-white",
          "hover:opacity-90 active:scale-[0.98]",
        ].join(" "),

        link: [
          "text-[var(--primary)] underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ].join(" "),
      },
      size: {
        xs:  "h-7  px-3  text-xs  rounded-[8px]",
        sm:  "h-8  px-4  text-sm  rounded-[10px]",
        md:  "h-10 px-5  text-sm  rounded-[12px]",
        lg:  "h-12 px-6  text-base rounded-[12px]",
        xl:  "h-14 px-8  text-lg  rounded-[14px]",
        icon:"h-10 w-10  rounded-[12px]",
        "icon-sm": "h-8 w-8 rounded-[10px]",
        "icon-lg": "h-12 w-12 rounded-[14px]",
      },
      fullWidth: {
        true: "w-full",
      },
      loading: {
        true: "opacity-70 pointer-events-none",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      asChild = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading }),
          className
        )}
        ref={ref}
        disabled={disabled || !!loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12" cy="12" r="10"
                stroke="currentColor" strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
