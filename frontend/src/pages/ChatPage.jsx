// src/pages/ChatPage.jsx
import { useState, useRef, useEffect } from "react";
import apiClient from "../utils/apiClient";

export default function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! I’m MindMate AI 👋\nAsk me anything about your uploaded documents or study plan.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages = [
      ...messages,
      { role: "user", content: trimmed },
    ];

    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await apiClient.post("/chat/assistant/", {
        messages: newMessages,
      });

      const reply = res.data.reply || "I couldn't generate a response.";
      setMessages([
        ...newMessages,
        { role: "assistant", content: reply },
      ]);
    } catch (err) {
      console.error(err);
      setError("Failed to get a reply from MindMate. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={pageWrapper}>
      <div style={card}>
        <header style={{ marginBottom: "1rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>
            AI Study Assistant
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            Chat with your notes and uploaded documents. I’ll try to use your
            knowledge base first before answering.
          </p>
        </header>

        <div style={chatContainer}>
          <div style={messagesContainer}>
            {messages.map((m, idx) => (
              <ChatBubble key={idx} role={m.role} content={m.content} />
            ))}
            {loading && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  padding: "0.4rem 0.6rem",
                }}
              >
                MindMate is thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={inputBar}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about a topic, your uploaded PDF, or how to revise..."
              rows={2}
              style={inputStyle}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                ...sendButton,
                opacity: loading || !input.trim() ? 0.7 : 1,
                cursor:
                  loading || !input.trim() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending…" : "Send"}
            </button>
          </div>

          {error && (
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.8rem",
                color: "#fecaca",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "0.4rem",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "0.55rem 0.8rem",
          borderRadius: "0.75rem",
          fontSize: "0.9rem",
          whiteSpace: "pre-wrap",
          background: isUser
            ? "linear-gradient(to right, #22c55e, #16a34a)"
            : "#020617",
          color: isUser ? "#ecfdf5" : "#e5e7eb",
          border: isUser ? "none" : "1px solid #1f2937",
        }}
      >
        {content}
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
  display: "flex",
  flexDirection: "column",
  height: "75vh",
};

const chatContainer = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
};

const messagesContainer = {
  flex: 1,
  overflowY: "auto",
  padding: "0.5rem",
  borderRadius: "0.75rem",
  border: "1px solid #111827",
  background:
    "radial-gradient(circle at top left, rgba(56,189,248,0.06), transparent 55%), #020617",
  marginBottom: "0.75rem",
};

const inputBar = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "flex-end",
};

const inputStyle = {
  flex: 1,
  resize: "none",
  borderRadius: "0.75rem",
  border: "1px solid #374151",
  background: "#020617",
  color: "#e5e7eb",
  padding: "0.6rem 0.75rem",
  fontSize: "0.9rem",
};

const sendButton = {
  padding: "0.6rem 1.1rem",
  borderRadius: "999px",
  border: "none",
  background: "linear-gradient(to right, #22c55e, #16a34a, #15803d)",
  color: "#ecfdf5",
  fontSize: "0.9rem",
  fontWeight: 600,
};
