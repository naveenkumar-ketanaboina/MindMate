// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);

  // Restore auth state from localStorage on first load
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const savedAccess = localStorage.getItem("accessToken");
      const savedRefresh = localStorage.getItem("refreshToken");
      if (savedUser && savedAccess) {
        setUser(JSON.parse(savedUser));
        setAccessToken(savedAccess);
        setRefreshToken(savedRefresh || null);
      }
    } catch (e) {
      console.error("Failed to restore auth from localStorage", e);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleAuthSuccess = (data) => {
    setUser(data.user);
    setAccessToken(data.access);
    setRefreshToken(data.refresh);

    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("accessToken", data.access);
    localStorage.setItem("refreshToken", data.refresh);
    setAuthError("");
  };

  const register = async ({ username, email, password }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await apiClient.post("/auth/register/", {
        username,
        email: email || undefined,
        password,
      });
      handleAuthSuccess(res.data);
      return true;
    } catch (err) {
      console.error(err);
      setAuthError("Registration failed. Try a different username or check fields.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const login = async ({ username, password }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await apiClient.post("/auth/login/", {
        username,
        password,
      });
      handleAuthSuccess(res.data);
      return true;
    } catch (err) {
      console.error(err);
      setAuthError("Login failed. Check your username/password.");
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const value = {
    user,
    accessToken,
    refreshToken,
    authError,
    authLoading,
    setAuthError,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
