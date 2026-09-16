"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/contexts/CartContext";
import { getItemImageUrl } from "@/lib/foodImages";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  QrCode,
  ShoppingBag,
  Package,
  Building2,
  Utensils,
  History,
  TrendingUp,
  Award,
  ChevronRight,
  RefreshCw,
  Star,
  Leaf,
  Percent,
  Compass,
  ArrowRight,
  Flame,
  Check,
  Copy,
  Radio,
  ChefHat,
  GraduationCap,
} from "lucide-react";

interface DashboardData {
  student: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    isVerified: boolean;
    verificationStatus: string;
    studentId: string;
    department: string;
    session: string;
  };
  radar: {
    crowdLevel: string;
    crowdColor: string;
    availableTables: number;
    totalTables: number;
    availableFoodCount: number;
    avgWaitMinutes: number;
    cafeteriaName: string;
  };
  availableNow: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    discountPrice: number | null;
    isDailySpecial: boolean;
    preparationTime: number;
    rating: number;
    category: string;
    availability: "Available" | "Few Left" | "Sold Out";
    dotColor: string;
    tags: string[];
    imageUrl?: string | null;
    cafeteriaId?: string;
    cafeteriaName?: string;
  }>;
  activeOrder: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    deliveryType: string;
    estimatedTimeMinutes: number;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    createdAt: string;
  } | null;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    itemCount: number;
    itemsSummary: string;
    createdAt: string;
  }>;
  rewards: {
    points: number;
    ecoScore: number;
    nextReward: string;
    pointsNeeded: number;
    progressPercent: number;
  };
  offers: Array<{
    id: string;
    title: string;
    description: string;
    code: string;
    badge: string;
  }>;
  recommendation: {
    title: string;
    name: string;
    price: number;
    originalPrice: number;
    prepTime: string;
    reason: string;
    rating: number;
  };
}

const CATEGORIES = [
  { id: "All", label: "All" },
  { id: "Burger", label: "Burger" },
  { id: "Pizza", label: "Pizza" },
  { id: "Meals", label: "Meals" },
  { id: "Chicken", label: "Chicken" },
  { id: "Noodles", label: "Noodles" },
  { id: "Coffee", label: "Coffee" },
  { id: "Drinks", label: "Drinks" },
  { id: "Dessert", label: "Dessert" },
];

export default function HomePage() {
  const { addItem } = useCart();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);
  const [addedItemIds, setAddedItemIds] = React.useState<Record<string, boolean>>({});

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/student/dashboard", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login?callbackUrl=/home";
          return;
        }
        throw new Error("Unable to fetch dashboard data. Please try again.");
      }
      const json = await res.json();
      if (json.student?.role === "CAFETERIA_STAFF") {
        window.location.href = "/kitchen";
        return;
      }
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Dynamic greeting based on current local hour (SRS Section 8)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtered available food items
  const filteredFood = React.useMemo(() => {
    if (!data?.availableNow) return [];
    return data.availableNow.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [data?.availableNow, searchQuery, selectedCategory]);

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto" }} className="space-y-7">
      {/* ── Loading Skeleton ── */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-44 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>
      )}

      {/* ── Error State ── */}
      {error && !isLoading && (
        <div
          style={{
            padding: "28px",
            borderRadius: 20,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <AlertCircle size={40} color="var(--error)" className="mx-auto mb-3" />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)", margin: "0 0 6px 0" }}>
            Unable to connect to Central Dining
          </h3>
          <p style={{ fontSize: 14, color: "var(--txt-muted)", margin: "0 0 16px 0" }}>{error}</p>
          <button
            onClick={fetchDashboardData}
            style={{
              padding: "10px 24px",
              borderRadius: 12,
              background: "var(--primary)",
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RefreshCw size={16} /> Reconnect
          </button>
        </div>
      )}

      {/* ── Loaded Content ── */}
      {data && !isLoading && (
        <>
          {}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 22,
              padding: "22px 26px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              boxShadow: "var(--shadow-card)",
            }}
            className="md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1
                  style={{
                    fontSize: "clamp(22px, 3.5vw, 28px)",
                    fontWeight: 900,
                    color: "var(--txt)",
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {getGreeting()}, {data.student.name.split(" ")[0]}
                </h1>

                {/* Verified Student Badge */}
                {data.student.isVerified ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10B981",
                      border: "1px solid rgba(16, 185, 129, 0.25)",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <CheckCircle2 size={14} color="#10B981" />
                    ✓ Verified CoU Student
                  </span>
                ) : (
                  <Link
                    href="/student/verification-status"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 12px",
                      borderRadius: 99,
                      background: "rgba(245, 158, 11, 0.12)",
                      color: "#F59E0B",
                      border: "1px solid rgba(245, 158, 11, 0.25)",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <AlertCircle size={14} color="#F59E0B" />
                    {data.student.verificationStatus === "PENDING"
                      ? "Verification Pending"
                      : "Action Required"}
                  </Link>
                )}
              </div>

              <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "6px 0 0 0" }}>
                Student ID: <span style={{ fontWeight: 700, color: "var(--txt-2)" }}>{data.student.studentId}</span> •{" "}
                {data.student.department} • Session {data.student.session}
              </p>
            </div>

            {/* Cafeteria Status Indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 16px",
                borderRadius: 14,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#16A34A",
                  boxShadow: "0 0 10px #16A34A",
                }}
              />
              <div style={{ fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: "var(--txt)" }}>Central Cafeteria Open</div>
                <div style={{ color: "var(--txt-muted)", fontSize: 11 }}>Service: 8:00 AM – 9:00 PM</div>
              </div>
            </div>
          </div>

          {}
          <div className="space-y-3">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                What are you craving today?
              </h2>
            </div>

            <div
              style={{
                position: "relative",
                background: "var(--surface)",
                borderRadius: 18,
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                padding: "0 18px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <Search size={19} color="var(--txt-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search burgers, pizza, rice, cold coffee, snacks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "15px 14px",
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: "var(--txt)",
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "var(--txt-muted)",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills (SRS Section 10) */}
            <div
              style={{
                display: "flex",
                gap: 8,
                overflowX: "auto",
                paddingBottom: 4,
                scrollbarWidth: "none",
              }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      borderRadius: 99,
                      fontSize: 13,
                      fontWeight: 600,
                      border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                      background: isSelected ? "var(--primary)" : "var(--surface)",
                      color: isSelected ? "#FFFFFF" : "var(--txt-2)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 150ms ease",
                      boxShadow: isSelected ? "var(--shadow-primary)" : "none",
                    }}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {}
          <div
            style={{
              background: "linear-gradient(135deg, #0F766E 0%, #115E59 100%)",
              borderRadius: 24,
              padding: "26px",
              color: "#FFFFFF",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 14px 30px -8px rgba(15, 118, 110, 0.35)",
            }}
          >
            {/* Background watermark icon */}
            <div
              style={{
                position: "absolute",
                right: -25,
                bottom: -25,
                opacity: 0.09,
                pointerEvents: "none",
              }}
            >
              <Utensils size={200} />
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Radio size={16} className="text-white" />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  CAMPUS FOOD RADAR
                </span>
              </div>

              <Link
                href="/map"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Explore Campus <ChevronRight size={14} />
              </Link>
            </div>

            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "0 0 20px 0" }}>
              Live occupancy and status at Central Dining Hall.
            </p>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} /> Cafeteria
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4, color: "#FFFFFF" }}>
                  {data.radar.crowdLevel}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Utensils size={12} className="text-white/70" /> Tables
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4, color: "#FFFFFF" }}>
                  {String(data.radar.availableTables).padStart(2, "0")} AVAILABLE
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShoppingBag size={12} className="text-white/70" /> Available Items
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4, color: "#FFFFFF" }}>
                  {data.radar.availableFoodCount} AVAILABLE
                </div>
              </div>

              <div
                style={{
                  background: "rgba(255,255,255,0.12)",
                  backdropFilter: "blur(12px)",
                  borderRadius: 16,
                  padding: "14px 16px",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <Clock size={12} className="text-white/70" /> Avg. wait
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4, color: "#FFFFFF" }}>
                  {data.radar.avgWaitMinutes} MIN
                </div>
              </div>
            </div>
          </div>

          {}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                Where are you eating?
              </h3>
              <span style={{ fontSize: 12, color: "var(--txt-muted)" }}>Order Destination</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  icon: Utensils,
                  title: "Eat Here",
                  desc: "Cafeteria Table",
                  href: "/scan",
                  badge: "Table QR",
                },
                {
                  icon: ShoppingBag,
                  title: "Take Away",
                  desc: "Quick Counter Pickup",
                  href: "/explore?type=takeaway",
                  badge: "Skip Queue",
                },
                {
                  icon: Building2,
                  title: "Hall Delivery",
                  desc: "Residential Dorm",
                  href: "/explore?type=hall",
                  badge: "To Room",
                },
                {
                  icon: GraduationCap,
                  title: "Department",
                  desc: "Class / Lab Drop",
                  href: "/explore?type=department",
                  badge: "Academic",
                },
              ].map((dest, i) => {
                const IconComponent = dest.icon;
                return (
                  <Link
                    key={i}
                    href={dest.href}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      padding: "18px 16px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      textDecoration: "none",
                      boxShadow: "var(--shadow-card)",
                      transition: "all 150ms ease",
                    }}
                    className="hover:scale-[1.02] hover:shadow-md"
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "var(--surface-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                        color: "var(--primary)",
                      }}
                    >
                      <IconComponent size={22} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--txt)" }}>
                      {dest.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--txt-muted)", marginTop: 2 }}>
                      {dest.desc}
                    </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      marginTop: 8,
                      padding: "2px 8px",
                      borderRadius: 99,
                      background: "var(--surface-2)",
                      color: "var(--primary)",
                    }}
                  >
                    {dest.badge}
                  </span>
                </Link>
              );
            })}
          </div>
          </div>

          {}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--txt)", margin: 0 }}>
                  What’s Available Now?
                </h3>
                <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "4px 0 0 0" }}>
                  Live kitchen inventory verified with Central Dining Hall
                </p>
              </div>
              <Link
                href="/explore"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--primary)",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                View Full Menu <ChevronRight size={14} />
              </Link>
            </div>

            {filteredFood.length === 0 ? (
              <div
                style={{
                  padding: "36px 16px",
                  textAlign: "center",
                  background: "var(--surface)",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                }}
              >
                <p style={{ fontSize: 14, color: "var(--txt-muted)", margin: 0 }}>
                  No items found matching &quot;{searchQuery || selectedCategory}&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredFood.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      padding: "16px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "var(--shadow-card)",
                      transition: "all 150ms ease",
                    }}
                    className="hover:shadow-md"
                  >
                    <div>
                      {/* Top Badges: Availability Status (Text + Dot as required by SRS Section 11) */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 99,
                            background:
                              item.availability === "Available"
                                ? "rgba(22, 163, 74, 0.1)"
                                : item.availability === "Few Left"
                                  ? "rgba(245, 158, 11, 0.1)"
                                  : "rgba(220, 38, 38, 0.1)",
                            color: item.dotColor,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: item.dotColor,
                            }}
                          />
                          {item.availability}
                        </span>

                        {item.isDailySpecial && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#D97706",
                              padding: "2px 8px",
                              borderRadius: 6,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Sparkles size={11} /> Special
                          </span>
                        )}
                      </div>

                      {/* Food Dish Photography */}
                      <div
                        style={{
                          height: 120,
                          borderRadius: 14,
                          background: "var(--surface-2)",
                          position: "relative",
                          overflow: "hidden",
                          marginBottom: 12,
                        }}
                      >
                        <Image
                          src={item.imageUrl || getItemImageUrl(item.name)}
                          alt={item.name}
                          fill
                          className="object-cover transition-transform duration-300 hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 240px"
                        />
                      </div>

                      <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", margin: "0 0 4px 0", lineHeight: 1.3 }}>
                        {item.name}
                      </h4>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--txt-muted)", marginBottom: 14 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Star size={12} color="#F59E0B" fill="#F59E0B" /> {item.rating}
                        </span>
                        <span>•</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock size={12} /> {item.preparationTime} min
                        </span>
                      </div>
                    </div>

                    <div>
                      {/* Price & Action Button */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ fontSize: 18, fontWeight: 900, color: "var(--primary)" }}>
                            ৳{item.price}
                          </span>
                          {item.discountPrice && (
                            <span
                              style={{
                                fontSize: 12,
                                color: "var(--txt-muted)",
                                textDecoration: "line-through",
                                marginLeft: 6,
                              }}
                            >
                              ৳{item.discountPrice}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (item.availability === "Sold Out") return;
                            addItem({
                              id: item.id,
                              name: item.name,
                              price: item.discountPrice ?? item.price,
                              originalPrice: item.price,
                              imageUrl: item.imageUrl || getItemImageUrl(item.name),
                              cafeteriaId: item.cafeteriaId || "central-cafeteria",
                              cafeteriaName: item.cafeteriaName || data?.radar?.cafeteriaName || "CoU Central Cafeteria",
                              preparationTimeMinutes: item.preparationTime,
                            });
                            setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
                            setTimeout(() => {
                              setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
                            }, 1800);
                          }}
                          disabled={item.availability === "Sold Out"}
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            border: "none",
                            cursor: item.availability === "Sold Out" ? "not-allowed" : "pointer",
                            background:
                              item.availability === "Sold Out"
                                ? "var(--surface-2)"
                                : addedItemIds[item.id]
                                  ? "#059669"
                                  : "var(--primary)",
                            color:
                              item.availability === "Sold Out"
                                ? "var(--txt-muted)"
                                : "#FFFFFF",
                            fontSize: addedItemIds[item.id] ? 14 : 18,
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 150ms ease",
                            boxShadow: item.availability === "Sold Out" ? "none" : "var(--shadow-primary)",
                          }}
                          title={addedItemIds[item.id] ? "Added to cart!" : `Add ${item.name} to cart`}
                          aria-label={`Add ${item.name} to cart`}
                        >
                          {addedItemIds[item.id] ? "✓" : "＋"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 22. DineX Smart Pick */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 22,
                border: "1px solid var(--border)",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <Sparkles size={16} color="var(--accent)" />
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--accent)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    BEST MATCH FOR YOU
                  </span>
                </div>

                <h4 style={{ fontSize: 16, fontWeight: 900, color: "var(--txt)", margin: "0 0 6px 0" }}>
                  {data.recommendation.name}
                </h4>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)" }}>
                    ৳{data.recommendation.price}
                  </span>
                  <span style={{ fontSize: 13, color: "var(--txt-muted)", textDecoration: "line-through" }}>
                    ৳{data.recommendation.originalPrice}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: "rgba(245, 158, 11, 0.15)",
                      color: "#D97706",
                      padding: "2px 8px",
                      borderRadius: 6,
                    }}
                  >
                    Save ৳{data.recommendation.originalPrice - data.recommendation.price}
                  </span>
                </div>

                {/* AI Reason Badges (SRS Section 22) */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "var(--surface-2)",
                      color: "var(--txt-2)",
                    }}
                  >
                    ✓ Within budget
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "var(--surface-2)",
                      color: "var(--txt-2)",
                    }}
                  >
                    ✓ Fast (~12 min)
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "rgba(16, 185, 129, 0.1)",
                      color: "#10B981",
                    }}
                  >
                    ✓ Available now
                  </span>
                </div>
              </div>

              <Link
                href="/explore"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px",
                  borderRadius: 12,
                  background: "var(--primary)",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  boxShadow: "var(--shadow-primary)",
                }}
              >
                Order this <ArrowRight size={14} />
              </Link>
            </div>

            {/* 17. Smart Queue & Active Order Status */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 22,
                border: "1px solid var(--border)",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                    {data.activeOrder ? "Live Order Tracking" : "Cafeteria Queue Status"}
                  </h4>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "rgba(16, 185, 129, 0.12)",
                      color: "#10B981",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                    Normal Queue
                  </span>
                </div>

                {data.activeOrder ? (
                  <div className="space-y-3">
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--txt-muted)" }}>Order ID</span>
                      <span style={{ fontWeight: 800, color: "var(--txt)" }}>
                        #{data.activeOrder.orderNumber}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: "var(--txt-muted)" }}>Status</span>
                      <span style={{ fontWeight: 800, color: "var(--warning)" }}>
                        {data.activeOrder.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Timeline progress indicator */}
                    <div style={{ background: "var(--surface-2)", padding: "12px", borderRadius: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--txt)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                        <ChefHat size={14} className="text-amber-500" /> Your food is being prepared
                      </div>
                      <div style={{ fontSize: 11, color: "var(--txt-muted)" }}>
                        Estimated wait: ~{data.activeOrder.estimatedTimeMinutes} minutes
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div style={{ background: "var(--surface-2)", padding: "14px", borderRadius: 14 }}>
                      <div style={{ fontSize: 11, color: "var(--txt-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                        YOUR QUEUE
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 900, color: "var(--txt)", marginTop: 4 }}>
                        08 orders ahead
                      </div>
                      <div style={{ fontSize: 12, color: "var(--txt-2)", marginTop: 2 }}>
                        Estimated wait: ~11 min • Kitchen: Normal
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: 0 }}>
                      No waiting in long queues — order right from your smartphone.
                    </p>
                  </div>
                )}
              </div>

              <Link
                href="/orders"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "10px",
                  borderRadius: 12,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--txt)",
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: "none",
                  marginTop: 14,
                }}
              >
                <History size={15} /> View Order History
              </Link>
            </div>

            {/* 21. Rewards & 24. Eco Dashboard */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 22,
                border: "1px solid var(--border)",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Award size={18} color="var(--accent)" />
                    <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                      Dine Points & Eco Score
                    </h4>
                  </div>
                  <Link
                    href="/rewards"
                    style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
                  >
                    Redeem
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    style={{
                      background: "var(--surface-2)",
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--txt-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                      <Award size={13} className="text-amber-500" /> Dine Points
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "var(--primary)", marginTop: 4 }}>
                      {data.rewards.points}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "var(--surface-2)",
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "var(--txt-muted)", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                      <Leaf size={13} className="text-emerald-500" /> Eco Score
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#10B981", marginTop: 4 }}>
                      {data.rewards.ecoScore}{" "}
                      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--txt-muted)" }}>/ 100</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar to next reward */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
                    <span style={{ color: "var(--txt-2)", fontWeight: 600 }}>
                      Next: {data.rewards.nextReward}
                    </span>
                    <span style={{ color: "var(--txt-muted)", fontWeight: 600 }}>
                      {data.rewards.pointsNeeded} pts left
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      borderRadius: 99,
                      background: "var(--surface-2)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${data.rewards.progressPercent}%`,
                        background: "linear-gradient(90deg, var(--primary), var(--accent))",
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Eco Impact Note */}
              <div
                style={{
                  fontSize: 11,
                  color: "var(--txt-muted)",
                  background: "var(--surface-2)",
                  padding: "8px 12px",
                  borderRadius: 10,
                  marginTop: 14,
                }}
              >
                14 plastic items avoided • 6 reusable choices
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Discounts */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 22,
                border: "1px solid var(--border)",
                padding: "22px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                <Percent size={17} color="var(--primary)" />
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                  Campus Offers & Discounts
                </h4>
              </div>

              <div className="space-y-3">
                {data.offers.map((offer) => (
                  <div
                    key={offer.id}
                    style={{
                      background: "var(--surface-2)",
                      borderRadius: 16,
                      padding: "14px 16px",
                      border: "1px solid var(--border)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 6,
                          background: "rgba(15, 118, 110, 0.12)",
                          color: "var(--primary)",
                        }}
                      >
                        {offer.badge}
                      </span>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "var(--txt)", marginTop: 5 }}>
                        {offer.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--txt-muted)", marginTop: 2 }}>
                        {offer.description}
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyCode(offer.code)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--primary)",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "6px 10px",
                        borderRadius: 8,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {copiedCode === offer.code ? (
                        <>
                          <Check size={12} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> {offer.code}
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Orders List */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: 22,
                border: "1px solid var(--border)",
                padding: "22px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                  Recent Orders
                </h4>
                <Link
                  href="/orders"
                  style={{ fontSize: 12, fontWeight: 700, color: "var(--primary)", textDecoration: "none" }}
                >
                  View All Orders
                </Link>
              </div>

              {data.recentOrders.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 16px",
                    background: "var(--surface-2)",
                    borderRadius: 16,
                  }}
                >
                  <ShoppingBag size={28} color="var(--txt-muted)" className="mx-auto mb-2 opacity-50" />
                  <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: 0 }}>
                    No past orders yet. Central Cafeteria is waiting for your first order!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentOrders.map((ro) => (
                    <div
                      key={ro.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 14,
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 13, color: "var(--txt)" }}>
                            Order #{ro.orderNumber}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 6,
                              background: "rgba(16, 185, 129, 0.12)",
                              color: "#10B981",
                            }}
                          >
                            {ro.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--txt-muted)", marginTop: 3 }}>
                          {ro.itemsSummary || `${ro.itemCount} item(s)`}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 14, fontWeight: 900, color: "var(--txt)" }}>
                          ৳{ro.totalAmount}
                        </span>
                        <Link
                          href={`/orders/${ro.id}`}
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--primary)",
                            textDecoration: "none",
                            padding: "4px 10px",
                            borderRadius: 8,
                            background: "var(--surface)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
