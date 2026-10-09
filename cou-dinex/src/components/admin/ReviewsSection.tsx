"use client";

import React, { useState, useEffect } from "react";
import {
  Star,
  Search,
  RefreshCw,
  Utensils,
  ShoppingBag,
} from "lucide-react";

export function ReviewsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(5.0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingFilter, setRatingFilter] = useState("");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/reviews";
      if (ratingFilter) url += `?rating=${ratingFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setReviews(json.reviews);
        setAverageRating(json.averageRating);
        setTotalReviews(json.totalReviews);
      }
    } catch (err) {
      console.error("Fetch reviews error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Top Banner */}
      <div
        style={{
          background: "var(--surface, #FFFFFF)",
          border: "1px solid var(--border, #E2E8F0)",
          borderRadius: 20,
          padding: "18px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "var(--txt, #0F172A)" }}>
            Food Quality & Cafeteria Reviews
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Verified student diner feedback and star ratings across cafeteria recipes.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>Overall Rating</span>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#F59E0B", display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={18} fill="#F59E0B" /> {averageRating} / 5.0
            </div>
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid var(--border, #CBD5E1)", fontSize: 13, fontWeight: 600, background: "var(--surface, #FFFFFF)" }}
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
      </div>

      {/* Reviews Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>No customer reviews recorded yet.</div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              style={{
                background: "var(--surface, #FFFFFF)",
                border: "1px solid var(--border, #E2E8F0)",
                borderRadius: 18,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 800, color: "var(--txt, #0F172A)", fontSize: 14 }}>
                  {r.itemName}
                </span>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      color="#F59E0B"
                      fill={s <= r.rating ? "#F59E0B" : "transparent"}
                    />
                  ))}
                </div>
              </div>

              {r.comment && (
                <p style={{ margin: 0, fontSize: 13, color: "var(--txt-2, #475569)", fontStyle: "italic", lineHeight: 1.4 }}>
                  "{r.comment}"
                </p>
              )}

              <div style={{ fontSize: 11, color: "var(--txt-muted)", display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border, #F1F5F9)", paddingTop: 8 }}>
                <span>By {r.customerName}</span>
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
