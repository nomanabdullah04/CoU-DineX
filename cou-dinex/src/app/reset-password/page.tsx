"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, UtensilsCrossed } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [tokenInput, setTokenInput] = React.useState(token);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const activeToken = token || tokenInput;
    if (!activeToken.trim()) {
      setError("Password reset token is missing. Please check your reset link.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters with letters and numbers.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: activeToken.trim(),
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
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
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px 0", color: "#0F172A" }}>
          Set New Password
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
          Create a secure password with at least 8 characters
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

      {success ? (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#DCFCE7",
              color: "#16A34A",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px auto",
            }}
          >
            <CheckCircle2 size={32} />
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px 0", color: "#0F172A" }}>
            Password Reset Successful!
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 24px 0", lineHeight: 1.5 }}>
            Your account credentials have been updated securely. You can now sign in with your new password.
          </p>

          <button
            onClick={() => router.push("/login")}
            style={{
              width: "100%",
              padding: "13px 20px",
              borderRadius: 12,
              border: "none",
              background: "#0F766E",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
            }}
          >
            <span>Proceed to Sign In</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!token && (
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#334155",
                  marginBottom: 6,
                }}
              >
                Reset Token
              </label>
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter reset token from email"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: 12,
                  color: "#0F172A",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              New Password
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="•••••••••••••••"
                style={{
                  width: "100%",
                  padding: "11px 40px 11px 42px",
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: 12,
                  color: "#0F172A",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748B",
                  cursor: "pointer",
                  padding: 4,
                }}
                aria-label="Toggle password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                color: "#334155",
                marginBottom: 6,
              }}
            >
              Confirm New Password
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
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                style={{
                  width: "100%",
                  padding: "11px 14px 11px 42px",
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: 12,
                  color: "#0F172A",
                  fontSize: 14,
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 6,
              padding: "13px 20px",
              borderRadius: 12,
              border: "none",
              background: submitting ? "#94A3B8" : "#0F766E",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
            }}
          >
            {submitting ? "Resetting Password..." : "Update Password"}
            {!submitting && <ArrowRight size={16} />}
          </button>
        </form>
      )}

      <div
        style={{
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #E2E8F0",
          textAlign: "center",
          fontSize: 13,
          color: "#64748B",
        }}
      >
        <Link href="/login" style={{ color: "#0F766E", fontWeight: 600, textDecoration: "none" }}>
          ← Return to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px 16px",
        background: "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 60%, #F1F5F9 100%)",
        color: "#0F172A",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "#CCFBF1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
            }}
          >
            <UtensilsCrossed size={22} className="text-teal-700" />
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#0F172A" }}>
            CoU <span style={{ color: "#0F766E" }}>Dine</span>
            <span style={{ color: "#F59E0B" }}>X</span>
          </span>
        </Link>
      </div>

      <React.Suspense fallback={<div style={{ color: "#64748B" }}>Loading reset form...</div>}>
        <ResetPasswordContent />
      </React.Suspense>
    </div>
  );
}
