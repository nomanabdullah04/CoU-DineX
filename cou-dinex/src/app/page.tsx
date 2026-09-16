import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  UtensilsCrossed, Star, ArrowRight,
  Zap, CheckCircle, Clock, MapPin,
  Smartphone, Shield, ChevronRight,
  Building2, QrCode, Award, ShieldCheck,
  ShoppingBag, Search, Users, Send,
} from "lucide-react";
import { getItemImageUrl } from "@/lib/foodImages";

export const metadata: Metadata = {
  title: "CoU DineX — Smart University Cafeteria | Your Campus. Your Food. Your Time.",
  description:
    "Order food from Comilla University cafeteria, get it delivered to your hall or department. QR table ordering, live tracking, student discounts, and rewards.",
};

const FEATURES = [
  { icon: Smartphone, title: "Order Anywhere",   description: "Browse menu, order, and pay from your phone or laptop — anytime." },
  { icon: Building2, title: "Hall Delivery",    description: "Get food delivered directly to your hall room or department." },
  { icon: Clock, title: "Live Tracking",   description: "Track your order status in real-time from kitchen to delivery." },
  { icon: QrCode, title: "QR Table Order",  description: "Scan the QR code at your cafeteria table and order instantly." },
  { icon: Award, title: "Rewards & Eco",   description: "Earn loyalty points and eco score with every order you place." },
  { icon: ShieldCheck, title: "Secure Payments", description: "Pay safely with bKash, Nagad, card — or DineX wallet." },
];

const FOOD_PREVIEWS = [
  { name: "Chicken Biryani", price: 120, tag: "Popular", rating: 4.8, time: "15 min" },
  { name: "Beef Burger",     price: 85,  tag: "New",     rating: 4.5, time: "10 min" },
  { name: "Veg Fried Rice",  price: 70,  tag: "Healthy", rating: 4.6, time: "12 min" },
  { name: "Chicken Noodles", price: 80,  tag: "Special", rating: 4.7, time: "14 min" },
];

const STATS = [
  { value: "2,400+", label: "Active Students" },
  { value: "50+",    label: "Menu Items" },
  { value: "4.8",    label: "Student Rating" },
  { value: "< 20m",  label: "Avg. Delivery" },
];

const STEPS = [
  { step: "01", icon: Search, title: "Browse & Choose", desc: "Explore the cafeteria menu, filter by category, and find your favourite food." },
  { step: "02", icon: ShoppingBag, title: "Order & Pay",     desc: "Add items to cart, choose delivery or pickup, and pay securely in seconds." },
  { step: "03", icon: Send, title: "Track & Receive", desc: "Watch your order get prepared and delivered live on the campus map." },
];

/* ─── Reusable inner container ─── */
function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`dinex-container ${className}`}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg)",
        color: "var(--txt)",
        fontFamily: "Inter, 'Noto Sans Bengali', sans-serif",
      }}
    >

      {/* ═══════════════════════════════════
          NAVBAR
          ═══════════════════════════════════ */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backgroundColor: "rgba(var(--surface), 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 16px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          {/* Brand */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div
              className="dinex-gradient-primary"
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "var(--shadow-primary)",
                flexShrink: 0,
              }}
            >
              <UtensilsCrossed size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "var(--txt)", letterSpacing: "-0.02em", lineHeight: 1 }}>
                CoU DineX
              </div>
              <div style={{ fontSize: 10, color: "var(--txt-muted)", fontWeight: 500, marginTop: 1 }}>
                Comilla University
              </div>
            </div>
          </Link>

          {/* Nav links (desktop) */}
          <nav style={{ display: "flex", gap: 24, alignItems: "center" }} className="hidden md:flex">
            {["Features", "How it Works", "For Visitors"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                style={{ fontSize: 14, fontWeight: 500, color: "var(--txt-2)", textDecoration: "none" }}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link
              href="/auth/login"
              style={{
                height: 36, padding: "0 16px",
                display: "flex", alignItems: "center",
                fontSize: 14, fontWeight: 600,
                color: "var(--primary)",
                borderRadius: 10,
                textDecoration: "none",
              }}
              className="hidden sm:flex"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              style={{
                height: 36, padding: "0 16px",
                display: "flex", alignItems: "center",
                fontSize: 14, fontWeight: 700,
                color: "white",
                background: "var(--primary)",
                borderRadius: 10,
                textDecoration: "none",
                boxShadow: "var(--shadow-primary)",
                whiteSpace: "nowrap",
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════
          HERO
          ═══════════════════════════════════ */}
      <section className="dinex-gradient-hero" style={{ position: "relative", overflow: "hidden" }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: 500, height: 500, borderRadius: "50%",
          background: "var(--primary)", opacity: 0.08,
          transform: "translate(30%, -30%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          width: 350, height: 350, borderRadius: "50%",
          background: "var(--accent)", opacity: 0.08,
          transform: "translate(-40%, 40%)",
          pointerEvents: "none",
        }} />

        <Container>
          <div style={{ paddingTop: 80, paddingBottom: 96, maxWidth: 680, position: "relative" }}>
            {/* Live badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 99, padding: "6px 14px", marginBottom: 24,
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />
              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 500 }}>
                Now live at Comilla University
              </span>
            </div>

            {/* Heading */}
            <h1 style={{
              fontSize: "clamp(36px, 6vw, 60px)",
              fontWeight: 900,
              color: "white",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 20,
            }}>
              Your Campus.<br />
              Your Food.<br />
              <span style={{ color: "var(--accent)" }}>Your Time.</span>
            </h1>

            {/* Subtext */}
            <p style={{
              fontSize: "clamp(15px, 2vw, 18px)",
              color: "rgba(255,255,255,0.7)",
              marginBottom: 32,
              lineHeight: 1.7,
              maxWidth: 520,
            }}>
              Order from Comilla University cafeteria, track your food live, and
              get it delivered to your hall, department, or table — all in one platform.
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <Link
                href="/auth/register"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 52, padding: "0 28px",
                  background: "var(--accent)", color: "white",
                  fontWeight: 800, fontSize: 16,
                  borderRadius: 14, textDecoration: "none",
                  boxShadow: "0 4px 20px rgba(245,158,11,0.4)",
                }}
              >
                Start Ordering <ArrowRight size={18} />
              </Link>
              <Link
                href="/auth/guest"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 52, padding: "0 28px",
                  background: "rgba(255,255,255,0.1)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.25)",
                  color: "white", fontWeight: 600, fontSize: 16,
                  borderRadius: 14, textDecoration: "none",
                }}
              >
                Continue as Guest
              </Link>
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex" }}>
                {["NA", "RA", "SM", "TH"].map((init, i) => (
                  <div
                    key={i}
                    style={{
                      width: 32, height: 32, borderRadius: "50%",
                      border: "2px solid rgba(15,94,89,0.6)",
                      background: "linear-gradient(135deg, #2DD4BF, #0F766E)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "white",
                      marginLeft: i > 0 ? -8 : 0,
                      zIndex: 4 - i,
                      position: "relative",
                    }}
                  >
                    {init}
                  </div>
                ))}
              </div>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                <strong style={{ color: "white" }}>2,400+</strong> CoU students ordering daily
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════
          STATS BAR
          ═══════════════════════════════════ */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", borderTop: "1px solid var(--border)" }}>
        <Container>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            padding: "28px 0",
          }}
            className="sm:grid-cols-4"
          >
            {STATS.map(({ value, label }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <p style={{ fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 900, color: "var(--primary)", margin: 0 }}>
                  {value}
                </p>
                <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: 0, marginTop: 2 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════
          FOOD PREVIEW
          ═══════════════════════════════════ */}
      <section style={{ padding: "64px 0" }} id="menu">
        <Container>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "var(--txt)", marginBottom: 12 }}>
              What&apos;s on the Menu Today?
            </h2>
            <p style={{ color: "var(--txt-2)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Fresh food made daily at the CoU cafeteria — browse, order, and enjoy.
            </p>
          </div>

          {/* Cards grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
            className="lg:grid-cols-4"
          >
            {FOOD_PREVIEWS.map((food) => (
              <div
                key={food.name}
                className="dinex-card"
                style={{ borderRadius: 20, overflow: "hidden", cursor: "pointer" }}
              >
                <div style={{
                  position: "relative",
                  height: 140,
                  background: "var(--surface-2)",
                  overflow: "hidden",
                }}>
                  <Image
                    src={getItemImageUrl(food.name)}
                    alt={food.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>

                {/* Info */}
                <div style={{ padding: 14 }}>
                  <span style={{
                    display: "inline-block",
                    fontSize: 10, fontWeight: 700,
                    background: "var(--primary-light)", color: "var(--primary-dark)",
                    padding: "2px 8px", borderRadius: 99,
                    marginBottom: 6,
                  }}>
                    {food.tag}
                  </span>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: "var(--txt)", margin: "0 0 6px 0" }}>
                    {food.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 16, color: "var(--primary)" }}>
                        ৳{food.price}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--txt-muted)", marginLeft: 6 }}>
                        ★ {food.rating}
                      </span>
                    </div>
                    <button
                      style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "var(--primary)", color: "white",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, fontWeight: 700,
                      }}
                      aria-label={`Add ${food.name} to cart`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* View more link */}
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <Link
              href="/auth/register"
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                color: "var(--primary)", fontWeight: 600, fontSize: 14,
                textDecoration: "none",
              }}
            >
              View full menu after login <ChevronRight size={14} />
            </Link>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════
          FEATURES
          ═══════════════════════════════════ */}
      <section
        id="features"
        style={{ padding: "64px 0", background: "var(--surface)", borderTop: "1px solid var(--border)" }}
      >
        <Container>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "var(--txt)", marginBottom: 12 }}>
              Everything You Need for{" "}
              <span className="dinex-text-gradient">Campus Dining</span>
            </h2>
            <p style={{ color: "var(--txt-2)", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
              Built specifically for Comilla University — not a generic food app clone.
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(1, 1fr)",
            gap: 16,
          }}
            className="sm:grid-cols-2 lg:grid-cols-3"
          >
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div key={title} className="feature-card">
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "var(--primary-light)", color: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={24} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: "var(--txt)", marginBottom: 8 }}>
                  {title}
                </h3>
                <p style={{ fontSize: 14, color: "var(--txt-2)", lineHeight: 1.65, margin: 0 }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: "64px 0" }}>
        <Container>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 900, color: "var(--txt)", marginBottom: 12 }}>
              Order in 3 Simple Steps
            </h2>
            <p style={{ color: "var(--txt-2)", fontSize: 16 }}>From hunger to happy in minutes.</p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(1, 1fr)",
            gap: 32,
          }}
            className="md:grid-cols-3"
          >
            {STEPS.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{ position: "relative", marginBottom: 20 }}>
                  <div
                    className="dinex-gradient-primary"
                    style={{
                      width: 80, height: 80, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white",
                      boxShadow: "var(--shadow-primary)",
                    }}
                  >
                    <Icon size={32} />
                  </div>
                  <span
                    style={{
                      position: "absolute", top: -4, right: -4,
                      width: 26, height: 26, borderRadius: "50%",
                      background: "var(--accent)", color: "white",
                      fontSize: 11, fontWeight: 900,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {step}
                  </span>
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 19, color: "var(--txt)", marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "var(--txt-2)", maxWidth: 260, lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════
          FOR VISITORS
          ═══════════════════════════════════ */}
      <section
        id="for-visitors"
        style={{ padding: "64px 0", background: "var(--surface)", borderTop: "1px solid var(--border)" }}
      >
        <Container>
          <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, color: "var(--primary)" }}>
              <Users size={52} />
            </div>
            <h2 style={{ fontSize: "clamp(24px, 4vw, 34px)", fontWeight: 900, color: "var(--txt)", marginBottom: 12 }}>
              Visiting CoU Campus?
            </h2>
            <p style={{ fontSize: 16, color: "var(--txt-2)", marginBottom: 32, lineHeight: 1.7 }}>
              You don&apos;t need a university account. Guests can browse the menu
              and order from approved campus locations easily.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link
                href="/auth/guest"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 48, padding: "0 28px",
                  background: "var(--primary)", color: "white",
                  fontWeight: 700, fontSize: 15,
                  borderRadius: 12, textDecoration: "none",
                  boxShadow: "var(--shadow-primary)",
                }}
              >
                Continue as Guest <ArrowRight size={16} />
              </Link>
              <Link
                href="/auth/register"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 48, padding: "0 28px",
                  border: "2px solid var(--primary)", color: "var(--primary)",
                  fontWeight: 700, fontSize: 15,
                  borderRadius: 12, textDecoration: "none",
                  background: "transparent",
                }}
              >
                Create Student Account
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════
          CTA BANNER
          ═══════════════════════════════════ */}
      <section style={{ padding: "64px 0" }}>
        <Container>
          <div
            className="dinex-gradient-hero"
            style={{
              borderRadius: 24, padding: "clamp(32px, 5vw, 64px)",
              textAlign: "center", position: "relative", overflow: "hidden",
            }}
          >
            {/* Deco circles */}
            <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", transform: "translate(30%, -30%)" }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, width: 150, height: 150, borderRadius: "50%", background: "rgba(245,158,11,0.08)", transform: "translate(-30%, 30%)" }} />

            <div style={{ position: "relative" }}>
              <h2 style={{
                fontSize: "clamp(22px, 4vw, 36px)",
                fontWeight: 900, color: "white",
                marginBottom: 12, lineHeight: 1.2,
              }}>
                Ready to Upgrade Your<br />Campus Dining Experience?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 28, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>
                Join thousands of CoU students already using DineX. Sign up for free and start ordering.
              </p>

              {/* Checklist */}
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "8px 20px",
                justifyContent: "center", marginBottom: 28,
              }}>
                {["Free to sign up", "Student verification", "Secure payments", "Real-time tracking"].map((item) => (
                  <span key={item} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.8)", fontSize: 14 }}>
                    <CheckCircle size={14} color="var(--accent)" />
                    {item}
                  </span>
                ))}
              </div>

              <Link
                href="/auth/register"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  height: 56, padding: "0 36px",
                  background: "var(--accent)", color: "white",
                  fontWeight: 900, fontSize: 17,
                  borderRadius: 14, textDecoration: "none",
                  boxShadow: "0 4px 24px rgba(245,158,11,0.4)",
                }}
              >
                Create Free Account <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ═══════════════════════════════════
          FOOTER
          ═══════════════════════════════════ */}
      <footer style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        padding: "32px 0",
      }}>
        <Container>
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
            className="md:flex-row md:justify-between"
          >
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                className="dinex-gradient-primary"
                style={{ width: 32, height: 32, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <UtensilsCrossed size={14} color="white" />
              </div>
              <div>
                <span style={{ fontWeight: 900, fontSize: 15, color: "var(--txt)" }}>CoU DineX</span>
                <span style={{ fontSize: 12, color: "var(--txt-muted)", marginLeft: 8 }}>Comilla University</span>
              </div>
            </div>

            {/* Links */}
            <nav style={{ display: "flex", gap: 20 }}>
              {["Privacy", "Terms", "Contact", "Help"].map((item) => (
                <a key={item} href={`/${item.toLowerCase()}`} style={{ fontSize: 13, color: "var(--txt-muted)", textDecoration: "none" }}>
                  {item}
                </a>
              ))}
            </nav>

            <p style={{ fontSize: 12, color: "var(--txt-muted)", margin: 0 }}>
              © 2026 CoU DineX. All rights reserved.
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}
