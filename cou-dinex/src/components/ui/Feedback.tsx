"use client";

import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/* ========== LoadingSkeleton ========== */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

function Skeleton({ className, width, height, rounded = "md", style, ...props }: SkeletonProps) {
  const roundedMap = {
    sm:   "rounded-[6px]",
    md:   "rounded-[12px]",
    lg:   "rounded-[18px]",
    xl:   "rounded-[24px]",
    full: "rounded-full",
  };

  return (
    <div
      className={cn("shimmer", roundedMap[rounded], className)}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/* Food card skeleton */
function FoodCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] overflow-hidden">
      <Skeleton height={180} rounded="sm" className="rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton height={18} width="70%" />
        <Skeleton height={14} width="90%" />
        <Skeleton height={14} width="50%" />
        <div className="flex justify-between items-center pt-1">
          <Skeleton height={20} width="30%" />
          <Skeleton height={36} width={36} rounded="full" />
        </div>
      </div>
    </div>
  );
}

/* Order card skeleton */
function OrderCardSkeleton() {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-4 space-y-3">
      <div className="flex justify-between items-start">
        <Skeleton height={18} width="40%" />
        <Skeleton height={22} width={80} rounded="full" />
      </div>
      <Skeleton height={14} width="60%" />
      <Skeleton height={14} width="80%" />
      <div className="flex justify-between items-center pt-1">
        <Skeleton height={20} width="25%" />
        <Skeleton height={36} width={90} rounded="md" />
      </div>
    </div>
  );
}

/* Page header skeleton */
function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-6">
      <Skeleton height={30} width="40%" />
      <Skeleton height={16} width="60%" />
    </div>
  );
}

/* ========== EmptyState ========== */
interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  emoji,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-16 px-6",
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      <div className="mb-4">
        {icon ? (
          <span className="text-[var(--text-muted)]">{icon}</span>
        ) : (
          <Inbox size={48} className="text-[var(--text-muted)] mx-auto" />
        )}
      </div>

      <h3 className="font-bold text-xl text-[var(--text-primary)] mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-6 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div>{action}</div>}
    </div>
  );
}

/* ========== ErrorState ========== */
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error. Please try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-16 px-6",
        className
      )}
      role="alert"
    >
      <div className="mb-4 w-16 h-16 rounded-full bg-[var(--error-light)] flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--error)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>

      <h3 className="font-bold text-xl text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-xs mb-6">{description}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="h-10 px-6 bg-[var(--primary)] text-white font-semibold rounded-[12px] text-sm hover:bg-[var(--primary-dark)] transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/* ========== Avatar ========== */
interface AvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const sizeMap = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-xl",
  };

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "User avatar"}
        className={cn(
          "rounded-full object-cover bg-[var(--surface-secondary)]",
          sizeMap[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-bold",
        "bg-[var(--primary-light)] text-[var(--primary)]",
        sizeMap[size],
        className
      )}
      aria-label={name ? `Avatar for ${name}` : "User avatar"}
    >
      {initials}
    </div>
  );
}

export {
  Skeleton,
  FoodCardSkeleton,
  OrderCardSkeleton,
  PageHeaderSkeleton,
  EmptyState,
  ErrorState,
  Avatar,
};
