"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap, Users, ArrowRight, CheckCircle2, UtensilsCrossed } from "lucide-react";

export default function RegisterSelectorPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "36px 16px",
        background: "linear-gradient(180deg, #F0FDFA 0%, #F8FAFC 60%, #F1F5F9 100%)",
        color: "#0F172A",
        fontFamily: "var(--font-sans), sans-serif",
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#CCFBF1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              boxShadow: "0 4px 12px rgba(15, 118, 110, 0.15)",
            }}
          >
            <UtensilsCrossed size={24} className="text-teal-700" />
          </div>
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#0F172A",
            }}
          >
            CoU <span style={{ color: "#0F766E" }}>Dine</span>
            <span style={{ color: "#F59E0B" }}>X</span>
          </span>
        </Link>

        {/* Tagline */}
        <p
          style={{
            color: "#0F766E",
            fontSize: 14,
            fontWeight: 600,
            margin: "0 0 16px 0",
            letterSpacing: "0.3px",
          }}
        >
          “Your Campus. Your Food. Your Time.”
        </p>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            margin: "0 0 6px 0",
            color: "#0F172A",
          }}
        >
          Choose Account Type
        </h1>
        <p style={{ color: "#64748B", fontSize: 14, margin: 0, maxWidth: 440 }}>
          Select your campus status to begin registering for cafeteria dining, pre-orders, and delivery.
        </p>
      </div>

      {/* Role Options */}
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 24,
        }}
      >
        {/* Student Card */}
        <Link
          href="/register/student"
          id="student-register-card"
          style={{
            textDecoration: "none",
            background: "#FFFFFF",
            border: "2px solid #CCFBF1",
            borderRadius: 24,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.25s ease",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(15, 118, 110, 0.06)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#0F766E";
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 16px 36px rgba(15, 118, 110, 0.16)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#CCFBF1";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(15, 118, 110, 0.06)";
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: "#CCFBF1",
                  color: "#0F766E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <GraduationCap size={30} />
              </div>

              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "#FEF3C7",
                  color: "#B45309",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                }}
              >
                Verification Required
              </span>
            </div>

            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: "0 0 8px 0",
                color: "#0F172A",
              }}
            >
              Student Account
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#64748B",
                lineHeight: 1.5,
                margin: "0 0 20px 0",
              }}
            >
              Exclusively for enrolled Comilla University students. Access cafeteria discounts, hall & department delivery, pre-orders, and Dine Points.
            </p>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 9,
                fontSize: 12,
                color: "#334155",
              }}
            >
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#0F766E" /> Official Student ID verification
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#0F766E" /> Residential hall & department delivery
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#0F766E" /> Class schedule synced meal timing
              </li>
            </ul>
          </div>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              borderTop: "1px solid #F1F5F9",
              color: "#0F766E",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <span>Register as Student</span>
            <ArrowRight size={18} />
          </div>
        </Link>

        {/* Visitor Card */}
        <Link
          href="/register/visitor"
          id="visitor-register-card"
          style={{
            textDecoration: "none",
            background: "#FFFFFF",
            border: "2px solid #E2E8F0",
            borderRadius: 24,
            padding: 32,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            transition: "all 0.25s ease",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#F59E0B";
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 16px 36px rgba(245, 158, 11, 0.16)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#E2E8F0";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.04)";
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 16,
                  background: "#FEF3C7",
                  color: "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Users size={30} />
              </div>

              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  background: "#DCFCE7",
                  color: "#15803D",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                }}
              >
                Instant Access
              </span>
            </div>

            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                margin: "0 0 8px 0",
                color: "#0F172A",
              }}
            >
              Guest / Visitor
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "#64748B",
                lineHeight: 1.5,
                margin: "0 0 20px 0",
              }}
            >
              For campus visitors, external guests, and diners. Order meals directly for cafeteria counter takeaway or table QR dining.
            </p>

            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 9,
                fontSize: 12,
                color: "#334155",
              }}
            >
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#D97706" /> Instant registration without student ID
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#D97706" /> Central cafeteria takeaway & pickup
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#D97706" /> Table QR order & mobile payments
              </li>
            </ul>
          </div>

          <div
            style={{
              marginTop: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              borderTop: "1px solid #F1F5F9",
              color: "#D97706",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <span>Register as Visitor</span>
            <ArrowRight size={18} />
          </div>
        </Link>
      </div>

      {/* Login link */}
      <div style={{ marginTop: 36, fontSize: 14, color: "#64748B" }}>
        Already have an account?{" "}
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
  );
}
