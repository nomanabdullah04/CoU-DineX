import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Delivery Agent Dashboard | CoU DineX",
  description: "Campus delivery management and live dispatch portal for Comilla University.",
};

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {children}
    </div>
  );
}
