"use client";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LandingPage() {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white px-6">
            {/* Background Gradient Effect - Make sure it's behind everything */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-3xl opacity-30 -z-10"></div>

            {/* Main Heading */}
            <motion.h1 
                className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 drop-shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                Welcome to <span className="text-purple-400">InterviewEdge</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
                className="text-gray-300 text-xl mt-4 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
            >
                Master Every Interview. Land Your Dream Job.
            </motion.p>

            {/* Buttons */}
            <div className="mt-8 flex gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/signup" passHref>
                        <button className="px-6 py-3 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md text-white hover:shadow-lg focus:ring focus:ring-blue-300 cursor-pointer">
                            Sign Up
                        </button>
                    </Link>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/login" passHref>
                        <button className="px-6 py-3 text-lg font-semibold bg-gray-700 rounded-lg shadow-md text-white hover:bg-gray-600 focus:ring focus:ring-gray-300 cursor-pointer">
                            Login
                        </button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
