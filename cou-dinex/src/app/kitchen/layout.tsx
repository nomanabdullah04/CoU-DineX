import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kitchen Display System (KDS) | CoU DineX",
  description: "Live real-time kitchen order display and fulfillment system for Comilla University cafeterias.",
};

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen antialiased font-sans flex flex-col">
      {children}
    </div>
  );
}
