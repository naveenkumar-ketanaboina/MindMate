// src/pages/RegisterPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register, authError, setAuthError, authLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");
    const ok = await register({ username, email, password });
    if (ok) {
      navigate("/", { replace: true });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#e5e7eb",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#020617",
          borderRadius: "1rem",
          padding: "1.75rem",
          boxShadow: "0 20px 40px rgba(15,23,42,0.8)",
          border: "1px solid #1f2937",
        }}
      >
        <h1 style={{ fontSize: "1.6rem", marginBottom: "0.25rem", textAlign: "center" }}>
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
          Create an account to get started.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
              placeholder="Choose a username"
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
              Email (optional)
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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
              placeholder="Create a password"
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
              background: "linear-gradient(to right, #38bdf8, #0ea5e9)",
              color: "#020617",
              opacity: authLoading ? 0.7 : 1,
            }}
          >
            {authLoading ? "Creating account..." : "Create account"}
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
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#38bdf8" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
