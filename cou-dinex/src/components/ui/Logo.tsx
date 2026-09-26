"use client";

import React from "react";
import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";

export interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  orientation?: "horizontal" | "vertical";
  showText?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  href?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_CONFIGS = {
  xs: {
    badgeSize: 28,
    iconSize: 14,
    textSize: 15,
    subtitleSize: 9,
    gap: 7,
  },
  sm: {
    badgeSize: 34,
    iconSize: 17,
    textSize: 17,
    subtitleSize: 10,
    gap: 9,
  },
  md: {
    badgeSize: 42,
    iconSize: 21,
    textSize: 20,
    subtitleSize: 10,
    gap: 11,
  },
  lg: {
    badgeSize: 52,
    iconSize: 25,
    textSize: 24,
    subtitleSize: 11,
    gap: 13,
  },
  xl: {
    badgeSize: 62,
    iconSize: 30,
    textSize: 28,
    subtitleSize: 12,
    gap: 15,
  },
};

export function Logo({
  size = "md",
  orientation = "horizontal",
  showText = true,
  showSubtitle = false,
  subtitle = "Comilla University",
  href,
  className = "",
  style = {},
}: LogoProps) {
  const config = SIZE_CONFIGS[size] || SIZE_CONFIGS.md;
  const isVertical = orientation === "vertical";

  const content = (
    <div
      className={`cou-dinex-logo ${className}`}
      style={{
        display: "inline-flex",
        flexDirection: isVertical ? "column" : "row",
        alignItems: "center",
        justifyContent: isVertical ? "center" : "flex-start",
        gap: isVertical ? config.gap : config.gap,
        textAlign: isVertical ? "center" : "left",
        userSelect: "none",
        ...style,
      }}
    >
      {/* Circular Mint Icon Badge matching Login & SRS Branding */}
      <div
        className="cou-dinex-logo-badge"
        style={{
          width: config.badgeSize,
          height: config.badgeSize,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "transform 180ms ease, box-shadow 180ms ease",
        }}
      >
        <UtensilsCrossed size={config.iconSize} className="cou-dinex-logo-icon" />
      </div>

      {/* Styled CoU DineX Text */}
      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            className="cou-dinex-logo-text"
            style={{
              fontSize: config.textSize,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              display: "inline-flex",
              alignItems: "baseline",
            }}
          >
            <span className="cou-dinex-logo-cou">CoU</span>
            <span style={{ width: "0.22em" }} />
            <span className="cou-dinex-logo-dine">Dine</span>
            <span className="cou-dinex-logo-x">X</span>
          </span>

          {showSubtitle && (
            <span
              className="cou-dinex-logo-subtitle"
              style={{
                fontSize: config.subtitleSize,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginTop: isVertical ? 3 : 2,
                opacity: 0.8,
              }}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{
          textDecoration: "none",
          display: "inline-flex",
          alignItems: "center",
          outline: "none",
        }}
        aria-label="CoU DineX Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
