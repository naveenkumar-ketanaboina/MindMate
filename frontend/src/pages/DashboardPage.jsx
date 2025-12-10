// src/pages/DashboardPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/apiClient";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // Week 1 – notes / flashcards / summary
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [summary, setSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("flashcards"); // "flashcards" | "summary"
  const [error, setError] = useState("");

  const hasNotes = notes.trim().length > 0;

  // Week 2 – RAG / upload / explain / quiz
  const [selectedFile, setSelectedFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const [explainQuestion, setExplainQuestion] = useState("");
  const [explainAnswer, setExplainAnswer] = useState("");
  const [explainChunks, setExplainChunks] = useState([]);

  const [quizTopic, setQuizTopic] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);

  // Handlers – Week 1
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
      setActiveTab("flashcards");
    } catch (err) {
      console.error(err);
      setError("Error generating flashcards. Check console and backend.");
    } finally {
      setLoading(false);
    }
  };

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
        focus: "exam preparation",
      });
      setSummary(res.data.summary || "");
      setKeyPoints(res.data.key_points || []);
      setActiveTab("summary");
    } catch (err) {
      console.error(err);
      setError("Error summarizing notes. Check console and backend.");
    } finally {
      setLoading(false);
    }
  };

  // Handlers – Week 2
  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadStatus("");
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      setUploadStatus("Please choose a PDF or text file first.");
      return;
    }

    try {
      setUploadStatus("Uploading & indexing…");
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (docTitle.trim()) {
        formData.append("title", docTitle.trim());
      }

      const res = await apiClient.post("/upload-document/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUploadStatus(
        `✅ ${res.data.document.title} indexed (${res.data.chunks_indexed} chunks).`
      );
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      setUploadStatus("❌ Failed to upload or index the document.");
    }
  };

  const handleExplain = async () => {
    if (!explainQuestion.trim()) {
      setError("Enter a question for MindMate to explain.");
      return;
    }

    setRagLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/explain/", {
        question: explainQuestion,
        top_k: 4,
      });

      setExplainAnswer(res.data.answer || "");
      setExplainChunks(res.data.chunks || []);
    } catch (err) {
      console.error(err);
      setError("Error generating explanation. Check backend logs.");
    } finally {
      setRagLoading(false);
    }
  };

  const handleQuizMe = async () => {
    if (!quizTopic.trim()) {
      setError("Enter a topic for the quiz.");
      return;
    }

    setRagLoading(true);
    setError("");
    try {
      const res = await apiClient.post("/quiz-me/", {
        topic: quizTopic,
        num_questions: 5,
      });

      setQuizQuestions(res.data.questions || []);
    } catch (err) {
      console.error(err);
      setError("Error generating quiz. Check backend logs.");
    } finally {
      setRagLoading(false);
    }
  };

  // JSX – main dashboard
  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#0f172a",
        color: "#e5e7eb",
        padding: "2rem 1rem",
      }}
    >
      <div
        style={{
          margin: "0 auto",
          background: "#020617",
          borderRadius: "1rem",
          padding: "1.5rem",
          boxShadow: "0 20px 40px rgba(15,23,42,0.8)",
          border: "1px solid #1f2937",
        }}
      >
        {/* Top bar with user info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h1 style={{ fontSize: "1.4rem" }}>MindMate AI – Dashboard</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              Logged in as <strong>{user?.username}</strong>
            </span>
            <button
              onClick={logout}
              style={{
                padding: "0.35rem 0.8rem",
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
        </div>

        {/* Week 1 – Flashcards & Summary */}
        <header style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.8rem", marginBottom: "0.25rem" }}>
            MindMate AI – Week 1
          </h2>
          <p style={{ color: "#9ca3af", fontSize: "0.95rem" }}>
            Paste your study notes, then let MindMate generate flashcards and a
            concise summary for you.
          </p>
        </header>

        {/* Input section */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 2fr",
            gap: "1.5rem",
            alignItems: "stretch",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
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
                marginBottom: "0.5rem",
                fontSize: "0.9rem",
                color: "#d1d5db",
              }}
            >
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={10}
              placeholder="Paste your lecture notes, textbook content, or concepts you want to study..."
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
            <h3 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
              Actions
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
              Choose what you want MindMate to do with your notes:
            </p>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
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

              <button
                onClick={handleSummarize}
                disabled={loading}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "999px",
                  border: "1px solid #4b5563",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Summarizing..." : "Summarize Notes"}
              </button>
            </div>

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
                borderRadius: "0.75rem",
                border: "1px solid #111827",
                background: "#020617",
                padding: "0.75rem",
                fontSize: "0.8rem",
                color: "#9ca3af",
              }}
            >
              <strong style={{ color: "#e5e7eb" }}>Tip:</strong> Start with a
              small topic (e.g. "Binary Search Trees") and a few paragraphs of
              notes. Once everything works, you can scale up.
            </div>
          </div>
        </section>

        {/* Output tabs */}
        <section style={{ marginTop: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "0.75rem",
              borderBottom: "1px solid #1f2937",
            }}
          >
            <button
              onClick={() => setActiveTab("flashcards")}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderBottom:
                  activeTab === "flashcards"
                    ? "2px solid #22c55e"
                    : "2px solid transparent",
                background: "transparent",
                color: activeTab === "flashcards" ? "#bbf7d0" : "#9ca3af",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Flashcards
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              style={{
                padding: "0.5rem 1rem",
                border: "none",
                borderBottom:
                  activeTab === "summary"
                    ? "2px solid #38bdf8"
                    : "2px solid transparent",
                background: "transparent",
                color: activeTab === "summary" ? "#bae6fd" : "#9ca3af",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
            >
              Summary
            </button>
          </div>

          {activeTab === "flashcards" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                Flashcards
              </h3>
              {flashcards.length === 0 ? (
                <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
                  No flashcards yet. Paste your notes and click{" "}
                  <strong>Generate Flashcards</strong>.
                </p>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
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
                          marginBottom: "0.4rem",
                          color: "#e5e7eb",
                        }}
                      >
                        Q: {card.question}
                      </div>
                      <div
                        style={{
                          color: "#d1d5db",
                          marginBottom: "0.3rem",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>A:</span>{" "}
                        {card.answer}
                      </div>
                      {card.tag && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "0.25rem",
                            padding: "0.15rem 0.5rem",
                            borderRadius: "999px",
                            border: "1px solid #374151",
                            fontSize: "0.7rem",
                            color: "#9ca3af",
                          }}
                        >
                          {card.tag}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "summary" && (
            <div>
              <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                Summary
              </h3>
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
                      <h4
                        style={{
                          fontSize: "0.95rem",
                          marginBottom: "0.25rem",
                          color: "#d1d5db",
                        }}
                      >
                        Key Points
                      </h4>
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
                  <strong>Summarize Notes</strong>.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Week 2 – Knowledge Base / RAG */}
        <section style={{ marginTop: "2.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "0.75rem" }}>
            Week 2 – Knowledge Base & RAG
          </h2>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#9ca3af",
              marginBottom: "1rem",
            }}
          >
            Upload your PDFs or text files so MindMate can build a knowledge
            base. Then ask questions or generate quizzes based on your
            documents.
          </p>

          {/* Upload + Explain/Quiz grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.3fr 1.7fr",
              gap: "1.5rem",
              marginBottom: "1.5rem",
            }}
          >
            {/* Upload card */}
            <div
              style={{
                borderRadius: "0.75rem",
                border: "1px solid #1f2937",
                background: "#020617",
                padding: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                1. Upload a study document
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#9ca3af",
                  marginBottom: "0.75rem",
                }}
              >
                Supported: PDF, plain text. The content will be split into
                chunks and indexed in a local vector store.
              </p>

              <label
                style={{
                  display: "block",
                  marginBottom: "0.4rem",
                  fontSize: "0.85rem",
                  color: "#d1d5db",
                }}
              >
                Document title (optional)
              </label>
              <input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. AI in Project Management – April 2019"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid #374151",
                  background: "#020617",
                  color: "#e5e7eb",
                  fontSize: "0.85rem",
                  marginBottom: "0.75rem",
                }}
              />

              <input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}
              />

              <button
                onClick={handleUploadDocument}
                disabled={!selectedFile}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "999px",
                  border: "none",
                  cursor: selectedFile ? "pointer" : "not-allowed",
                  background: selectedFile
                    ? "linear-gradient(to right, #38bdf8, #0ea5e9)"
                    : "#1f2937",
                  color: "#e5e7eb",
                  fontSize: "0.85rem",
                  fontWeight: 500,
                }}
              >
                Upload & Index
              </button>

              {uploadStatus && (
                <p
                  style={{
                    marginTop: "0.75rem",
                    fontSize: "0.8rem",
                    color: uploadStatus.startsWith("✅")
                      ? "#bbf7d0"
                      : "#fecaca",
                  }}
                >
                  {uploadStatus}
                </p>
              )}
            </div>

            {/* Explain + Quiz */}
            <div
              style={{
                borderRadius: "0.75rem",
                border: "1px solid #1f2937",
                background: "#020617",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              {/* Explain card */}
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                  2. Ask MindMate to explain
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#9ca3af",
                    marginBottom: "0.5rem",
                  }}
                >
                  MindMate will search your indexed documents and return the
                  most relevant chunks.
                </p>
                <textarea
                  value={explainQuestion}
                  onChange={(e) => setExplainQuestion(e.target.value)}
                  rows={3}
                  placeholder="e.g. How can AI improve project management decisions?"
                  style={{
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #374151",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem",
                  }}
                />
                <button
                  onClick={handleExplain}
                  disabled={ragLoading}
                  style={{
                    padding: "0.45rem 0.9rem",
                    borderRadius: "999px",
                    border: "1px solid #4b5563",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: "0.85rem",
                    cursor: ragLoading ? "not-allowed" : "pointer",
                    opacity: ragLoading ? 0.7 : 1,
                  }}
                >
                  {ragLoading
                    ? "Searching knowledge base…"
                    : "Explain using my docs"}
                </button>
              </div>

              {/* Quiz card */}
              <div>
                <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                  3. Generate a quiz
                </h3>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "#9ca3af",
                    marginBottom: "0.5rem",
                  }}
                >
                  MindMate will use your indexed notes to create quiz
                  questions.
                </p>
                <input
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  placeholder="e.g. AI in project management"
                  style={{
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1px solid #374151",
                    background: "#020617",
                    color: "#e5e7eb",
                    fontSize: "0.85rem",
                    marginBottom: "0.5rem",
                  }}
                />
                <button
                  onClick={handleQuizMe}
                  disabled={ragLoading}
                  style={{
                    padding: "0.45rem 0.9rem",
                    borderRadius: "999px",
                    border: "none",
                    background:
                      "linear-gradient(to right, #a855f7, #6366f1)",
                    color: "#e5e7eb",
                    fontSize: "0.85rem",
                    cursor: ragLoading ? "not-allowed" : "pointer",
                    opacity: ragLoading ? 0.7 : 1,
                  }}
                >
                  {ragLoading ? "Generating quiz…" : "Quiz me from my docs"}
                </button>
              </div>
            </div>
          </div>

          {/* Explain + Quiz outputs */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1.6fr",
              gap: "1.5rem",
            }}
          >
            {/* Explanation output */}
            <div
              style={{
                borderRadius: "0.75rem",
                border: "1px solid #1f2937",
                background: "#020617",
                padding: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>
                Explanation
              </h3>
              {explainAnswer ? (
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#e5e7eb",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {explainAnswer}
                </p>
              ) : (
                <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  Ask a question above to see an explanation based on your
                  uploaded documents.
                </p>
              )}
            </div>

            {/* Quiz output */}
            <div
              style={{
                borderRadius: "0.75rem",
                border: "1px solid #1f2937",
                background: "#020617",
                padding: "1rem",
              }}
            >
              <h3 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>
                Quiz
              </h3>
              {quizQuestions.length === 0 ? (
                <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>
                  Generate a quiz to see questions based on your notes.
                </p>
              ) : (
                <ol
                  style={{
                    paddingLeft: "1.1rem",
                    fontSize: "0.9rem",
                    color: "#e5e7eb",
                  }}
                >
                  {quizQuestions.map((q, idx) => (
                    <li key={idx} style={{ marginBottom: "0.75rem" }}>
                      <div
                        style={{
                          marginBottom: "0.25rem",
                          fontWeight: 500,
                        }}
                      >
                        {q.question}
                      </div>
                      <ul
                        style={{
                          paddingLeft: "1.1rem",
                          marginBottom: "0.15rem",
                        }}
                      >
                        {q.options.map((opt, i) => (
                          <li
                            key={i}
                            style={{
                              fontSize: "0.85rem",
                              color:
                                i === q.correct_index
                                  ? "#bbf7d0"
                                  : "#e5e7eb",
                            }}
                          >
                            {String.fromCharCode(65 + i)}. {opt}
                          </li>
                        ))}
                      </ul>
                      {q.explanation && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "#9ca3af",
                          }}
                        >
                          Explanation: {q.explanation}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
