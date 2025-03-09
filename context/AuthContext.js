"use client";
import { createContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signup, login } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const router = useRouter();
    const [token, setToken] = useState(null);

    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
        }
    }, []);

    const signupUser = async (name, email, password) => {
        try {
            const response = await signup(name, email, password);
            if (response.message === "User registered successfully!") {
                alert("✅ Signup successful! Redirecting to login...");
                router.replace("/login"); // ✅ Replace to avoid going back to signup
            } else {
                alert(`⚠️ Signup failed: ${response.message}`);
            }
        } catch (error) {
            console.error("🚨 Signup Error:", error);
            alert("❌ Something went wrong. Please try again.");
        }
    };

    const loginUser = async (email, password) => {
        try {
            const response = await login(email, password);
            if (response.token) {
                localStorage.setItem("token", response.token);
                setToken(response.token);
                router.replace("/interview"); // ✅ Redirect to interview page after login
                return true;
            } else {
                alert("❌ Invalid email or password");
                return false;
            }
        } catch (error) {
            console.error("🚨 Login Error:", error);
            alert("❌ Something went wrong. Please try again.");
            return false;
        }
    };

    const logoutUser = () => {
        localStorage.removeItem("token");
        setToken(null);
        router.replace("/login"); // ✅ Redirect to login on logout
    };

    return (
        <AuthContext.Provider value={{ token, signupUser, loginUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
