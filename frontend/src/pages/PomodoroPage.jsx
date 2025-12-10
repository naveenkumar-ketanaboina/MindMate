// src/pages/PomodoroPage.jsx
import { useState, useEffect, useRef } from "react";
import apiClient from "../utils/apiClient";

export default function PomodoroPage() {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [mode, setMode] = useState("idle"); // idle | focus | break
  const [stat, setStat] = useState({
    total_focus_minutes: 0,
    completed_sessions: 0,
    updated_at: null,
  });
  const [habitSnapshot, setHabitSnapshot] = useState({
    totalHabits: 0,
    completedToday: 0,
  });
  const [error, setError] = useState("");

  const intervalRef = useRef(null);

  // load pomodoro stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiClient.get("/pomodoro/stats/");
        setStat(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  // small habit analytics for this page
  useEffect(() => {
    const fetchHabits = async () => {
      try {
        const res = await apiClient.get("/habits/");
        const habits = res.data || [];
        const total = habits.length;
        const completed = habits.filter((h) => h.completed_today).length;
        setHabitSnapshot({ totalHabits: total, completedToday: completed });
      } catch (err) {
        console.error(err);
      }
    };
    fetchHabits();
  }, []);

  // timer effect
  useEffect(() => {
    if (mode === "idle") return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode]);

  // when secondsLeft hits zero
  useEffect(() => {
    if (mode === "idle") return;
    if (secondsLeft > 0) return;

    if (mode === "focus") {
      // focus session finished
      handleFocusComplete();
    } else if (mode === "break") {
      // break finished -> go idle
      setMode("idle");
      setSecondsLeft(focusMinutes * 60);
    }
  }, [secondsLeft, mode]);

  const handleStartFocus = () => {
    setError("");
    setMode("focus");
    setSecondsLeft(focusMinutes * 60);
  };

  const handleStop = () => {
    setMode("idle");
    setSecondsLeft(focusMinutes * 60);
  };

  const handleFocusComplete = async () => {
    setMode("break");
    setSecondsLeft(breakMinutes * 60);

    try {
      const res = await apiClient.post("/pomodoro/stats/", {
        focus_minutes: focusMinutes,
      });
      setStat(res.data);
    } catch (err) {
      console.error(err);
      setError("Finished session, but failed to sync stats.");
    }
  };

  const totalMinutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay = `${String(totalMinutes).padStart(2, "0")}:${String(
    secs
  ).padStart(2, "0")}`;

  const modeLabel =
    mode === "focus" ? "Focus session" : mode === "break" ? "Break" : "Idle";

  const todayPercent =
    habitSnapshot.totalHabits > 0
      ? Math.round(
          (habitSnapshot.completedToday / habitSnapshot.totalHabits) * 100
        )
      : 0;

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        background: "#020617",
        borderRadius: "1rem",
        padding: "1.5rem",
        border: "1px solid #1f2937",
        boxShadow: "0 20px 40px rgba(15,23,42,0.8)",
      }}
    >
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>
          Pomodoro & Analytics
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Time your focus sessions and track total deep-work minutes. MindMate
          also gives you a quick snapshot of your habit consistency.
        </p>
      </header>

      {error && (
        <div
          style={{
            marginBottom: "0.75rem",
            padding: "0.5rem 0.75rem",
            borderRadius: "0.5rem",
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#fecaca",
            fontSize: "0.8rem",
          }}
        >
          {error}
        </div>
      )}

      {/* timer + controls */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.7fr 1.3fr",
          gap: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            borderRadius: "0.9rem",
            border: "1px solid #111827",
            background:
              "radial-gradient(circle at top, rgba(56,189,248,0.18), transparent 60%), #020617",
            padding: "1.3rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              color: "#9ca3af",
              marginBottom: "0.4rem",
            }}
          >
            {modeLabel}
          </div>
          <div
            style={{
              fontSize: "3rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              marginBottom: "0.8rem",
            }}
          >
            {timeDisplay}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "0.9rem",
              fontSize: "0.8rem",
              color: "#9ca3af",
            }}
          >
            <span>
              Focus: <strong>{focusMinutes} min</strong>
            </span>
            <span>•</span>
            <span>
              Break: <strong>{breakMinutes} min</strong>
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "0.6rem" }}>
            {mode === "idle" ? (
              <button
                onClick={handleStartFocus}
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "999px",
                  border: "none",
                  background:
                    "linear-gradient(to right, #22c55e, #16a34a, #15803d)",
                  color: "#ecfdf5",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Start Focus
              </button>
            ) : (
              <button
                onClick={handleStop}
                style={{
                  padding: "0.6rem 1.4rem",
                  borderRadius: "999px",
                  border: "1px solid #4b5563",
                  background: "transparent",
                  color: "#e5e7eb",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Stop
              </button>
            )}
          </div>

          {/* duration controls */}
          <div
            style={{
              marginTop: "1.1rem",
              display: "flex",
              justifyContent: "center",
              gap: "0.75rem",
              fontSize: "0.8rem",
            }}
          >
            <DurationInput
              label="Focus"
              value={focusMinutes}
              onChange={(v) => {
                const n = Math.max(5, Math.min(120, Number(v) || 25));
                setFocusMinutes(n);
                if (mode === "idle") setSecondsLeft(n * 60);
              }}
            />
            <DurationInput
              label="Break"
              value={breakMinutes}
              onChange={(v) =>
                setBreakMinutes(Math.max(3, Math.min(60, Number(v) || 5)))
              }
            />
          </div>
        </div>

        {/* stats card */}
        <div
          style={{
            borderRadius: "0.9rem",
            border: "1px solid #111827",
            background: "#020617",
            padding: "1.1rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", marginBottom: "0.6rem" }}>
            Focus Stats
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.75rem",
              marginBottom: "0.9rem",
            }}
          >
            <StatCard
              label="Total Focus Time"
              value={`${stat.total_focus_minutes || 0} min`}
            />
            <StatCard
              label="Completed Sessions"
              value={stat.completed_sessions || 0}
            />
          </div>
          <p
            style={{
              fontSize: "0.8rem",
              color: "#9ca3af",
              marginBottom: "0.6rem",
            }}
          >
            Every time you finish a focus timer, MindMate logs the session and
            updates your total deep-work minutes.
          </p>
          {stat.updated_at && (
            <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              Last updated:{" "}
              {new Date(stat.updated_at).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>
      </section>

      {/* habit snapshot */}
      <section>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>
          Habit Snapshot
        </h2>
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", marginBottom: "0.6rem" }}>
          Quick overview of how your habits are going today.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            fontSize: "0.85rem",
          }}
        >
          <StatPill
            label="Active habits"
            value={habitSnapshot.totalHabits}
          />
          <StatPill
            label="Completed today"
            value={`${habitSnapshot.completedToday} / ${habitSnapshot.totalHabits}`}
          />
          <StatPill label="Today completion" value={`${todayPercent}%`} />
        </div>
      </section>
    </div>
  );
}

function DurationInput({ label, value, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.3rem",
        color: "#9ca3af",
      }}
    >
      <span>{label}</span>
      <input
        type="number"
        min={1}
        max={120}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "3.2rem",
          padding: "0.2rem 0.35rem",
          borderRadius: "0.4rem",
          border: "1px solid #374151",
          background: "#020617",
          color: "#e5e7eb",
          fontSize: "0.8rem",
        }}
      />
      <span>min</span>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        borderRadius: "0.75rem",
        border: "1px solid #111827",
        background: "#020617",
        padding: "0.7rem",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.15rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.1rem", color: "#e5e7eb", fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div
      style={{
        padding: "0.35rem 0.7rem",
        borderRadius: "999px",
        border: "1px solid #1f2937",
        background: "#020617",
        color: "#e5e7eb",
      }}
    >
      <span style={{ color: "#9ca3af", marginRight: "0.3rem" }}>{label}:</span>
      <strong>{value}</strong>
    </div>
  );
}
