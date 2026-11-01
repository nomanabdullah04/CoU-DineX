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
  ShoppingBag,
  Building2,
  Utensils,
  Star,
  Leaf,
  ChevronRight,
  RefreshCw,
  Award,
  Flame,
  Check,
  Users,
  Calendar,
  MapPin,
  Plus,
  ArrowRight,
  Package,
  GraduationCap,
  Timer,
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
  { id: "All", label: "All", emoji: "🍽️" },
  { id: "Burger", label: "Burger", emoji: "🍔" },
  { id: "Pizza", label: "Pizza", emoji: "🍕" },
  { id: "Meals", label: "Meals", emoji: "🍛" },
  { id: "Chicken", label: "Chicken", emoji: "🍗" },
  { id: "Noodles", label: "Noodles", emoji: "🍜" },
  { id: "Coffee", label: "Coffee", emoji: "☕" },
  { id: "Drinks", label: "Drinks", emoji: "🥤" },
  { id: "Dessert", label: "Dessert", emoji: "🍰" },
];

const ORDER_DESTINATIONS = [
  { icon: Utensils, title: "Dine In", href: "/explore?type=dine", color: "#0F766E" },
  { icon: ShoppingBag, title: "Pickup", href: "/explore?type=takeaway", color: "#D97706" },
  { icon: Building2, title: "Hall", href: "/explore?type=hall", color: "#7C3AED" },
  { icon: GraduationCap, title: "Dept", href: "/explore?type=department", color: "#2563EB" },
];

export default function HomePage() {
  const { addItem } = useCart();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [addedItemIds, setAddedItemIds] = React.useState<Record<string, boolean>>({});

  const [radarTelemetry, setRadarTelemetry] = React.useState<{
    crowdLevel: string;
    crowdColor: string;
    availableNow: number;
    soldOut: number;
    estimatedWaitMinutes: number;
  } | null>(null);

  const [smartQueueTelemetry, setSmartQueueTelemetry] = React.useState<{
    totalOrders: number;
    queueStatus: string;
    estimatedPrepMinutes: number;
    suggestedOrderTime: string;
  } | null>(null);

  const [classRecommendation, setClassRecommendation] = React.useState<{
    type: string;
    message: string;
    reason: string;
    suggestedAction: string;
    suggestedTargetTime?: string;
  } | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resDashboard, resRadar, resQueue, resSchedule] = await Promise.allSettled([
        fetch("/api/student/dashboard", { cache: "no-store" }),
        fetch("/api/innovation/radar", { cache: "no-store" }),
        fetch("/api/innovation/smart-queue", { cache: "no-store" }),
        fetch("/api/innovation/class-schedule", { cache: "no-store" }),
      ]);

      if (resDashboard.status === "fulfilled" && resDashboard.value.ok) {
        const json = await resDashboard.value.json();
        if (json.student?.role === "DELIVERY_AGENT") {
          window.location.href = "/delivery";
          return;
        }
        if (json.student?.role === "CAFETERIA_STAFF") {
          window.location.href = "/kitchen";
          return;
        }
        if (json.student?.role === "SUPER_ADMIN" || json.student?.role === "CAFETERIA_ADMIN") {
          window.location.href = "/admin";
          return;
        }
        setData(json);
      } else if (resDashboard.status === "fulfilled" && resDashboard.value.status === 401) {
        window.location.href = "/login?callbackUrl=/home";
        return;
      } else {
        throw new Error("Unable to load. Please try again.");
      }

      if (resRadar.status === "fulfilled" && resRadar.value.ok) {
        const rJson = await resRadar.value.json();
        setRadarTelemetry({
          crowdLevel: rJson.telemetry?.crowdLevel || "LOW",
          crowdColor: rJson.telemetry?.crowdColor || "#16A34A",
          availableNow: rJson.counts?.availableNow || 0,
          soldOut: rJson.counts?.soldOut || 0,
          estimatedWaitMinutes: rJson.telemetry?.estimatedWaitMinutes || 12,
        });
      }

      if (resQueue.status === "fulfilled" && resQueue.value.ok) {
        const qJson = await resQueue.value.json();
        setSmartQueueTelemetry({
          totalOrders: qJson.currentQueue?.totalOrders || 0,
          queueStatus: qJson.currentQueue?.queueStatus || "SMOOTH",
          estimatedPrepMinutes: qJson.estimation?.estimatedPreparationMinutes || 12,
          suggestedOrderTime: qJson.estimation?.suggestedOrderTime || "Order now",
        });
      }

      if (resSchedule.status === "fulfilled" && resSchedule.value.ok) {
        const sJson = await resSchedule.value.json();
        if (sJson.recommendations && sJson.recommendations.length > 0) {
          setClassRecommendation(sJson.recommendations[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

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

  const handleAddToCart = (item: DashboardData["availableNow"][0]) => {
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
  };

  if (isLoading) {
    return (
      <div className="dinex-home-skeleton">
        <div className="animate-pulse space-y-4" style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="flex gap-3 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex-shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", textAlign: "center", padding: "0 20px" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(220,38,38,0.08)", display: "flex",
          alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
        }}>
          <AlertCircle size={28} color="#DC2626" />
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--txt)", margin: "0 0 8px" }}>
          Connection Error
        </h3>
        <p style={{ fontSize: 14, color: "var(--txt-muted)", margin: "0 0 20px" }}>{error}</p>
        <button
          onClick={fetchDashboardData}
          className="dinex-btn-primary"
          style={{
            padding: "12px 28px", borderRadius: 14, border: "none",
            background: "var(--primary)", color: "#fff", fontWeight: 700,
            fontSize: 14, cursor: "pointer", display: "inline-flex",
            alignItems: "center", gap: 8,
          }}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>

      {/* Greeting + Cafeteria Status */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div>
            <h1 style={{
              fontSize: 22, fontWeight: 800, color: "var(--txt)", margin: 0,
              letterSpacing: "-0.02em",
            }}>
              {getGreeting()}, {data.student.name.split(" ")[0]} 👋
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
              <MapPin size={13} color="var(--primary)" />
              <span style={{ fontSize: 13, color: "var(--txt-2)", fontWeight: 500 }}>
                {data.radar.cafeteriaName || "CoU Central Cafeteria"}
              </span>
              {data.student.isVerified && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 3,
                  fontSize: 10, fontWeight: 700, color: "#10B981",
                  background: "rgba(16,185,129,0.1)", padding: "2px 8px",
                  borderRadius: 99,
                }}>
                  <CheckCircle2 size={10} /> Verified
                </span>
              )}
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 12,
            background: "var(--surface)", border: "1px solid var(--border)",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: "50%", background: "#16A34A",
              boxShadow: "0 0 8px rgba(22,163,74,0.5)",
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--txt)" }}>Open</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{
        position: "relative", marginBottom: 20,
        background: "var(--surface)", borderRadius: 16,
        border: "1px solid var(--border)",
        display: "flex", alignItems: "center", padding: "0 16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}>
        <Search size={18} color="var(--txt-muted)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search for food..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%", padding: "14px 12px", border: "none", outline: "none",
            background: "transparent", fontSize: 14, color: "var(--txt)",
          }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{
              border: "none", background: "var(--surface-2)", color: "var(--txt-muted)",
              cursor: "pointer", fontSize: 11, fontWeight: 700, padding: "4px 10px",
              borderRadius: 8,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Active Order Floating Tracker */}
      {data.activeOrder && (
        <Link
          href={`/orders/${data.activeOrder.id}`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 18px", marginBottom: 20, borderRadius: 16,
            background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
            color: "#fff", textDecoration: "none",
            boxShadow: "0 8px 24px rgba(15,118,110,0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(255,255,255,0.2)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>
                #{data.activeOrder.orderNumber}
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {data.activeOrder.status.replace(/_/g, " ")} · ~{data.activeOrder.estimatedTimeMinutes} min
              </div>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 13, fontWeight: 700,
          }}>
            Track <ChevronRight size={16} />
          </div>
        </Link>
      )}

      {/* Delivery Options */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, overflowX: "auto", scrollbarWidth: "none" }}>
        {ORDER_DESTINATIONS.map((dest) => {
          const IconComp = dest.icon;
          return (
            <Link
              key={dest.title}
              href={dest.href}
              style={{
                flex: "0 0 auto", minWidth: 80,
                display: "flex", flexDirection: "column", alignItems: "center",
                gap: 8, padding: "14px 12px", borderRadius: 16,
                background: "var(--surface)", border: "1px solid var(--border)",
                textDecoration: "none", transition: "all 150ms",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
              className="hover:shadow-md hover:border-primary/30"
            >
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: `${dest.color}12`, color: dest.color,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <IconComp size={22} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt)" }}>
                {dest.title}
              </span>
            </Link>
          );
        })}

        <Link
          href="/group-orders"
          style={{
            flex: "0 0 auto", minWidth: 80,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 8, padding: "14px 12px", borderRadius: 16,
            background: "var(--surface)", border: "1px solid var(--border)",
            textDecoration: "none", transition: "all 150ms",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
          className="hover:shadow-md"
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "rgba(236,72,153,0.1)", color: "#EC4899",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Users size={22} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt)" }}>Group</span>
        </Link>

        <Link
          href="/class-schedule"
          style={{
            flex: "0 0 auto", minWidth: 80,
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 8, padding: "14px 12px", borderRadius: 16,
            background: "var(--surface)", border: "1px solid var(--border)",
            textDecoration: "none", transition: "all 150ms",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
          className="hover:shadow-md"
        >
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "rgba(139,92,246,0.1)", color: "#8B5CF6",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Calendar size={22} />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt)" }}>Schedule</span>
        </Link>
      </div>

      {/* Class Schedule Alert */}
      {classRecommendation && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", marginBottom: 20, borderRadius: 14,
          background: "rgba(15,118,110,0.06)", border: "1px solid rgba(15,118,110,0.15)",
          flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--txt)" }}>
              {classRecommendation.message}
            </span>
          </div>
          <Link
            href="/explore"
            style={{
              fontSize: 12, fontWeight: 700, color: "var(--primary)",
              textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            }}
          >
            {classRecommendation.suggestedAction} <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* Live Status Bar */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 24, overflowX: "auto",
        scrollbarWidth: "none",
      }}>
        <div style={{
          flex: "1 1 0", minWidth: 100, padding: "12px 14px", borderRadius: 14,
          background: "var(--surface)", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 11, color: "var(--txt-muted)", fontWeight: 600 }}>
            Available
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", marginTop: 2 }}>
            {radarTelemetry?.availableNow ?? data.radar.availableFoodCount}
          </div>
        </div>
        <div style={{
          flex: "1 1 0", minWidth: 100, padding: "12px 14px", borderRadius: 14,
          background: "var(--surface)", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 11, color: "var(--txt-muted)", fontWeight: 600 }}>
            Wait Time
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--txt)", marginTop: 2 }}>
            ~{radarTelemetry?.estimatedWaitMinutes ?? data.radar.avgWaitMinutes}m
          </div>
        </div>
        <div style={{
          flex: "1 1 0", minWidth: 100, padding: "12px 14px", borderRadius: 14,
          background: "var(--surface)", border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: 11, color: "var(--txt-muted)", fontWeight: 600 }}>
            Queue
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "var(--txt)", marginTop: 2 }}>
            {smartQueueTelemetry?.totalOrders ?? 0}
          </div>
        </div>
        <div style={{
          flex: "1 1 0", minWidth: 100, padding: "12px 14px", borderRadius: 14,
          background: "var(--surface)", border: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--txt-muted)", fontWeight: 600 }}>
            <Award size={12} /> Points
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#F59E0B", marginTop: 2 }}>
            {data.rewards.points}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", marginBottom: 20,
        scrollbarWidth: "none", paddingBottom: 2,
      }}>
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 99, fontSize: 13,
                fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap",
                border: isActive ? "1.5px solid var(--primary)" : "1px solid var(--border)",
                background: isActive ? "var(--primary)" : "var(--surface)",
                color: isActive ? "#fff" : "var(--txt-2)",
                cursor: "pointer", transition: "all 150ms ease",
                boxShadow: isActive ? "0 4px 12px rgba(15,118,110,0.25)" : "none",
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Food Grid */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 14,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
            {selectedCategory === "All" ? "Popular Now" : selectedCategory}
          </h2>
          <Link
            href="/explore"
            style={{
              fontSize: 13, fontWeight: 600, color: "var(--primary)",
              textDecoration: "none", display: "flex", alignItems: "center", gap: 4,
            }}
          >
            See All <ChevronRight size={14} />
          </Link>
        </div>

        {filteredFood.length === 0 ? (
          <div style={{
            padding: "48px 20px", textAlign: "center", borderRadius: 20,
            background: "var(--surface)", border: "1px solid var(--border)",
          }}>
            <Search size={32} color="var(--txt-muted)" style={{ opacity: 0.4, margin: "0 auto 12px" }} />
            <p style={{ fontSize: 14, color: "var(--txt-muted)", margin: 0 }}>
              No items found for &quot;{searchQuery || selectedCategory}&quot;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredFood.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "var(--surface)", borderRadius: 18,
                  border: "1px solid var(--border)", overflow: "hidden",
                  transition: "all 200ms ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
                className="hover:shadow-lg"
              >
                {/* Image */}
                <div style={{
                  position: "relative", height: 140, overflow: "hidden",
                  background: "var(--surface-2)",
                }}>
                  <Image
                    src={item.imageUrl || getItemImageUrl(item.name)}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 240px"
                  />

                  {/* Availability Badge */}
                  <div style={{
                    position: "absolute", top: 8, left: 8, display: "flex", gap: 4,
                  }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "3px 8px",
                      borderRadius: 8, backdropFilter: "blur(8px)",
                      background: item.availability === "Available"
                        ? "rgba(22,163,74,0.9)" : item.availability === "Few Left"
                          ? "rgba(245,158,11,0.9)" : "rgba(220,38,38,0.9)",
                      color: "#fff",
                    }}>
                      {item.availability === "Available" ? "✓ Available"
                        : item.availability === "Few Left" ? "Few Left"
                          : "Sold Out"}
                    </span>
                  </div>

                  {/* Daily Special */}
                  {item.isDailySpecial && (
                    <div style={{
                      position: "absolute", top: 8, right: 8,
                      fontSize: 10, fontWeight: 700, padding: "3px 8px",
                      borderRadius: 8, background: "rgba(245,158,11,0.95)", color: "#fff",
                    }}>
                      ⭐ Special
                    </div>
                  )}

                  {/* Discount Badge */}
                  {item.discountPrice && item.discountPrice < item.price && (
                    <div style={{
                      position: "absolute", bottom: 8, left: 8,
                      fontSize: 10, fontWeight: 800, padding: "3px 8px",
                      borderRadius: 8, background: "rgba(220,38,38,0.9)", color: "#fff",
                    }}>
                      -{Math.round(((item.price - item.discountPrice) / item.price) * 100)}%
                    </div>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: "12px 14px" }}>
                  <h4 style={{
                    fontSize: 14, fontWeight: 700, color: "var(--txt)",
                    margin: "0 0 6px", lineHeight: 1.3,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {item.name}
                  </h4>

                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 11, color: "var(--txt-muted)", marginBottom: 10,
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Star size={11} color="#F59E0B" fill="#F59E0B" /> {item.rating}
                    </span>
                    <span>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Timer size={11} /> {item.preparationTime}m
                    </span>
                  </div>

                  {/* Price + Add */}
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <span style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>
                        ৳{item.discountPrice ?? item.price}
                      </span>
                      {item.discountPrice && item.discountPrice < item.price && (
                        <span style={{
                          fontSize: 11, color: "var(--txt-muted)",
                          textDecoration: "line-through", marginLeft: 4,
                        }}>
                          ৳{item.price}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      disabled={item.availability === "Sold Out"}
                      aria-label={`Add ${item.name}`}
                      style={{
                        width: 32, height: 32, borderRadius: 10, border: "none",
                        cursor: item.availability === "Sold Out" ? "not-allowed" : "pointer",
                        background: item.availability === "Sold Out"
                          ? "var(--surface-2)" : addedItemIds[item.id]
                            ? "#059669" : "var(--primary)",
                        color: item.availability === "Sold Out" ? "var(--txt-muted)" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 150ms",
                        boxShadow: item.availability !== "Sold Out" ? "0 4px 12px rgba(15,118,110,0.3)" : "none",
                      }}
                    >
                      {addedItemIds[item.id] ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendation Card */}
      {data.recommendation && (
        <div style={{
          display: "flex", gap: 16, padding: "18px", marginBottom: 24,
          borderRadius: 18, background: "var(--surface)",
          border: "1px solid var(--border)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}
          className="flex-col sm:flex-row sm:items-center"
        >
          <div style={{
            width: 80, height: 80, borderRadius: 14, background: "var(--surface-2)",
            flexShrink: 0, position: "relative", overflow: "hidden",
          }}>
            <Image
              src={getItemImageUrl(data.recommendation.name)}
              alt={data.recommendation.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: "#F59E0B",
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <Sparkles size={12} /> Best Match
            </div>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", margin: "0 0 4px" }}>
              {data.recommendation.name}
            </h4>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: "var(--primary)" }}>
                ৳{data.recommendation.price}
              </span>
              <span style={{ fontSize: 12, color: "var(--txt-muted)", textDecoration: "line-through" }}>
                ৳{data.recommendation.originalPrice}
              </span>
            </div>
          </div>
          <Link
            href="/explore"
            style={{
              padding: "10px 20px", borderRadius: 12,
              background: "var(--primary)", color: "#fff",
              fontWeight: 700, fontSize: 13, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 4px 12px rgba(15,118,110,0.25)",
              whiteSpace: "nowrap",
            }}
          >
            Order <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Bottom Section: Rewards + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ marginBottom: 24 }}>
        {/* Rewards */}
        <div style={{
          padding: "18px", borderRadius: 18,
          background: "var(--surface)", border: "1px solid var(--border)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={18} color="#F59E0B" />
              <span style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)" }}>Rewards</span>
            </div>
            <Link
              href="/rewards"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
            >
              Redeem
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3" style={{ marginBottom: 14 }}>
            <div style={{
              padding: "10px 12px", borderRadius: 12,
              background: "var(--surface-2)", border: "1px solid var(--border)",
            }}>
              <div style={{ fontSize: 11, color: "var(--txt-muted)", fontWeight: 600 }}>Points</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--primary)", marginTop: 2 }}>
                {data.rewards.points}
              </div>
            </div>
            <div style={{
              padding: "10px 12px", borderRadius: 12,
              background: "var(--surface-2)", border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--txt-muted)", fontWeight: 600 }}>
                <Leaf size={11} color="#10B981" /> Eco
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#10B981", marginTop: 2 }}>
                {data.rewards.ecoScore}
              </div>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 6 }}>
              <span style={{ color: "var(--txt-2)", fontWeight: 600 }}>{data.rewards.nextReward}</span>
              <span style={{ color: "var(--txt-muted)" }}>{data.rewards.pointsNeeded} pts left</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${data.rewards.progressPercent}%`,
                background: "linear-gradient(90deg, var(--primary), #F59E0B)",
                borderRadius: 99, transition: "width 500ms ease",
              }} />
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div style={{
          padding: "18px", borderRadius: 18,
          background: "var(--surface)", border: "1px solid var(--border)",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)" }}>Recent Orders</span>
            <Link
              href="/orders"
              style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
            >
              View All
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "28px 16px",
              background: "var(--surface-2)", borderRadius: 14,
            }}>
              <ShoppingBag size={24} color="var(--txt-muted)" style={{ opacity: 0.4, margin: "0 auto 8px" }} />
              <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: 0 }}>
                No orders yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.slice(0, 3).map((ro) => (
                <Link
                  key={ro.id}
                  href={`/orders/${ro.id}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: 12,
                    background: "var(--surface-2)", border: "1px solid var(--border)",
                    textDecoration: "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--txt)" }}>
                      #{ro.orderNumber}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--txt-muted)", marginTop: 2 }}>
                      {ro.itemsSummary || `${ro.itemCount} item(s)`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--txt)" }}>
                      ৳{ro.totalAmount}
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 6px",
                      borderRadius: 6,
                      background: ro.status === "DELIVERED" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                      color: ro.status === "DELIVERED" ? "#10B981" : "#D97706",
                    }}>
                      {ro.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Offers */}
      {data.offers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: "0 0 12px" }}>
            Offers
          </h3>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 4 }}>
            {data.offers.map((offer) => (
              <div
                key={offer.id}
                style={{
                  flex: "0 0 auto", minWidth: 240, padding: "16px",
                  borderRadius: 16, background: "linear-gradient(135deg, #0F766E 0%, #0D9488 100%)",
                  color: "#fff",
                }}
              >
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "2px 8px",
                  borderRadius: 6, background: "rgba(255,255,255,0.2)",
                }}>
                  {offer.badge}
                </span>
                <div style={{ fontSize: 15, fontWeight: 800, marginTop: 10 }}>
                  {offer.title}
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 4 }}>
                  {offer.description}
                </div>
                <div style={{
                  marginTop: 10, padding: "6px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.2)", display: "inline-block",
                  fontSize: 13, fontWeight: 800, letterSpacing: "0.05em",
                }}>
                  {offer.code}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
