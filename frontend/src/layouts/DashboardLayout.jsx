// src/layouts/DashboardLayout.jsx
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#020617",
        color: "#e5e7eb",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: "240px",
          padding: "1.25rem 1rem",
          borderRight: "1px solid #111827",
          background:
            "radial-gradient(circle at top, rgba(56,189,248,0.14), transparent 60%), #020617",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>MindMate AI</div>
          <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.15rem" }}>
            Learning & productivity hub
          </div>
        </div>

        <nav
        style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.35rem",
            fontSize: "0.9rem",
        }}
        >
        <SidebarLink to="/app/flashcards" label="Flashcards" />
        <SidebarLink to="/app/summary" label="Summaries" />
        <SidebarLink to="/app/knowledge-base" label="Knowledge Base / RAG" />
        <SidebarLink to="/app/planner" label="Study Planner" />
        <SidebarLink to="/app/habits" label="Habit Tracker" />
        <SidebarLink to="/app/pomodoro" label="Pomodoro" />
        <SidebarLink to="/app/analytics" label="Analytics" />
        <SidebarLink to="/app/chat" label="Chat" />
        </nav>


        <div style={{ marginTop: "auto", fontSize: "0.8rem", color: "#9ca3af" }}>
          <div style={{ marginBottom: "0.35rem" }}>
            Logged in as{" "}
            <span style={{ color: "#e5e7eb", fontWeight: 500 }}>
              {user?.username}
            </span>
          </div>
          <button
            onClick={logout}
            style={{
              padding: "0.4rem 0.75rem",
              borderRadius: "999px",
              border: "1px solid #4b5563",
              background: "transparent",
              color: "#e5e7eb",
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "1.75rem 1.5rem",
          background: "#020617",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

function SidebarLink({ to, label }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display: "block",
        padding: "0.45rem 0.7rem",
        borderRadius: "0.6rem",
        textDecoration: "none",
        color: isActive ? "#e5e7eb" : "#9ca3af",
        background: isActive ? "rgba(15,23,42,0.9)" : "transparent",
        border: isActive ? "1px solid #1d4ed8" : "1px solid transparent",
        fontWeight: isActive ? 500 : 400,
      })}
    >
      {label}
    </NavLink>
  );
}
