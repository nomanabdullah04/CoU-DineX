"use client";

import React, { useState } from "react";
import { CampusDeliveryMap } from "@/components/delivery/CampusDeliveryMap";
import {
  CAMPUS_DELIVERY_ZONES,
  CAMPUS_PICKUP_POINTS,
  CAMPUS_LANDMARKS,
} from "@/lib/campus-map-config";
import {
  MapPin,
  Navigation,
  ShieldCheck,
  Building,
  Home,
  Utensils,
  Clock,
  Layers,
  Info,
} from "lucide-react";

export default function CampusMapPage() {
  const [selectedZone, setSelectedZone] = useState<string>("ALL");

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 80px 16px" }}>
      {/* Top Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
          borderRadius: 24,
          padding: "28px 24px",
          color: "#FFFFFF",
          marginBottom: 24,
          boxShadow: "0 10px 25px rgba(15, 118, 110, 0.22)",
        }}
      >
        <span
          style={{
            fontSize: 12,
            opacity: 0.85,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 800,
          }}
        >
          Campus Delivery Network
        </span>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: "4px 0 6px 0", letterSpacing: "-0.01em" }}>
          Comilla University Campus Delivery Map
        </h1>
        <p style={{ margin: 0, fontSize: 13, opacity: 0.9, maxWidth: 640, lineHeight: 1.5 }}>
          Explore designated cafeteria pick-up counters, residential hall drop points, academic faculty delivery zones, and verified route waypoints at Kotbari, Cumilla.
        </p>
      </div>

      {/* Main Interactive Map Component */}
      <div style={{ marginBottom: 28 }}>
        <CampusDeliveryMap
          deliveryType="HALL_DELIVERY"
          destinationName="Kazi Nazrul Islam Hall (North-East Drop Point)"
          hallCode="KNH"
          deliveryStatus="ASSIGNED"
          height="420px"
        />
      </div>

      {/* Delivery Zones Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Layers size={20} color="var(--primary)" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
            Active Campus Delivery Zones
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {CAMPUS_DELIVERY_ZONES.map((zone) => (
            <div
              key={zone.id}
              style={{
                background: "var(--surface)",
                border: `2px solid ${zone.color}35`,
                borderRadius: 20,
                padding: "20px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    background: zone.color,
                  }}
                />
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                  {zone.name}
                </h3>
              </div>

              <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "0 0 14px 0", lineHeight: 1.4 }}>
                {zone.description}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--txt-muted)",
                  paddingTop: 10,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <span>Coverage Radius: <strong>{zone.radiusMeters}m</strong></span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: `${zone.color}20`,
                    color: zone.color,
                    fontWeight: 700,
                  }}
                >
                  {zone.coverageTypes.join(" • ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Designated Pickup Points Section */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Utensils size={20} color="var(--primary)" />
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
            Cafeteria Pick-up Counters &amp; Drop Points
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {CAMPUS_PICKUP_POINTS.map((pickup) => (
            <div
              key={pickup.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "20px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                  {pickup.name}
                </h3>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 8,
                    background: "#CCFBF1",
                    color: "#0F766E",
                  }}
                >
                  Active
                </span>
              </div>

              <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                <MapPin size={13} /> {pickup.location}
              </span>

              <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                {pickup.instructions}
              </p>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--txt-muted)",
                  paddingTop: 10,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <Clock size={13} color="var(--primary)" />
                <span>Operating Hours: <strong>{pickup.operatingHours}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
