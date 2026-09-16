"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-semibold whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        default:   "bg-[var(--primary-light)] text-[var(--primary-dark)] border border-[rgba(15,118,110,0.2)]",
        primary:   "bg-[var(--primary)] text-white",
        secondary: "bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]",
        success:   "bg-[var(--success-light)] text-[var(--success)] border border-[rgba(22,163,74,0.2)]",
        warning:   "bg-[var(--warning-light)] text-[var(--warning)] border border-[rgba(217,119,6,0.2)]",
        error:     "bg-[var(--error-light)] text-[var(--error)] border border-[rgba(220,38,38,0.2)]",
        info:      "bg-[var(--info-light)] text-[var(--info)] border border-[rgba(37,99,235,0.2)]",
        accent:    "bg-[var(--accent-light)] text-[var(--accent)] border border-[rgba(245,158,11,0.2)]",
        outline:   "bg-transparent border-2 border-[var(--primary)] text-[var(--primary)]",
        ghost:     "bg-transparent text-[var(--text-secondary)]",
        dark:      "bg-[var(--text-primary)] text-[var(--surface)]",
      },
      size: {
        sm:  "text-[10px] px-2   py-0.5 rounded-[6px]",
        md:  "text-xs    px-2.5 py-1   rounded-[8px]",
        lg:  "text-sm    px-3   py-1   rounded-[8px]",
      },
      pill: {
        true:  "rounded-full px-3",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      pill: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  icon?: React.ReactNode;
}

function Badge({
  className,
  variant,
  size,
  pill,
  dot,
  icon,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, pill }), className)}
      {...props}
    >
      {dot && (
        <span
          className="inline-block w-1.5 h-1.5 rounded-full bg-current shrink-0"
          aria-hidden="true"
        />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

/* Pre-built semantic badges */
function VerifiedBadge() {
  return (
    <Badge variant="default" size="sm" pill dot className="font-semibold">
      <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.5 6.5L7 11 4.5 8.5l-1 1L7 13l5.5-5.5-1-1z"/>
      </svg>
      Verified CoU Student
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    PENDING:           { variant: "warning", label: "Pending" },
    APPROVED:          { variant: "success", label: "Approved" },
    REJECTED:          { variant: "error",   label: "Rejected" },
    MORE_INFO_REQUIRED:{ variant: "info",    label: "More Info Required" },
    CONFIRMED:         { variant: "info",    label: "Confirmed" },
    PREPARING:         { variant: "accent",  label: "Preparing" },
    READY:             { variant: "success", label: "Ready" },
    DELIVERING:        { variant: "primary", label: "On the way" },
    DELIVERED:         { variant: "success", label: "Delivered" },
    CANCELLED:         { variant: "error",   label: "Cancelled" },
    AVAILABLE:         { variant: "success", label: "Available" },
    UNAVAILABLE:       { variant: "secondary",label: "Unavailable" },
  };

  const item = map[status] ?? { variant: "secondary", label: status };

  return (
    <Badge variant={item.variant} dot pill>
      {item.label}
    </Badge>
  );
}

export { Badge, badgeVariants, VerifiedBadge, StatusBadge };
