// src/pages/HabitsPage.jsx
import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [newHabitTitle, setNewHabitTitle] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [targetPerDay, setTargetPerDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  // --- load habits from backend ---
  useEffect(() => {
    const fetchHabits = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/habits/");
        setHabits(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load habits.");
      } finally {
        setLoading(false);
      }
    };
    fetchHabits();
  }, []);

  // --- aggregate analytics (client-side) ---
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter((h) => h.completed_today).length;
  const todayCompletionPercent =
    totalHabits > 0 ? Math.round((completedTodayCount / totalHabits) * 100) : 0;
  const avgStreak =
    totalHabits > 0
      ? Math.round(
          habits.reduce((sum, h) => sum + (h.streak || 0), 0) / totalHabits
        )
      : 0;

  // --- create habit ---
  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!newHabitTitle.trim()) return;

    try {
      setSaving(true);
      setError("");
      const res = await apiClient.post("/habits/", {
        title: newHabitTitle.trim(),
        difficulty,
        target_per_day: Number(targetPerDay) || 1,
      });
      setHabits((prev) => [...prev, res.data]);
      setNewHabitTitle("");
      setTargetPerDay(1);
      setDifficulty("medium");
    } catch (err) {
      console.error(err);
      setError("Failed to add habit.");
    } finally {
      setSaving(false);
    }
  };

  // --- +/- multi-check ---
  const handleAdjustCount = async (habit, delta) => {
    try {
      // optimistic
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habit.id) return h;
          const target = h.target_per_day || 1;
          const next = Math.max(
            0,
            Math.min((h.count_today || 0) + delta, target)
          );
          return {
            ...h,
            count_today: next,
            completed_today: next >= target,
          };
        })
      );

      const res = await apiClient.post(
        `/habits/${habit.id}/increment-today/`,
        { delta }
      );

      setHabits((prev) =>
        prev.map((h) => (h.id === habit.id ? res.data : h))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update habit progress.");
    }
  };

  // --- update habit (title/difficulty/target) ---
  const handleUpdateHabit = async (id, payload) => {
    try {
      const res = await apiClient.patch(`/habits/${id}/`, payload);
      setHabits((prev) => prev.map((h) => (h.id === id ? res.data : h)));
    } catch (err) {
      console.error(err);
      setError("Failed to update habit.");
      throw err;
    }
  };

  // --- delete habit ---
  const handleDeleteHabit = async (id) => {
    const ok = window.confirm("Delete this habit? This cannot be undone.");
    if (!ok) return;
    try {
      await apiClient.delete(`/habits/${id}/`);
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete habit.");
    }
  };

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
          Habit Tracker
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Build consistent study habits. Progress is saved to your MindMate
          account with multi-check support and streaks.
        </p>
      </header>

      {/* small analytics row */}
      <section style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            alignItems: "center",
            fontSize: "0.85rem",
            color: "#e5e7eb",
          }}
        >
          <span>
            Today: <strong>{todayStr}</strong>
          </span>
          <span style={pillStyle}>
            Habits: <strong>{totalHabits}</strong>
          </span>
          <span style={pillStyle}>
            Completed today:{" "}
            <strong>
              {completedTodayCount}/{totalHabits || 0} ({todayCompletionPercent}
              %)
            </strong>
          </span>
          <span style={pillStyle}>
            Avg streak: <strong>{avgStreak} days</strong>
          </span>
        </div>
      </section>

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

      {/* add habit form */}
      <section style={{ marginBottom: "1.25rem" }}>
        <form
          onSubmit={handleAddHabit}
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 1.1fr 1.1fr auto",
            gap: "0.5rem",
            alignItems: "center",
            marginBottom: "0.75rem",
          }}
        >
          <input
            value={newHabitTitle}
            onChange={(e) => setNewHabitTitle(e.target.value)}
            placeholder="New habit (e.g. 'Solve 2 LeetCode problems')"
            style={fieldStyle}
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={fieldStyle}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <input
            type="number"
            min={1}
            max={10}
            value={targetPerDay}
            onChange={(e) => setTargetPerDay(e.target.value)}
            style={fieldStyle}
            placeholder="Target/day"
          />
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: "0.5rem 0.9rem",
              borderRadius: "0.7rem",
              border: "none",
              background: "linear-gradient(to right, #38bdf8, #0ea5e9)",
              color: "#020617",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Adding..." : "Add"}
          </button>
        </form>
      </section>

      {/* habits list */}
      <section>
        {loading ? (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Loading habits…
          </p>
        ) : habits.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            No habits yet. Add one above to get started.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {habits.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                onAdjust={(delta) => handleAdjustCount(h, delta)}
                onUpdate={handleUpdateHabit}
                onDelete={() => handleDeleteHabit(h.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const fieldStyle = {
  width: "100%",
  padding: "0.5rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.85rem",
};

const pillStyle = {
  padding: "0.2rem 0.6rem",
  borderRadius: "999px",
  border: "1px solid #1f2937",
  background: "#020617",
};

function HabitRow({ habit, onAdjust, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(habit.title);
  const [difficulty, setDifficulty] = useState(habit.difficulty || "medium");
  const [target, setTarget] = useState(habit.target_per_day || 1);
  const [saving, setSaving] = useState(false);

  const count = habit.count_today || 0;
  const targetPerDay = habit.target_per_day || 1;
  const ratio = Math.min(1, count / targetPerDay);

  const canIncrement = count < targetPerDay;
  const canDecrement = count > 0;

  const difficultyLabel =
    difficulty === "easy" ? "Easy" : difficulty === "hard" ? "Hard" : "Medium";

  const difficultyColor =
    difficulty === "easy"
      ? "#4ade80"
      : difficulty === "hard"
      ? "#f97316"
      : "#38bdf8";

  const streak = habit.streak || 0;
  const showFlame = streak >= 3;
  const isCompletedToday = habit.completed_today;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onUpdate(habit.id, {
        title: title.trim(),
        difficulty,
        target_per_day: Number(target) || 1,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setTitle(habit.title);
    setDifficulty(habit.difficulty || "medium");
    setTarget(habit.target_per_day || 1);
  };

  return (
    <div
      style={{
        borderRadius: "0.75rem",
        border: "1px solid #111827",
        background: "#020617",
        padding: "0.6rem 0.7rem",
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) minmax(0, 2fr) auto",
        gap: "0.5rem",
        alignItems: "center",
      }}
    >
      {/* left: title + streak */}
      <div>
        {editing ? (
          <>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: "100%",
                padding: "0.3rem 0.4rem",
                borderRadius: "0.4rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.85rem",
                marginBottom: "0.25rem",
              }}
            />
            <div style={{ display: "flex", gap: "0.4rem", fontSize: "0.75rem" }}>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  flex: 1,
                  padding: "0.25rem 0.4rem",
                  borderRadius: "0.4rem",
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: "0.75rem",
                }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <input
                type="number"
                min={1}
                max={10}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                style={{
                  width: "70px",
                  padding: "0.25rem 0.4rem",
                  borderRadius: "0.4rem",
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: "0.75rem",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: "0.95rem",
                color: "#e5e7eb",
                marginBottom: "0.1rem",
              }}
            >
              {habit.title}
            </div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              Streak:{" "}
              <strong>
                {streak} day{streak === 1 ? "" : "s"}
              </strong>{" "}
              {showFlame && <span style={{ marginLeft: "0.25rem" }}>🔥</span>}
            </div>
          </>
        )}
      </div>

      {/* middle: progress + difficulty + celebration */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#9ca3af",
            marginBottom: "0.2rem",
          }}
        >
          <span>
            Today:{" "}
            <strong>
              {count} / {targetPerDay}
            </strong>
          </span>
          <span
            style={{
              padding: "0.1rem 0.5rem",
              borderRadius: "999px",
              border: "1px solid #374151",
              color: difficultyColor,
              fontSize: "0.7rem",
            }}
          >
            {difficultyLabel}
          </span>
        </div>
        <div
          style={{
            height: "6px",
            borderRadius: "999px",
            background: "#111827",
            overflow: "hidden",
            marginBottom: "0.25rem",
          }}
        >
          <div
            style={{
              width: `${ratio * 100}%`,
              height: "100%",
              background:
                "linear-gradient(to right, #22c55e, #16a34a, #15803d)",
              transition: "width 0.15s ease-out",
            }}
          />
        </div>
        {isCompletedToday && !editing && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "#bbf7d0",
            }}
          >
            ✅ Great job! Target reached for today.
          </div>
        )}
      </div>

      {/* right: +/- and edit/delete */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem",
          alignItems: "flex-end",
        }}
      >
        <div style={{ display: "flex", gap: "0.35rem" }}>
          <button
            onClick={() => canDecrement && onAdjust(-1)}
            disabled={!canDecrement}
            style={{
              ...btnSmall,
              opacity: canDecrement ? 1 : 0.4,
              cursor: canDecrement ? "pointer" : "default",
            }}
          >
            −
          </button>
          <button
            onClick={() => canIncrement && onAdjust(1)}
            disabled={!canIncrement}
            style={{
              ...btnSmall,
              opacity: canIncrement ? 1 : 0.4,
              cursor: canIncrement ? "pointer" : "default",
            }}
          >
            +
          </button>
        </div>

        {editing ? (
          <div style={{ display: "flex", gap: "0.35rem" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...btnTiny,
                background: "#22c55e",
                borderColor: "#16a34a",
                color: "#022c22",
                opacity: saving ? 0.7 : 1,
              }}
            >
              Save
            </button>
            <button onClick={handleCancel} style={btnTiny}>
              Cancel
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "0.35rem" }}>
            <button
              onClick={() => setEditing(true)}
              style={btnTiny}
              title="Edit habit"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              style={{
                ...btnTiny,
                borderColor: "#b91c1c",
                color: "#fecaca",
              }}
              title="Delete habit"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const btnSmall = {
  padding: "0.25rem 0.6rem",
  borderRadius: "999px",
  border: "1px solid #4b5563",
  background: "transparent",
  color: "#e5e7eb",
  fontSize: "0.8rem",
};

const btnTiny = {
  padding: "0.2rem 0.5rem",
  borderRadius: "999px",
  border: "1px solid #4b5563",
  background: "transparent",
  color: "#e5e7eb",
  fontSize: "0.75rem",
  cursor: "pointer",
};
