"use client";

import React, { useState, useEffect } from "react";
import {
  Tags,
  Plus,
  RefreshCw,
  FolderOpen,
  X,
} from "lucide-react";

export function CategoriesSection() {
  const [categories, setCategories] = useState<any[]>([]);
  const [cafeterias, setCafeterias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [cafeteriaId, setCafeteriaId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const [resCat, resCaf] = await Promise.all([
        fetch("/api/admin/categories"),
        fetch("/api/admin/cafeterias"),
      ]);
      const jsonCat = await resCat.json();
      const jsonCaf = await resCaf.json();
      if (jsonCat.success) setCategories(jsonCat.categories);
      if (jsonCaf.cafeterias) {
        setCafeterias(jsonCaf.cafeterias);
        if (jsonCaf.cafeterias.length > 0 && !cafeteriaId) {
          setCafeteriaId(jsonCaf.cafeterias[0].id);
        }
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, cafeteriaId }),
      });
      if (res.ok) {
        setModalOpen(false);
        setName("");
        fetchCategories();
      }
    } catch (err) {
      console.error("Create category error:", err);
    } finally {
      setSubmitting(false);
    }
  };

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
            Menu Categories & Meal Classifications
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--txt-muted, #64748B)" }}>
            Breakfast, Lunch, Snacks, Dinner, and Beverages category groupings.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          style={{
            padding: "9px 16px",
            borderRadius: 12,
            background: "var(--primary, #FF6B00)",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Plus size={15} /> Create Category
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>Loading categories...</div>
        ) : categories.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--txt-muted)" }}>No categories created.</div>
        ) : (
          categories.map((c) => (
            <div
              key={c.id}
              style={{
                background: "var(--surface, #FFFFFF)",
                border: "1px solid var(--border, #E2E8F0)",
                borderRadius: 18,
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: "var(--txt, #0F172A)" }}>{c.name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--primary, #FF6B00)", background: "var(--primary-light, #FFF7ED)", padding: "2px 8px", borderRadius: 6 }}>
                  {c.itemCount} items
                </span>
              </div>
              <div style={{ fontSize: 12, color: "var(--txt-muted)" }}>
                Cafeteria: {c.cafeteriaName}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div style={{ background: "var(--surface, #FFFFFF)", borderRadius: 20, maxWidth: 380, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Add New Category</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Category Name</label>
                <input
                  required
                  placeholder="e.g. Afternoon Snacks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 4 }}>Cafeteria</label>
                <select
                  value={cafeteriaId}
                  onChange={(e) => setCafeteriaId(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--border)" }}
                >
                  {cafeterias.map((caf) => (
                    <option key={caf.id} value={caf.id}>{caf.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 18px", borderRadius: 10, background: "var(--primary, #FF6B00)", color: "#FFFFFF", fontWeight: 700, border: "none", cursor: "pointer" }}
                >
                  {submitting ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
