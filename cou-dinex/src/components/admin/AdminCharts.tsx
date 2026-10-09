import React from "react";

interface BarChartProps {
  data: { label: string; value: number; secondaryValue?: number; tooltip?: string }[];
  height?: number;
  barColor?: string;
  secondaryBarColor?: string;
  valuePrefix?: string;
}

export function AdminBarChart({
  data,
  height = 220,
  barColor = "var(--primary, #FF6B00)",
  secondaryBarColor = "#059669",
  valuePrefix = "",
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--txt-muted, #64748B)", fontSize: 13 }}>
        No data available for selected period
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.value, d.secondaryValue || 0)), 1);

  return (
    <div style={{ width: "100%", height, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingTop: 16 }}>
      {/* Bars container */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: height - 36, width: "100%", borderBottom: "1px solid var(--border, #E2E8F0)", paddingBottom: 6 }}>
        {data.map((item, idx) => {
          const heightPct = Math.max(6, Math.round((item.value / maxValue) * 100));
          const secondaryHeightPct = item.secondaryValue !== undefined ? Math.max(6, Math.round((item.secondaryValue / maxValue) * 100)) : 0;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                gap: 3,
                height: "100%",
                position: "relative",
              }}
              title={item.tooltip || `${item.label}: ${valuePrefix}${item.value}`}
            >
              {/* Primary Bar */}
              <div
                style={{
                  width: item.secondaryValue !== undefined ? "45%" : "80%",
                  height: `${heightPct}%`,
                  background: barColor,
                  borderRadius: "6px 6px 2px 2px",
                  transition: "height 0.4s ease, opacity 0.2s",
                  minHeight: 4,
                  cursor: "pointer",
                }}
              />

              {/* Optional Secondary Bar */}
              {item.secondaryValue !== undefined && (
                <div
                  style={{
                    width: "45%",
                    height: `${secondaryHeightPct}%`,
                    background: secondaryBarColor,
                    borderRadius: "6px 6px 2px 2px",
                    transition: "height 0.4s ease",
                    minHeight: 4,
                    cursor: "pointer",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, overflowX: "hidden" }}>
        {data.map((item, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 10,
              fontWeight: 600,
              color: "var(--txt-muted, #64748B)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MiniTrendProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

export function StatMetricCard({
  label,
  value,
  change,
  isPositive = true,
  subtext,
  icon,
  accentColor = "var(--primary, #FF6B00)",
}: MiniTrendProps) {
  return (
    <div
      style={{
        background: "var(--surface, #FFFFFF)",
        border: "1px solid var(--border, #E2E8F0)",
        borderRadius: 20,
        padding: "20px 22px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-muted, #64748B)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {label}
          </span>
          <div style={{ fontSize: 26, fontWeight: 900, color: "var(--txt, #0F172A)", marginTop: 4 }}>
            {value}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: `${accentColor}15`,
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        {change && (
          <span
            style={{
              fontWeight: 700,
              color: isPositive ? "#059669" : "#DC2626",
              background: isPositive ? "#ECFDF5" : "#FEF2F2",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {isPositive ? "↑" : "↓"} {change}
          </span>
        )}
        {subtext && <span style={{ color: "var(--txt-muted, #64748B)" }}>{subtext}</span>}
      </div>
    </div>
  );
}
