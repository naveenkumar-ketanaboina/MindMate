// src/pages/PlannerPage.jsx
import { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";

const STORAGE_KEY = "mindmate_planner_tasks";

export default function PlannerPage() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [tag, setTag] = useState("Deep work");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // useEffect(() => {
  //   const raw = localStorage.getItem(STORAGE_KEY);
  //   if (raw) {
  //     setTasks(JSON.parse(raw));
  //   }
  // }, []);

  // useEffect(() => {
  //   localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  // }, [tasks]);
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/planner/tasks/");
        setTasks(res.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load planner tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);


  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    try {
      setSaving(true);
      setError("");
      const res = await apiClient.post("/planner/tasks/", {
        title: title.trim(),
        subject: subject.trim(),
        date,
        time: time || null,
        tag,
        done: false,
      });
      setTasks((prev) => [...prev, res.data]);
      setTitle("");
      setSubject("");
      setDate("");
      setTime("");
    } catch (err) {
      console.error(err);
      setError("Failed to create task.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (task) => {
    try {
      // Optimistic UI
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, done: !t.done } : t
        )
      );
      await apiClient.post(`/planner/tasks/${task.id}/toggle/`);
    } catch (err) {
      console.error(err);
      setError("Failed to update task.");
    }
  };

  const deleteTask = async (task) => {
    try {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      await apiClient.delete(`/planner/tasks/${task.id}/`);
    } catch (err) {
      console.error(err);
      setError("Failed to delete task.");
    }
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = tasks.filter((t) => t.date >= todayStr && !t.done);
  const completed = tasks.filter((t) => t.done);

  return (
    <div
      style={{
        maxWidth: "1000px",
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
          AI Study Planner
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Plan deep work blocks, revisions, and exam prep. Tasks are saved in your
          MindMate account.
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

      {/* Form */}
      <form
        onSubmit={addTask}
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1.3fr 1.1fr 1.1fr 1.1fr auto",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What will you study?"
          style={fieldStyle}
        />
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Course / Topic"
          style={fieldStyle}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={fieldStyle}
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={fieldStyle}
        />
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          style={fieldStyle}
        >
          <option>Deep work</option>
          <option>Revision</option>
          <option>Project</option>
          <option>Reading</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "0.5rem 0.9rem",
            borderRadius: "0.7rem",
            border: "none",
            background: "linear-gradient(to right, #22c55e, #16a34a)",
            color: "#020617",
            fontSize: "0.85rem",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : "Add"}
        </button>
      </form>

      {loading ? (
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>Loading tasks…</p>
      ) : (
        <>
          {/* Upcoming */}
          <section style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Upcoming sessions
            </h2>
            {upcoming.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                No upcoming sessions yet. Add at least one deep work block for today.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {upcoming.map((t) => (
                  <PlannerRow
                    key={t.id}
                    task={t}
                    onToggle={() => toggleDone(t)}
                    onDelete={() => deleteTask(t)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Completed */}
          <section>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
              Completed
            </h2>
            {completed.length === 0 ? (
              <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                Completed sessions will show up here.
              </p>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
              >
                {completed.map((t) => (
                  <PlannerRow
                    key={t.id}
                    task={t}
                    onToggle={() => toggleDone(t)}
                    onDelete={() => deleteTask(t)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

const fieldStyle = {
  width: "100%",
  padding: "0.45rem 0.55rem",
  borderRadius: "0.5rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  fontSize: "0.8rem",
};

function PlannerRow({ task, onToggle, onDelete }) {
  const dt = `${task.date}${task.time ? " • " + task.time : ""}`;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.6rem",
        padding: "0.45rem 0.6rem",
        borderRadius: "0.7rem",
        border: "1px solid #111827",
        background: "#020617",
      }}
    >
      <input
        type="checkbox"
        checked={task.done}
        onChange={onToggle}
        style={{ accentColor: "#22c55e" }}
      />
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "0.9rem",
            textDecoration: task.done ? "line-through" : "none",
            color: task.done ? "#6b7280" : "#e5e7eb",
          }}
        >
          {task.title}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
          {task.subject && <span>{task.subject} • </span>}
          {dt}
        </div>
      </div>
      <span
        style={{
          fontSize: "0.75rem",
          padding: "0.2rem 0.55rem",
          borderRadius: "999px",
          border: "1px solid #374151",
          color: "#9ca3af",
        }}
      >
        {task.tag}
      </span>
      <button
        onClick={onDelete}
        style={{
          border: "none",
          background: "transparent",
          color: "#6b7280",
          fontSize: "0.8rem",
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

