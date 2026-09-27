"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  BookOpen,
  MapPin,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Building,
  GraduationCap,
} from "lucide-react";

interface ScheduleItem {
  id: string;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  building: string;
}

interface ClassRecommendation {
  type: "BEFORE_CLASS" | "AFTER_CLASS" | "NO_CLASSES_TODAY";
  courseName?: string;
  room?: string;
  suggestedTargetTime?: string;
  message: string;
  reason: string;
  suggestedAction: string;
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
const COU_BUILDINGS = [
  "Administrative Building",
  "Faculty of Science Building",
  "Faculty of Arts Building",
  "Faculty of Social Science Building",
  "Faculty of Business Studies",
  "Central Library",
  "Central Cafeteria",
];

export default function ClassSchedulePage() {
  const [schedules, setSchedules] = React.useState<ScheduleItem[]>([]);
  const [recommendations, setRecommendations] = React.useState<ClassRecommendation[]>([]);
  const [currentDay, setCurrentDay] = React.useState<string>("Sunday");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedDayTab, setSelectedDayTab] = React.useState<string>("All");

  // Form State
  const [courseName, setCourseName] = React.useState("");
  const [dayOfWeek, setDayOfWeek] = React.useState("Sunday");
  const [startTime, setStartTime] = React.useState("10:00");
  const [endTime, setEndTime] = React.useState("11:30");
  const [room, setRoom] = React.useState("");
  const [building, setBuilding] = React.useState("Faculty of Science Building");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchScheduleData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/innovation/class-schedule", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        setSchedules(json.schedules || []);
        setRecommendations(json.recommendations || []);
        setCurrentDay(json.currentDay || "Sunday");
      }
    } catch (err) {
      console.error("Failed to load schedule:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/innovation/class-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName,
          dayOfWeek,
          startTime,
          endTime,
          room: room.trim() || "Room 101",
          building,
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setCourseName("");
        setRoom("");
        await fetchScheduleData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to add schedule.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save schedule.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm("Are you sure you want to remove this class from your routine?")) return;
    try {
      const res = await fetch(`/api/innovation/class-schedule?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        await fetchScheduleData();
      }
    } catch (err) {
      console.error("Failed to delete schedule:", err);
    }
  };

  const filteredSchedules = selectedDayTab === "All"
    ? schedules
    : schedules.filter((s) => s.dayOfWeek.toLowerCase() === selectedDayTab.toLowerCase());

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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
            <GraduationCap size={14} /> Academic Sync
          </div>
          <h1 style={{ fontSize: "clamp(22px, 3.5vw, 28px)", fontWeight: 900, margin: "0 0 6px", letterSpacing: "-0.02em" }}>
            Class Schedule Pre-order
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: 13 }}>
            Sync your class timetable so your warm meal is waiting for you between classes.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 20px",
            borderRadius: 14,
            background: "#FFFFFF",
            color: "#0F766E",
            fontWeight: 800,
            fontSize: 14,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
          }}
        >
          <Plus size={18} /> Add Class Routine
        </button>
      </div>

      {/* ── Smart Recommendation Banners ── */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--txt-muted)", textTransform: "uppercase" }}>
            <Sparkles size={15} color="var(--primary)" /> Smart Campus Meal Suggestions
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface)",
                  borderRadius: 20,
                  padding: "20px",
                  border: rec.type === "BEFORE_CLASS" ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid rgba(16, 185, 129, 0.4)",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 800,
                        background: rec.type === "BEFORE_CLASS" ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                        color: rec.type === "BEFORE_CLASS" ? "#F59E0B" : "#10B981",
                      }}
                    >
                      {rec.type === "BEFORE_CLASS" ? "⚡ Quick Pre-Class Bite" : "🍽️ Post-Class Lunch/Dinner"}
                    </span>
                    {rec.suggestedTargetTime && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--txt-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={13} /> Target: {rec.suggestedTargetTime}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: "0 0 6px" }}>
                    “{rec.message}”
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: 0 }}>
                    {rec.reason}
                  </p>
                </div>

                <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  <Link
                    href="/explore"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      width: "100%",
                      padding: "10px 16px",
                      borderRadius: 12,
                      background: "var(--primary)",
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    <ShoppingBag size={15} /> {rec.suggestedAction} <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Day Filter Tabs ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
          {["All", ...DAYS_OF_WEEK].map((day) => {
            const isSelected = selectedDayTab.toLowerCase() === day.toLowerCase();
            const count = day === "All"
              ? schedules.length
              : schedules.filter((s) => s.dayOfWeek.toLowerCase() === day.toLowerCase()).length;
            return (
              <button
                key={day}
                onClick={() => setSelectedDayTab(day)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 16px",
                  borderRadius: 99,
                  fontSize: 13,
                  fontWeight: 700,
                  border: isSelected ? "1px solid var(--primary)" : "1px solid var(--border)",
                  background: isSelected ? "var(--primary)" : "var(--surface)",
                  color: isSelected ? "#FFFFFF" : "var(--txt-2)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{day}</span>
                <span style={{ fontSize: 11, opacity: 0.8 }}>({count})</span>
              </button>
            );
          })}
        </div>

        <div style={{ fontSize: 13, color: "var(--txt-muted)", fontWeight: 600 }}>
          Today is <strong>{currentDay}</strong>
        </div>
      </div>

      {/* ── Schedules List ── */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            borderRadius: 22,
            padding: "40px 24px",
            textAlign: "center",
            border: "1px dashed var(--border)",
          }}
        >
          <Calendar size={40} color="var(--txt-muted)" className="mx-auto mb-3" />
          <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--txt)", margin: "0 0 6px" }}>
            No classes scheduled for {selectedDayTab}
          </h3>
          <p style={{ fontSize: 13, color: "var(--txt-muted)", margin: "0 0 16px" }}>
            Add your course lecture times to unlock smart pre-order notifications before and after class.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 12,
              background: "var(--primary)",
              color: "#FFF",
              fontWeight: 700,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Add Your First Class
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((item) => (
            <div
              key={item.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "18px 20px",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: "rgba(15, 118, 110, 0.12)",
                      color: "var(--primary)",
                    }}
                  >
                    {item.dayOfWeek}
                  </span>

                  <button
                    onClick={() => handleDeleteSchedule(item.id)}
                    title="Remove routine"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--txt-muted)",
                      cursor: "pointer",
                      padding: 4,
                    }}
                  >
                    <Trash2 size={15} className="hover:text-red-500" />
                  </button>
                </div>

                <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--txt)", margin: "0 0 8px" }}>
                  {item.courseName}
                </h4>

                <div style={{ fontSize: 13, color: "var(--txt-2)", display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={14} color="var(--primary)" />
                    <span>{item.startTime} – {item.endTime}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={14} color="var(--primary)" />
                    <span>{item.room} • {item.building}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "var(--txt-muted)" }}>
                  Pre-order window: 30 min before
                </span>
                <Link
                  href="/explore"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--primary)",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  Order Food <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add Class Modal ── */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: 24,
              border: "1px solid var(--border)",
              maxWidth: 480,
              width: "100%",
              padding: 24,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={20} color="var(--primary)" />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--txt)", margin: 0 }}>
                  Add Class to Routine
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--txt-muted)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSchedule} className="space-y-4">
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt-2)", marginBottom: 6, textTransform: "uppercase" }}>
                  Course Code & Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE-312 Software Engineering"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--txt)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt-2)", marginBottom: 6, textTransform: "uppercase" }}>
                    Day
                  </label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--txt)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt-2)", marginBottom: 6, textTransform: "uppercase" }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--txt)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt-2)", marginBottom: 6, textTransform: "uppercase" }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--txt)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt-2)", marginBottom: 6, textTransform: "uppercase" }}>
                    Room / Lab
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 304"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--txt)",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--txt-2)", marginBottom: 6, textTransform: "uppercase" }}>
                    Campus Building
                  </label>
                  <select
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--txt)",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    {COU_BUILDINGS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ paddingTop: 8 }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 12,
                    background: "var(--primary)",
                    color: "#FFFFFF",
                    fontSize: 14,
                    fontWeight: 800,
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "var(--shadow-primary)",
                  }}
                >
                  {isSubmitting ? "Saving Routine..." : "Save Class to Routine"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
