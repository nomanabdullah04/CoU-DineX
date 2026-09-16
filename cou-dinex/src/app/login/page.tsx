"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { UtensilsCrossed, Eye, EyeOff, Lock, UserCheck, AlertCircle, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/home";

  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your University ID or Email address.");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Success — intelligently redirect by role
      const userRole = data.user?.role;
      let roleDefault = "/home";

      if (userRole === "CAFETERIA_STAFF") {
        roleDefault = "/kitchen";
      } else if (userRole === "CAFETERIA_ADMIN" || userRole === "SUPER_ADMIN") {
        roleDefault = "/admin";
      } else if (userRole === "DELIVERY_AGENT") {
        roleDefault = "/delivery";
      }

      // If user is staff or admin, never let an accidental callbackUrl to /home redirect them to student home
      let destination = roleDefault;
      if (callbackUrl && callbackUrl !== "/" && callbackUrl !== "/home") {
        destination = callbackUrl;
      }

      // Force full window navigation so cookies, session, and role layout hydrate cleanly
      window.location.href = destination;
    } catch {
      setError("Unable to connect to server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 24,
        padding: "36px 32px",
        boxShadow: "0 10px 30px rgba(15, 118, 110, 0.08)",
      }}
    >
      {/* SRS Plate & Fork/Spoon Icon + Branding */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "#CCFBF1",
            color: "#0F766E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto",
            fontSize: 26,
            boxShadow: "0 4px 12px rgba(15, 118, 110, 0.15)",
          }}
        >
          <UtensilsCrossed size={26} />
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: "0 0 6px 0",
            letterSpacing: "-0.5px",
            color: "#0F172A",
          }}
        >
          CoU <span style={{ color: "#0F766E" }}>Dine</span>
          <span style={{ color: "#F59E0B" }}>X</span>
        </h1>

        {/* Exact SRS Tagline */}
        <p
          style={{
            fontSize: 13,
            color: "#64748B",
            fontWeight: 500,
            margin: "0 0 2px 0",
            lineHeight: 1.4,
          }}
        >
          Your Campus. Your Food.
        </p>
        <p
          style={{
            fontSize: 13,
            color: "#0F766E",
            fontWeight: 600,
            margin: 0,
            letterSpacing: "0.2px",
          }}
        >
          Your Time.
        </p>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 14px",
            borderRadius: 12,
            background: "#FEE2E2",
            border: "1px solid #FECACA",
            color: "#DC2626",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Exact SRS Field: University ID / Email */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 7,
            }}
          >
            University ID / Email
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                display: "flex",
              }}
            >
              <UserCheck size={18} />
            </span>
            <input
              type="text"
              id="identifier-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. 11908001 or student@cou.ac.bd"
              style={{
                width: "100%",
                padding: "12px 14px 12px 42px",
                background: "#F8FAFC",
                border: "1px solid #CBD5E1",
                borderRadius: 12,
                color: "#0F172A",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
              onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
            />
          </div>
        </div>

        {/* Exact SRS Field: Password with Eye toggle */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: 13,
              fontWeight: 600,
              color: "#334155",
              marginBottom: 7,
            }}
          >
            Password
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94A3B8",
                display: "flex",
              }}
            >
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              id="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••••••••••"
              style={{
                width: "100%",
                padding: "12px 42px 12px 42px",
                background: "#F8FAFC",
                border: "1px solid #CBD5E1",
                borderRadius: 12,
                color: "#0F172A",
                fontSize: 14,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
              onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                color: "#64748B",
                cursor: "pointer",
                display: "flex",
                padding: 4,
              }}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Forgot Password Link (SRS placement) */}
        <div style={{ textAlign: "center", marginTop: 2 }}>
          <Link
            href="/forgot-password"
            style={{
              fontSize: 13,
              color: "#0F766E",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Forgot Password?
          </Link>
        </div>

        {/* Sign In Button: Deep Campus Green #0F766E */}
        <button
          type="submit"
          id="signin-button"
          disabled={loading}
          style={{
            marginTop: 4,
            padding: "13px 20px",
            borderRadius: 12,
            border: "none",
            background: loading ? "#94A3B8" : "#0F766E",
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = "#115E59";
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = "#0F766E";
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
          {!loading && <ArrowRight size={17} />}
        </button>
      </form>

      {/* SRS Footer: Don't have an account? Create Account */}
      <div
        style={{
          marginTop: 26,
          paddingTop: 18,
          borderTop: "1px solid #E2E8F0",
          textAlign: "center",
          fontSize: 13,
          color: "#64748B",
        }}
      >
        Don't have an account?{" "}
        <Link
          href="/register"
          style={{
            color: "#0F766E",
            fontWeight: 700,
            textDecoration: "none",
            marginLeft: 4,
          }}
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        background: "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 60%, #F1F5F9 100%)",
        color: "#0F172A",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      <React.Suspense fallback={<div style={{ color: "#64748B" }}>Loading...</div>}>
        <LoginForm />
      </React.Suspense>
    </div>
  );
}
