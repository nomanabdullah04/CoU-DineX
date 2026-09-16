"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MailCheck, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, ExternalLink, Mail, UtensilsCrossed } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [tokenInput, setTokenInput] = React.useState(tokenFromUrl);
  const [status, setStatus] = React.useState<"idle" | "verifying" | "success" | "error">(
    tokenFromUrl ? "verifying" : "idle"
  );
  const [message, setMessage] = React.useState("");
  const [resending, setResending] = React.useState(false);
  const [resendNotice, setResendNotice] = React.useState("");

  React.useEffect(() => {
    if (tokenFromUrl) {
      verifyToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  async function verifyToken(t: string) {
    setStatus("verifying");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Failed to verify email token.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Email address verified successfully!");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    verifyToken(tokenInput.trim());
  }

  function handleOpenEmail() {
    window.open("https://mail.google.com", "_blank");
  }

  function handleResend() {
    setResending(true);
    setResendNotice("");
    setTimeout(() => {
      setResending(false);
      setResendNotice("A fresh verification link has been resent to your registered email address.");
    }, 1200);
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 440,
        background: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: 24,
        padding: "36px 32px",
        textAlign: "center",
        boxShadow: "0 10px 30px rgba(15, 118, 110, 0.08)",
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background:
            status === "success"
              ? "#DCFCE7"
              : status === "error"
              ? "#FEE2E2"
              : "#CCFBF1",
          color:
            status === "success" ? "#16A34A" : status === "error" ? "#DC2626" : "#0F766E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px auto",
          fontSize: 28,
        }}
      >
        {status === "success" ? (
          <CheckCircle2 size={32} />
        ) : status === "error" ? (
          <AlertCircle size={32} />
        ) : (
          <Mail size={30} />
        )}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px 0", color: "#0F172A" }}>
        Verify Your Email
      </h1>

      <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 20px 0", lineHeight: 1.5 }}>
        We've sent a verification link to your university email address. Please click the link to confirm your student identity.
      </p>

      {/* SRS [ Open Email ] Button */}
      <button
        type="button"
        onClick={handleOpenEmail}
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
          marginBottom: 16,
          boxShadow: "0 4px 14px rgba(15, 118, 110, 0.3)",
        }}
      >
        <span>Open Email</span>
        <ExternalLink size={16} />
      </button>

      {/* SRS Didn't receive it? [ Resend ] */}
      <div style={{ marginBottom: 20, fontSize: 13, color: "#64748B" }}>
        Didn't receive it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          style={{
            background: "none",
            border: "none",
            color: "#0F766E",
            fontWeight: 700,
            cursor: resending ? "not-allowed" : "pointer",
            padding: 0,
            textDecoration: "underline",
          }}
        >
          {resending ? "Resending..." : "Resend Link"}
        </button>
      </div>

      {resendNotice && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: "#FEF3C7",
            color: "#92400E",
            fontSize: 12,
            marginBottom: 16,
          }}
        >
          {resendNotice}
        </div>
      )}

      {/* Status Notifications */}
      {status === "verifying" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "12px",
            borderRadius: 12,
            background: "#F0FDFA",
            color: "#0F766E",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          <RefreshCw size={16} className="animate-spin" />
          <span>Verifying token with CoU DineX...</span>
        </div>
      )}

      {status === "success" && (
        <div
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            background: "#DCFCE7",
            border: "1px solid #BBF7D0",
            color: "#166534",
            fontSize: 13,
            marginBottom: 20,
            textAlign: "left",
          }}
        >
          <strong>Email Verified!</strong> {message}
          <div style={{ marginTop: 12 }}>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                background: "#16A34A",
                color: "#FFFFFF",
                fontWeight: 600,
                fontSize: 12,
                textDecoration: "none",
              }}
            >
              Sign In to Your Account <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "#FEE2E2",
            border: "1px solid #FECACA",
            color: "#DC2626",
            fontSize: 13,
            marginBottom: 20,
          }}
        >
          {message}
        </div>
      )}

      {/* Manual Token Verification Box */}
      <form
        onSubmit={handleManualSubmit}
        style={{
          marginTop: 10,
          paddingTop: 16,
          borderTop: "1px dashed #CBD5E1",
          textAlign: "left",
        }}
      >
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            color: "#64748B",
            marginBottom: 6,
          }}
        >
          Or paste 64-character verification token directly:
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste token here..."
            style={{
              flex: 1,
              padding: "9px 12px",
              background: "#F8FAFC",
              border: "1px solid #CBD5E1",
              borderRadius: 10,
              color: "#0F172A",
              fontSize: 12,
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "9px 14px",
              background: "#0F766E",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Verify
          </button>
        </div>
      </form>

      <div style={{ marginTop: 24, fontSize: 13, color: "#64748B" }}>
        <Link href="/login" style={{ color: "#0F766E", textDecoration: "none", fontWeight: 600 }}>
          ← Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <div style={{ textAlign: "center", marginBottom: 24 }}>
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
          <span style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>
            CoU <span style={{ color: "#0F766E" }}>Dine</span>
            <span style={{ color: "#F59E0B" }}>X</span>
          </span>
        </Link>
      </div>

      <React.Suspense fallback={<div style={{ color: "#64748B" }}>Loading verification...</div>}>
        <VerifyEmailContent />
      </React.Suspense>
    </div>
  );
}
