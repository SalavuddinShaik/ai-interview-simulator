"use client";
import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signup, login, fetchUserData } from "../services/api"; // ✅ include fetchUserData
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      try {
        const decoded = jwtDecode(storedToken);
        setUser({ name: decoded.name });
      } catch (err) {
        console.error("❌ Failed to decode token", err);
        setUser(null);
      }
    }
  }, []);

  const signupUser = async (name, email, password) => {
    try {
      const res = await signup(name, email, password); // Axios response

      if (res.status >= 200 && res.status < 300 && res.data?.token) {
        alert("✅ Signup successful! Redirecting to login...");
        router.replace("/login");
        return;
      }

      const msg = res.data?.message || res.data?.error || `HTTP ${res.status}`;
      alert(`⚠️ Signup failed: ${msg}`);
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Network error";

      if (status === 409) {
        alert("⚠️ User already exists. Please login.");
      } else if (status === 400) {
        alert(`⚠️ ${msg || "All fields are required."}`);
      } else {
        alert(`❌ Signup failed: ${msg}`);
      }
      console.error("❌ Signup error:", { status, msg, err });
    }
  };

  const loginUser = async (email, password) => {
    const response = await login(email, password);
    if (response.token) {
      localStorage.setItem("token", response.token);
      setToken(response.token);
      try {
        const decoded = jwtDecode(response.token);
        setUser({ name: decoded.name || "User" });
      } catch {
        setUser({ name: "User" });
      }
      router.replace("/interview");
    } else {
      alert("❌ Invalid credentials");
    }
  };

  const logoutUser = () => {
    // 🔐 Clear auth token
    localStorage.removeItem("token");

    // 🧹 Clear interview session data
    localStorage.removeItem("currentQuestion");
    localStorage.removeItem("userAnswer");
    localStorage.removeItem("aiFeedback");
    localStorage.removeItem("answerTopic");

    // 🧼 Reset state
    setToken(null);
    setUser(null);

    // 🚀 Redirect
    router.replace("/login");
  };

  // ✅ ADD THIS FUNCTION to refresh XP / Score etc.
  const refreshUserData = async () => {
    if (!token) return;
    try {
      const data = await fetchUserData(token);
      setUser((prev) => ({
        ...prev,
        ...data,
      }));
    } catch (err) {
      console.error("❌ Failed to refresh user data", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        signupUser,
        loginUser,
        logoutUser,
        refreshUserData,
      }} // ✅ include it here
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
