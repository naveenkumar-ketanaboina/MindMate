// src/pages/AnalyticsPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setError("");
        setLoading(true);
        const res = await apiClient.get("/analytics/overview/");
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={pageWrapper}>
        <div style={card}>
          <p style={{ fontSize: "0.95rem", color: "#9ca3af" }}>
            Loading analytics…
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={pageWrapper}>
        <div style={card}>
          <p style={{ fontSize: "0.9rem", color: "#fca5a5" }}>{error}</p>
        </div>
      </div>
    );
  }

  const { planner, habits, pomodoro, series } = data;
  const tasksSeries = series.tasks_completed_last_7;
  const habitSeries = series.habit_completion_last_7;

  return (
    <div style={pageWrapper}>
      <div style={card}>
        <header style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "1.6rem", marginBottom: "0.3rem" }}>
            Analytics Overview
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            High-level view of your tasks, habits, and focus time over the last
            week.
          </p>
        </header>

        {/* summary row */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <SummaryCard
            label="Tasks completed this week"
            value={planner.completed_this_week}
            subtitle={`${planner.total_tasks} total tasks`}
          />
          <SummaryCard
            label="Overdue tasks"
            value={planner.overdue_tasks}
            highlight={planner.overdue_tasks > 0 ? "danger" : "ok"}
          />
          <SummaryCard
            label="Habits completed today"
            value={`${habits.completed_today}/${habits.total_habits}`}
            subtitle={`Avg streak: ${habits.avg_streak} days (best ${habits.max_streak})`}
          />
          <SummaryCard
            label="Total focus time"
            value={`${pomodoro.total_focus_minutes} min`}
            subtitle={`${pomodoro.completed_sessions} sessions`}
          />
        </section>

        {/* charts */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1.2fr)",
            gap: "1rem",
          }}
        >
          <ChartCard
            title="Tasks completed per day (last 7 days)"
            description="How many tasks you finished each day."
          >
            {tasksSeries.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={tasksSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tasksColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(5)}
                    stroke="#6b7280"
                    fontSize={10}
                  />
                  <YAxis stroke="#6b7280" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(d) => `Date: ${d}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#22c55e"
                    fill="url(#tasksColor)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard
            title="Habit completion rate (last 7 days)"
            description="Share of habits fully completed each day."
          >
            {habitSeries.length === 0 ? (
              <EmptyChartMessage />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={habitSeries} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#111827" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => d.slice(5)}
                    stroke="#6b7280"
                    fontSize={10}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={10}
                    tickFormatter={(v) => `${Math.round(v * 100)}%`}
                    domain={[0, 1]}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(d) => `Date: ${d}`}
                    formatter={(v) => `${Math.round(v * 100)}%`}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion_rate"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </section>
      </div>
    </div>
  );
}

const pageWrapper = {
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "1.5rem",
};

const card = {
  background: "#020617",
  borderRadius: "1rem",
  border: "1px solid #1f2937",
  boxShadow: "0 20px 40px rgba(15,23,42,0.8)",
  padding: "1.5rem",
};

const tooltipStyle = {
  background: "#020617",
  border: "1px solid #1f2937",
  borderRadius: "0.5rem",
  fontSize: "0.8rem",
  color: "#e5e7eb",
};

function SummaryCard({ label, value, subtitle, highlight }) {
  const borderColor =
    highlight === "danger" ? "rgba(239,68,68,0.5)" : "rgba(75,85,99,0.7)";
  const bg =
    highlight === "danger"
      ? "radial-gradient(circle at top, rgba(239,68,68,0.15), #020617)"
      : "#020617";

  return (
    <div
      style={{
        borderRadius: "0.8rem",
        border: `1px solid ${borderColor}`,
        background: bg,
        padding: "0.7rem 0.8rem",
      }}
    >
      <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.1rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.2rem", color: "#e5e7eb", fontWeight: 600 }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.15rem" }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <div
      style={{
        borderRadius: "0.9rem",
        border: "1px solid #111827",
        background: "#020617",
        padding: "0.9rem",
      }}
    >
      <div style={{ marginBottom: "0.5rem" }}>
        <h2 style={{ fontSize: "1rem", marginBottom: "0.15rem" }}>{title}</h2>
        <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>{description}</p>
      </div>
      <div style={{ height: 240 }}>{children}</div>
    </div>
  );
}

function EmptyChartMessage() {
  return (
    <div
      style={{
        height: "100%",
        fontSize: "0.8rem",
        color: "#6b7280",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      Not enough data yet. Use the app for a few days and check back.
    </div>
  );
}
