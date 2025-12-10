// src/pages/FlashcardsPage.jsx
import { useState } from "react";
import apiClient from "../utils/apiClient";

export default function FlashcardsPage() {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasNotes = notes.trim().length > 0;

  const handleGenerateFlashcards = async () => {
    if (!hasNotes) {
      setError("Please paste some notes first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/flashcards/", {
        topic: topic || null,
        notes,
        difficulty: "medium",
        num_cards: 8,
      });
      setFlashcards(res.data.cards || []);
    } catch (err) {
      console.error(err);
      setError("Error generating flashcards. Check backend.");
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
          Flashcards
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Paste your notes and let MindMate generate spaced-repetition friendly
          Q&A cards.
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
            Topic (optional)
          </label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Dynamic Programming, Neural Networks..."
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
            placeholder="Paste your lecture notes or textbook content..."
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
              "radial-gradient(circle at top left, rgba(56,189,248,0.12), transparent 55%), #020617",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <h2 style={{ fontSize: "1.1rem" }}>Generate</h2>
          <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
            MindMate will turn your notes into active recall flashcards.
          </p>

          <button
            onClick={handleGenerateFlashcards}
            disabled={loading}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "999px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background:
                "linear-gradient(to right, #22c55e, #16a34a, #15803d)",
              color: "#ecfdf5",
              fontSize: "0.9rem",
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Thinking..." : "Generate Flashcards"}
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

          <div
            style={{
              marginTop: "1rem",
              fontSize: "0.8rem",
              color: "#9ca3af",
              borderRadius: "0.75rem",
              border: "1px solid #111827",
              padding: "0.75rem",
            }}
          >
            <strong style={{ color: "#e5e7eb" }}>Tip:</strong> Start with one
            topic per card set. Reuse your best flashcards before exams.
          </div>
        </div>
      </section>

      <section style={{ marginTop: "1.75rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
          Flashcards
        </h2>
        {flashcards.length === 0 ? (
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            No flashcards yet. Paste your notes and click{" "}
            <strong>Generate Flashcards</strong>.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {flashcards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  borderRadius: "0.75rem",
                  border: "1px solid #1f2937",
                  background: "#020617",
                  padding: "0.75rem",
                  fontSize: "0.85rem",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#6b7280",
                    marginBottom: "0.25rem",
                  }}
                >
                  Card {idx + 1}
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: "0.35rem",
                    color: "#e5e7eb",
                  }}
                >
                  Q: {card.question}
                </div>
                <div style={{ color: "#d1d5db" }}>
                  <span style={{ fontWeight: 500 }}>A:</span> {card.answer}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
