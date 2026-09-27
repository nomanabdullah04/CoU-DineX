"use client";

import * as React from "react";
import Link from "next/link";
import {
  Award,
  Leaf,
  Sparkles,
  TrendingUp,
  Gift,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  History,
  ShoppingBag,
  Info,
} from "lucide-react";

interface RewardsData {
  studentName: string;
  isVerified: boolean;
  points: number;
  totalOrders: number;
  pointsTier: {
    name: string;
    badge: string;
    color: string;
    discountMultiplier: number;
    nextTier?: string | null;
    pointsToNext?: number;
    progressPercent?: number;
  };
  milestones: Array<{
    id: string;
    title: string;
    targetOrders: number;
    rewardBonus: number;
    unlocked: boolean;
    description: string;
  }>;
  catalogue: Array<{
    id: string;
    title: string;
    pointsCost: number;
    discountAmount: number;
    minSpend: number;
    description: string;
  }>;
}

interface EcoScoreData {
  ecoScore: number;
  level: string;
  badge: string;
  color: string;
  description: string;
  disclaimer: string;
  sustainabilityIndicators: Array<{
    title: string;
    points: string;
    icon: string;
    description: string;
  }>;
  studentImpact: {
    reusableDineInCount: number;
    plantBasedOrders: number;
    digitalOnlyVouchers: number;
    estimatedPlasticSaved: string;
  };
}

export default function RewardsAndEcoPage() {
  const [rewards, setRewards] = React.useState<RewardsData | null>(null);
  const [eco, setEco] = React.useState<EcoScoreData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<"REWARDS" | "ECO">("REWARDS");
  const [redeemingId, setRedeemingId] = React.useState<string | null>(null);
  const [redeemedCode, setRedeemedCode] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [resRewards, resEco] = await Promise.all([
        fetch("/api/innovation/rewards", { cache: "no-store" }),
        fetch("/api/innovation/eco-score", { cache: "no-store" }),
      ]);
      if (resRewards.ok) {
        const jRewards = await resRewards.json();
        setRewards(jRewards);
      }
      if (resEco.ok) {
        const jEco = await resEco.json();
        setEco(jEco);
      }
    } catch (err) {
      console.error("Failed to load rewards/eco:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRedeem = async (voucherId: string) => {
    setRedeemingId(voucherId);
    try {
      const res = await fetch("/api/innovation/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voucherId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to redeem voucher.");
      setRedeemedCode(data.couponCode);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRedeemingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: 940, margin: "0 auto", padding: "40px 16px" }} className="animate-pulse space-y-4">
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 940, margin: "0 auto", paddingBottom: 60 }} className="space-y-6">
      {/* ── Header ── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0F766E 0%, #115E59 100%)",
          borderRadius: 24,
          padding: "26px 28px",
          color: "#FFFFFF",
          boxShadow: "0 12px 28px -6px rgba(15, 118, 110, 0.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <Award size={14} /> Student Loyalty & Sustainability
            </div>
            <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Rewards & Eco Score
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>
              Earn points with every meal, unlock higher student tiers, and practice eco-friendly dining.
            </p>
          </div>

          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 18,
              padding: "12px 20px",
              textAlign: "right",
              backdropFilter: "blur(6px)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85, fontWeight: 700 }}>
              YOUR BALANCE
            </div>
            <div style={{ fontSize: 26, fontWeight: 900 }}>
              {rewards?.points || 0} <span style={{ fontSize: 13, fontWeight: 600 }}>pts</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.9, marginTop: 2 }}>
              Tier: <strong>{rewards?.pointsTier.badge} {rewards?.pointsTier.name}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setActiveTab("REWARDS")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 700,
            border: activeTab === "REWARDS" ? "1px solid var(--primary)" : "1px solid var(--border)",
            background: activeTab === "REWARDS" ? "var(--primary)" : "var(--surface)",
            color: activeTab === "REWARDS" ? "#FFFFFF" : "var(--txt-2)",
            cursor: "pointer",
            boxShadow: activeTab === "REWARDS" ? "var(--shadow-primary)" : "none",
          }}
        >
          <Gift size={16} /> DineX Rewards & Vouchers
        </button>

        <button
          onClick={() => setActiveTab("ECO")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 700,
            border: activeTab === "ECO" ? "1px solid #10B981" : "1px solid var(--border)",
            background: activeTab === "ECO" ? "#10B981" : "var(--surface)",
            color: activeTab === "ECO" ? "#FFFFFF" : "var(--txt-2)",
            cursor: "pointer",
            boxShadow: activeTab === "ECO" ? "0 4px 14px rgba(16, 185, 129, 0.3)" : "none",
          }}
        >
          <Leaf size={16} /> Campus Eco Score
        </button>
      </div>

      {/* ── REWARDS TAB CONTENT ── */}
      {activeTab === "REWARDS" && rewards && (
        <div className="space-y-6">
          {/* Tier Progress Card */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 22,
              padding: "22px 26px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Current Loyalty Level</span>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: "var(--txt)", margin: "2px 0 0" }}>
                  {rewards.pointsTier.badge} {rewards.pointsTier.name} Member
                </h3>
              </div>
              {rewards.pointsTier.nextTier && (
                <div style={{ textAlign: "right", fontSize: 13, color: "var(--txt-muted)" }}>
                  Need <strong>{rewards.pointsTier.pointsToNext} pts</strong> for {rewards.pointsTier.nextTier}
                </div>
              )}
            </div>

            {/* Progress bar */}
            {rewards.pointsTier.progressPercent !== undefined && (
              <div>
                <div style={{ height: 10, borderRadius: 99, background: "var(--surface-2)", overflow: "hidden", position: "relative" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${rewards.pointsTier.progressPercent}%`,
                      background: "linear-gradient(90deg, #0F766E, #10B981)",
                      borderRadius: 99,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--txt-muted)", marginTop: 6 }}>
                  <span>{rewards.pointsTier.name} (Active)</span>
                  <span>{rewards.pointsTier.progressPercent}% to Next Level</span>
                  <span>{rewards.pointsTier.nextTier || "Max Tier Reached"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Redeemed Code Notification */}
          {redeemedCode && (
            <div
              style={{
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: 16,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <CheckCircle2 size={20} color="#10B981" />
                <div>
                  <div style={{ fontWeight: 800, color: "#10B981", fontSize: 14 }}>Voucher Redeemed Successfully!</div>
                  <div style={{ fontSize: 12, color: "var(--txt-muted)" }}>Use coupon code during checkout: <strong>{redeemedCode}</strong></div>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(redeemedCode);
                  alert(`Copied code: ${redeemedCode}`);
                }}
                style={{
                  padding: "6px 14px",
                  borderRadius: 10,
                  background: "#10B981",
                  color: "#FFF",
                  fontWeight: 700,
                  fontSize: 12,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Copy Code
              </button>
            </div>
          )}

          {/* Redeemable Catalogue */}
          <div className="space-y-3">
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--txt)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Gift size={18} color="var(--primary)" /> Redeemable Dining Vouchers
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rewards.catalogue.map((voucher) => {
                const canAfford = rewards.points >= voucher.pointsCost;
                return (
                  <div
                    key={voucher.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 20,
                      padding: "18px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, padding: "3px 8px", borderRadius: 8, background: "rgba(15, 118, 110, 0.12)", color: "var(--primary)" }}>
                          ৳{voucher.discountAmount} OFF
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 900, color: canAfford ? "var(--txt)" : "var(--txt-muted)" }}>
                          {voucher.pointsCost} pts
                        </span>
                      </div>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: "var(--txt)", margin: "0 0 6px" }}>
                        {voucher.title}
                      </h4>
                      <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: 0 }}>
                        {voucher.description}
                      </p>
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
                      <button
                        onClick={() => handleRedeem(voucher.id)}
                        disabled={!canAfford || redeemingId === voucher.id}
                        style={{
                          width: "100%",
                          padding: "9px",
                          borderRadius: 12,
                          background: canAfford ? "var(--primary)" : "var(--surface-2)",
                          color: canAfford ? "#FFFFFF" : "var(--txt-muted)",
                          border: "none",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: canAfford ? "pointer" : "not-allowed",
                        }}
                      >
                        {redeemingId === voucher.id ? "Redeeming..." : canAfford ? "Redeem Voucher" : `Need ${voucher.pointsCost - rewards.points} More Pts`}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order History Based Milestone Rewards */}
          <div className="space-y-3">
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--txt)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <History size={18} color="var(--primary)" /> Order History Milestones ({rewards.totalOrders} Completed Orders)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.milestones.map((m) => (
                <div
                  key={m.id}
                  style={{
                    background: "var(--surface)",
                    border: m.unlocked ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border)",
                    borderRadius: 18,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: m.unlocked ? "rgba(16, 185, 129, 0.12)" : "var(--surface-2)",
                        color: m.unlocked ? "#10B981" : "var(--txt-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {m.unlocked ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                        {m.title}
                      </h4>
                      <div style={{ fontSize: 12, color: "var(--txt-muted)", marginTop: 2 }}>
                        {m.description}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: 99,
                      background: m.unlocked ? "rgba(16, 185, 129, 0.12)" : "var(--surface-2)",
                      color: m.unlocked ? "#10B981" : "var(--txt-muted)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {m.unlocked ? `+${m.rewardBonus} Pts Added` : `${rewards.totalOrders}/${m.targetOrders} orders`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ECO SCORE TAB CONTENT ── */}
      {activeTab === "ECO" && eco && (
        <div className="space-y-6">
          {/* Main Eco Score Badge Card */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 22,
              padding: "24px 28px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                }}
              >
                {eco.badge}
              </div>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>
                  Campus Sustainability Index
                </span>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--txt)", margin: "2px 0 0" }}>
                  {eco.level} • {eco.ecoScore} / 100
                </h3>
                <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "4px 0 0" }}>
                  {eco.description}
                </p>
              </div>
            </div>

            {/* Configurable disclaimer warning required by spec */}
            <div
              style={{
                maxWidth: 320,
                padding: "12px 14px",
                borderRadius: 14,
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
                fontSize: 11,
                color: "var(--txt-muted)",
                display: "flex",
                gap: 8,
              }}
            >
              <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Notice:</strong> {eco.disclaimer}
              </div>
            </div>
          </div>

          {/* Student Estimated Impact Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Dine-in / Reusable</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#10B981", marginTop: 4 }}>
                {eco.studentImpact.reusableDineInCount} times
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Plant-Based Meals</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--primary)", marginTop: 4 }}>
                {eco.studentImpact.plantBasedOrders} meals
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Digital Receipts</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#3B82F6", marginTop: 4 }}>
                {eco.studentImpact.digitalOnlyVouchers} papers
              </div>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Est. Plastic Avoided</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "#10B981", marginTop: 4 }}>
                {eco.studentImpact.estimatedPlasticSaved}
              </div>
            </div>
          </div>

          {/* Sustainability Indicators (Configurable) */}
          <div className="space-y-3">
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--txt)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Leaf size={18} color="#10B981" /> Configurable Sustainability Indicators
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eco.sustainabilityIndicators.map((ind, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 18,
                    padding: "16px 18px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <span style={{ fontSize: 24 }}>{ind.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ fontSize: 14, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                        {ind.title}
                      </h4>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#10B981", background: "rgba(16, 185, 129, 0.1)", padding: "2px 8px", borderRadius: 99 }}>
                        {ind.points}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: "4px 0 0" }}>
                      {ind.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
