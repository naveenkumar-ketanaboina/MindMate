// src/pages/KnowledgeBasePage.jsx
import { useState } from "react";
import apiClient from "../utils/apiClient";

export default function KnowledgeBasePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [docTitle, setDocTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const [explainQuestion, setExplainQuestion] = useState("");
  const [explainAnswer, setExplainAnswer] = useState("");
  const [quizTopic, setQuizTopic] = useState("");
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [ragLoading, setRagLoading] = useState(false);
  const [error, setError] = useState("");

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
    } catch (err) {
      console.error(err);
      setError("Error generating explanation. Check backend.");
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
      setError("Error generating quiz. Check backend.");
    } finally {
      setRagLoading(false);
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
          Knowledge Base & RAG
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
          Upload PDFs or notes, then ask MindMate questions or generate quizzes
          directly from your own documents.
        </p>
      </header>

      {error && (
        <div
          style={{
            marginBottom: "1rem",
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
          <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
            1. Upload a study document
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "#9ca3af",
              marginBottom: "0.75rem",
            }}
          >
            Supported: PDF, plain text. The content will be chunked and stored
            in a local vector database.
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
                color: uploadStatus.startsWith("✅") ? "#bbf7d0" : "#fecaca",
              }}
            >
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Explain & Quiz */}
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
          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
              2. Ask MindMate to explain
            </h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#9ca3af",
                marginBottom: "0.5rem",
              }}
            >
              MindMate will search your indexed documents and return the most
              relevant content.
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
              {ragLoading ? "Searching knowledge base…" : "Explain using my docs"}
            </button>
          </div>

          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
              3. Generate a quiz
            </h2>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#9ca3af",
                marginBottom: "0.5rem",
              }}
            >
              MindMate will create MCQ questions from your indexed documents.
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
                background: "linear-gradient(to right, #a855f7, #6366f1)",
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

      {/* Outputs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1.6fr",
          gap: "1.5rem",
        }}
      >
        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid #1f2937",
            background: "#020617",
            padding: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>
            Explanation
          </h2>
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
              Ask a question above to see an explanation based on your uploaded
              documents.
            </p>
          )}
        </div>

        <div
          style={{
            borderRadius: "0.75rem",
            border: "1px solid #1f2937",
            background: "#020617",
            padding: "1rem",
          }}
        >
          <h2 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>Quiz</h2>
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
                            i === q.correct_index ? "#bbf7d0" : "#e5e7eb",
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
    </div>
  );
}
