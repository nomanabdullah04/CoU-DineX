"use client";

import React, { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  CAMPUS_LANDMARKS,
  CAMPUS_DELIVERY_ZONES,
  CAMPUS_PICKUP_POINTS,
  COU_CAMPUS_CENTER,
  getDestinationCoordinates,
  generateCampusDeliveryRoute,
} from "@/lib/campus-map-config";
import {
  MapPin,
  Navigation,
  ShieldCheck,
  Layers,
  Utensils,
  Clock,
  Phone,
  Eye,
  EyeOff,
} from "lucide-react";

interface CampusDeliveryMapProps {
  deliveryType: "HALL_DELIVERY" | "DEPARTMENT_DELIVERY" | "CAFETERIA_PICKUP" | "TABLE_QR";
  destinationName: string;
  hallCode?: string | null;
  deptCode?: string | null;
  deliveryStatus?: string;
  riderLat?: number | null;
  riderLng?: number | null;
  agentName?: string | null;
  agentPhone?: string | null;
  agentVehicle?: string | null;
  height?: string;
}

export function CampusDeliveryMap({
  deliveryType,
  destinationName,
  hallCode,
  deptCode,
  deliveryStatus = "PENDING",
  riderLat,
  riderLng,
  agentName,
  agentPhone,
  agentVehicle,
  height = "380px",
}: CampusDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const riderMarkerRef = useRef<any>(null);

  const [showZones, setShowZones] = useState(true);
  const [showPickupPoints, setShowPickupPoints] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);

  const originPoint = CAMPUS_LANDMARKS.CENTRAL_CAFETERIA;
  const destPoint = getDestinationCoordinates(deliveryType, hallCode, deptCode);

  const originCoords: [number, number] = [originPoint.lat, originPoint.lng];
  const destCoords: [number, number] = [destPoint.lat, destPoint.lng];

  const routeWaypoints = generateCampusDeliveryRoute(originCoords, destCoords);

  const isTransitActive = deliveryStatus === "ON_THE_WAY";
  const isDelivered = deliveryStatus === "DELIVERED";

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const L = (await import("leaflet")).default;

      if (!isMounted || !mapContainerRef.current) return;

      // Initialize map centered between origin and destination or CoU center
      const centerLat = (originCoords[0] + destCoords[0]) / 2;
      const centerLng = (originCoords[1] + destCoords[1]) / 2;

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false,
      });

      // Verified OpenStreetMap Tile Layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // 1. Delivery Zones Layer (Configurable campus zones)
      const zonesLayerGroup = L.layerGroup();
      CAMPUS_DELIVERY_ZONES.forEach((zone) => {
        L.circle(zone.center, {
          radius: zone.radiusMeters,
          color: zone.color,
          fillColor: zone.color,
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "4, 6",
        })
          .bindPopup(
            `<strong>${zone.name}</strong><br/><span style="font-size:12px;color:#666;">${zone.description}</span>`
          )
          .addTo(zonesLayerGroup);
      });
      zonesLayerGroup.addTo(map);

      // 2. Pickup Points Layer
      const pickupsLayerGroup = L.layerGroup();
      CAMPUS_PICKUP_POINTS.forEach((p) => {
        const icon = L.divIcon({
          className: "custom-pickup-pin",
          html: `
            <div style="background:#4F46E5;color:#fff;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;font-size:12px;">
              🛍️
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        L.marker([p.lat, p.lng], { icon })
          .bindPopup(
            `<strong>${p.name}</strong><br/><span style="font-size:11px;color:#4F46E5;font-weight:700;">${p.operatingHours}</span><br/><span style="font-size:12px;color:#666;">${p.instructions}</span>`
          )
          .addTo(pickupsLayerGroup);
      });
      pickupsLayerGroup.addTo(map);

      // 3. Origin Marker (Central Cafeteria Dispatch Counter)
      const originIcon = L.divIcon({
        className: "custom-origin-pin",
        html: `
          <div style="background:#0F766E;color:#fff;padding:4px 8px;border-radius:14px;display:flex;align-items:center;gap:4px;box-shadow:0 3px 10px rgba(15,118,110,0.4);border:2px solid #fff;font-weight:800;font-size:11px;white-space:nowrap;">
            <span>🍽️</span> Central Cafeteria (Kitchen)
          </div>
        `,
        iconAnchor: [60, 20],
      });
      L.marker(originCoords, { icon: originIcon })
        .bindPopup(`<strong>Central Cafeteria</strong><br/>Dispatch Counter & Kitchen`)
        .addTo(map);

      // 4. Destination Marker (Student Delivery Drop Point)
      const destIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `
          <div style="background:#DC2626;color:#fff;padding:4px 8px;border-radius:14px;display:flex;align-items:center;gap:4px;box-shadow:0 3px 10px rgba(220,38,38,0.4);border:2px solid #fff;font-weight:800;font-size:11px;white-space:nowrap;">
            <span>📍</span> ${destinationName}
          </div>
        `,
        iconAnchor: [60, 20],
      });
      L.marker(destCoords, { icon: destIcon })
        .bindPopup(`<strong>Delivery Destination:</strong><br/>${destinationName}`)
        .addTo(map);

      // 5. Delivery Route Polyline
      const polyline = L.polyline(routeWaypoints, {
        color: "#0F766E",
        weight: 4,
        opacity: 0.85,
        dashArray: "6, 8",
      }).addTo(map);

      // Fit map bounds to encompass origin and destination with padding
      map.fitBounds(polyline.getBounds(), { padding: [40, 40], maxZoom: 17 });

      // 6. Rider Live Location Marker (Active transit only)
      if (isTransitActive) {
        const currentRiderCoords: [number, number] =
          riderLat && riderLng
            ? [riderLat, riderLng]
            : [
                (originCoords[0] + destCoords[0]) / 2,
                (originCoords[1] + destCoords[1]) / 2,
              ];

        const riderIcon = L.divIcon({
          className: "custom-rider-pin",
          html: `
            <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
              <span style="position:absolute;width:38px;height:38px;border-radius:50%;background:rgba(15,118,110,0.35);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
              <div style="position:relative;width:28px;height:28px;border-radius:50%;background:#0F766E;border:2px solid #FFFFFF;color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 4px 10px rgba(0,0,0,0.3);">
                🛵
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const riderMarker = L.marker(currentRiderCoords, { icon: riderIcon })
          .bindPopup(
            `<strong>Live Rider:</strong> ${agentName || "Assigned Rider"}<br/><span style="font-size:11px;color:#0F766E;font-weight:700;">In Transit to Destination</span>`
          )
          .addTo(map);

        riderMarkerRef.current = riderMarker;
      }

      mapInstanceRef.current = map;
      setMapLoaded(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [
    deliveryType,
    destinationName,
    hallCode,
    deptCode,
    isTransitActive,
    riderLat,
    riderLng,
  ]);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "var(--shadow-card)",
        position: "relative",
      }}
    >
      {/* Top Map Header & Controls */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          background: "var(--surface-2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#CCFBF1",
              color: "#0F766E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Navigation size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "var(--txt)" }}>
              Campus Delivery Map &amp; Route
            </h3>
            <span style={{ fontSize: 11, color: "var(--txt-muted)" }}>
              Comilla University Campus (Kotbari, Cumilla) • OpenStreetMap Verified
            </span>
          </div>
        </div>

        {/* Live Status Chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 16,
              background: isDelivered ? "#D1FAE5" : isTransitActive ? "#FEF3C7" : "#E2E8F0",
              color: isDelivered ? "#047857" : isTransitActive ? "#D97706" : "#475569",
              fontSize: 12,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {isTransitActive && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#D97706",
                  display: "inline-block",
                }}
              />
            )}
            {isDelivered
              ? "Handover Completed"
              : isTransitActive
              ? "Rider In Transit"
              : `Status: ${deliveryStatus.replace(/_/g, " ")}`}
          </span>
        </div>
      </div>

      {/* Leaflet Map DOM Container */}
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height,
          background: "#F1F5F9",
          position: "relative",
          zIndex: 1,
        }}
      />

      {/* Bottom Privacy Safeguard & Legend Footer */}
      <div
        style={{
          padding: "12px 18px",
          background: "var(--surface)",
          borderTop: "1px solid var(--border)",
          fontSize: 12,
          color: "var(--txt-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <ShieldCheck size={16} color="#0F766E" />
          <span>
            <strong>Privacy Protection:</strong> Location is only shared while delivery is actively in transit. Automatically stopped upon handover. Student location is never continuously tracked.
          </span>
        </div>

        {/* Route Key */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#0F766E" }} />
            Kitchen Counter
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }} />
            Drop-off Point
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 14, height: 2, background: "#0F766E" }} />
            Delivery Route
          </span>
        </div>
      </div>
    </div>
  );
}
