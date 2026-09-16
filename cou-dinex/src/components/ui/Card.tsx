"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ========== Card ========== */
const cardVariants = cva(
  "bg-[var(--surface)] border border-[var(--border)] transition-all duration-200",
  {
    variants: {
      variant: {
        default:  "rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]",
        elevated: "rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]",
        flat:     "rounded-[var(--radius-lg)] shadow-none",
        glass:    "rounded-[var(--radius-lg)] bg-white/60 dark:bg-[rgba(15,41,39,0.5)] backdrop-blur-xl border-white/20",
        primary:  "rounded-[var(--radius-lg)] bg-[var(--primary)] border-transparent text-white shadow-[var(--shadow-primary)]",
        outline:  "rounded-[var(--radius-lg)] shadow-none border-2 border-[var(--border)]",
      },
      hover: {
        true:  "hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5 cursor-pointer",
        false: "",
      },
      padding: {
        none: "p-0",
        sm:   "p-3",
        md:   "p-4",
        lg:   "p-5",
        xl:   "p-6",
      },
    },
    defaultVariants: {
      variant: "default",
      hover: false,
      padding: "lg",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hover, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

/* ========== Card sub-components ========== */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-1", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-bold text-lg text-[var(--text-primary)] leading-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--text-secondary)]", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-3 border-t border-[var(--border)] mt-3", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, cardVariants };
