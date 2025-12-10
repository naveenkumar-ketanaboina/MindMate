// src/pages/SummaryPage.jsx
import { useState } from "react";
import apiClient from "../utils/apiClient";

export default function SummaryPage() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasNotes = notes.trim().length > 0;

  const handleSummarize = async () => {
    if (!hasNotes) {
      setError("Please paste some notes first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/summarize/", {
        notes,
        focus: topic || "exam preparation",
      });
      setSummary(res.data.summary || "");
      setKeyPoints(res.data.key_points || []);
    } catch (err) {
      console.error(err);
      setError("Error summarizing notes. Check backend.");
    } finally {
      setLoading(false);
    }
  };

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
          Smart Summaries
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Turn messy notes into exam-ready summaries and bullet points.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1.6fr",
          gap: "1.5rem",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              marginBottom: "0.4rem",
              fontSize: "0.85rem",
              color: "#d1d5db",
            }}
          >
            Focus (optional)
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. exam prep, interview, revision..."
            style={{
              width: "100%",
              padding: "0.6rem 0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.9rem",
              marginBottom: "1rem",
            }}
          />

          <label
            style={{
              display: "block",
              marginBottom: "0.4rem",
              fontSize: "0.85rem",
              color: "#d1d5db",
            }}
          >
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={10}
            placeholder="Paste large chunks of notes for MindMate to summarize..."
            style={{
              width: "100%",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              border: "1px solid #374151",
              background: "#020617",
              color: "#e5e7eb",
              fontSize: "0.9rem",
              resize: "vertical",
            }}
          />
        </div>

        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid #1f2937",
            background:
              "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 55%), #020617",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.1rem" }}>Summarize</h2>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            MindMate will compress your notes into a short explanation and
            actionable bullet points.
          </p>

          <button
            onClick={handleSummarize}
            disabled={loading}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "999px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background:
                "linear-gradient(to right, #38bdf8, #0ea5e9, #0369a1)",
              color: "#ecfeff",
              fontSize: "0.9rem",
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Summarizing..." : "Generate Summary"}
          </button>

          {error && (
            <div
              style={{
                marginTop: "0.5rem",
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
        </div>
      </section>

      <section style={{ marginTop: "1.75rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
          Summary
        </h2>
        {summary ? (
          <>
            <p
              style={{
                fontSize: "0.9rem",
                color: "#e5e7eb",
                marginBottom: "0.75rem",
              }}
            >
              {summary}
            </p>
            {keyPoints.length > 0 && (
              <>
                <h3
                  style={{
                    fontSize: "0.95rem",
                    marginBottom: "0.25rem",
                    color: "#d1d5db",
                  }}
                >
                  Key Points
                </h3>
                <ul
                  style={{
                    paddingLeft: "1.1rem",
                    fontSize: "0.9rem",
                    color: "#e5e7eb",
                  }}
                >
                  {keyPoints.map((kp, idx) => (
                    <li key={idx} style={{ marginBottom: "0.2rem" }}>
                      {kp}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            No summary yet. Paste your notes and click{" "}
            <strong>Generate Summary</strong>.
          </p>
        )}
      </section>
    </div>
  );
}
