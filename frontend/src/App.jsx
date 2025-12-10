// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import SummaryPage from "./pages/SummaryPage";
import KnowledgeBasePage from "./pages/KnowledgeBasePage";
import DashboardLayout from "./layouts/DashboardLayout";
import PlannerPage from "./pages/PlannerPage";
import HabitsPage from "./pages/HabitsPage";
import PomodoroPage from "./pages/PomodoroPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ChatPage from "./pages/ChatPage";



function PrivateRoute({ children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#020617",
          color: "#e5e7eb",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* App (protected) */}
          <Route
            path="/app"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<FlashcardsPage />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="summary" element={<SummaryPage />} />
            <Route path="knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="planner" element={<PlannerPage />} />
            <Route path="habits" element={<HabitsPage />} />
            <Route path="pomodoro" element={<PomodoroPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>

          {/* Redirect root → /app */}
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
