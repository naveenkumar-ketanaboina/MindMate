// src/pages/LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login, authError, setAuthError, authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const ok = await login({ username, password });
    if (ok) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",           // take full viewport width
        display: "flex",
        alignItems: "center",
        justifyContent: "center", // center horizontally
        background: "#020617",    // full-page dark background
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",           // 100% width on mobile
          maxWidth: "420px",       // but cap on large screens
          background: "#020617",
          borderRadius: "1rem",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(15,23,42,0.9)",
          border: "1px solid #1f2937",
        }}
      >
        <h1
          style={{
            fontSize: "1.6rem",
            marginBottom: "0.25rem",
            textAlign: "center",
            color: "#f9fafb",
          }}
        >
          MindMate AI
        </h1>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#9ca3af",
            marginBottom: "1.25rem",
            textAlign: "center",
          }}
        >
          Login to your AI-powered study workspace.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "#9ca3af",
                marginBottom: "0.25rem",
              }}
            >
              Username
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              style={{
                width: "100%",
                padding: "0.5rem 0.7rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.8rem",
                color: "#9ca3af",
                marginBottom: "0.25rem",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "0.5rem 0.7rem",
                borderRadius: "0.5rem",
                border: "1px solid #374151",
                background: "#020617",
                color: "#e5e7eb",
                fontSize: "0.85rem",
              }}
            />
          </div>

          {authError && (
            <div style={{ fontSize: "0.8rem", color: "#fecaca" }}>{authError}</div>
          )}

          <button
            type="submit"
            disabled={authLoading}
            style={{
              marginTop: "0.5rem",
              width: "100%",
              padding: "0.6rem 0.7rem",
              borderRadius: "0.75rem",
              border: "none",
              cursor: authLoading ? "not-allowed" : "pointer",
              fontSize: "0.9rem",
              fontWeight: 600,
              background: "linear-gradient(to right, #22c55e, #16a34a)",
              color: "#020617",
              opacity: authLoading ? 0.7 : 1,
            }}
          >
            {authLoading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p
          style={{
            fontSize: "0.8rem",
            color: "#6b7280",
            marginTop: "0.75rem",
            textAlign: "center",
          }}
        >
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ color: "#38bdf8" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
