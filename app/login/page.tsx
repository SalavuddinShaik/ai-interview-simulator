"use client";
import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import AuthContext from "../../context/AuthContext";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock } from "react-icons/fa";

export default function Login() {
    const { loginUser } = useContext(AuthContext);
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(""); // ✅ Error state

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(""); // Reset error before login attempt

        const success = await loginUser(email, password);
        setLoading(false);

        if (success) {
            router.replace("/interview"); // ✅ Redirect to Interview Page
        } else {
            setError("❌ Invalid email or password. Please try again."); // ✅ Show error message
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4">
            <motion.div 
                className="bg-white/10 backdrop-blur-lg p-10 rounded-2xl shadow-2xl w-full max-w-md border border-white/20"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <h2 className="text-center text-3xl font-semibold text-purple-400 mb-6">Login</h2>

                {error && ( // ✅ Show error message if login fails
                    <motion.p 
                        className="text-red-400 text-sm text-center mb-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        {error}
                    </motion.p>
                )}

                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="relative">
                        <FaEnvelope className="absolute left-4 top-4 text-gray-400" />
                        <input 
                            type="email"
                            placeholder="Email"
                            className="w-full p-4 pl-12 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 border border-gray-700 focus:border-purple-500 outline-none transition"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="relative">
                        <FaLock className="absolute left-4 top-4 text-gray-400" />
                        <input 
                            type="password"
                            placeholder="Password"
                            className="w-full p-4 pl-12 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 border border-gray-700 focus:border-purple-500 outline-none transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <motion.button
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 py-4 rounded-lg text-white font-semibold text-lg shadow-md hover:scale-105 hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={loading}
                    >
                        {loading ? "Logging In..." : "Login"}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
