"use client";

import * as React from "react";
import Link from "next/link";
import { Mail, ArrowRight, AlertCircle, CheckCircle2, UtensilsCrossed } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to send password reset request.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

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
            Forgot Password
          </h1>
          {/* Exact SRS Wireframe text */}
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
            Forgot your password? Enter your registered email.
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
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 16px",
                borderRadius: 14,
                background: "#DCFCE7",
                border: "1px solid #BBF7D0",
                color: "#166534",
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong>Reset Link Sent!</strong> If an account exists for {email}, a password reset link has been dispatched.
              </div>
            </div>

            {resetToken && (
              <div
                style={{
                  background: "#F0FDFA",
                  border: "1px solid #CCFBF1",
                  borderRadius: 12,
                  padding: "14px",
                  fontSize: 12,
                  color: "#0F766E",
                  marginBottom: 20,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>Direct Reset Link (Campus Dev):</div>
                <Link
                  href={`/reset-password?token=${resetToken}`}
                  style={{
                    color: "#0F766E",
                    fontWeight: 700,
                    textDecoration: "underline",
                    wordBreak: "break-all",
                  }}
                >
                  Click here to set new password →
                </Link>
              </div>
            )}

            <Link
              href="/login"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                borderRadius: 12,
                background: "#0F766E",
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
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
                Registered Email
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
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="noman@example.com"
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
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#0F766E")}
                  onBlur={(e) => (e.target.style.borderColor = "#CBD5E1")}
                />
              </div>
            </div>

            {/* Exact SRS Button: [ Send Reset Link ] */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: 4,
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
              {submitting ? "Sending Reset Link..." : "Send Reset Link"}
              {!submitting && <ArrowRight size={16} />}
            </button>
          </form>
        )}

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
          Remember your password?{" "}
          <Link
            href="/login"
            style={{
              color: "#0F766E",
              fontWeight: 700,
              textDecoration: "none",
              marginLeft: 4,
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
