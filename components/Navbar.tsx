"use client";
import Link from "next/link";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);

  return (
    <nav className="w-full px-6 py-4 bg-[#0a0a0a] border-b border-neutral-800 shadow-sm flex items-center justify-between font-[Inter]">
      <Link
        href="/"
        className="text-2xl font-semibold text-white tracking-tight hover:text-purple-400 transition"
      >
        Interview<span className="text-purple-500">Edge</span>
      </Link>

      <div className="flex items-center gap-6 text-base font-medium text-gray-200">
        <Link href="/interview" className="hover:text-white transition">
          Interview
        </Link>
        <Link href="/dashboard" className="hover:text-white transition">
          Dashboard
        </Link>
        <Link href="/mentor-chat" className="hover:text-white transition">
          🧑‍🏫 Mentor Chat
        </Link>
        <Link href="/resume-review" className="hover:text-white transition">
          📄 Resume Review
        </Link>

        {user ? (
          <>
            <span className="text-xs text-gray-400">Hi, {user.name}</span>
            <button
              onClick={logoutUser}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-xs font-semibold shadow-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-xs font-semibold"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-purple-400 hover:underline text-xs"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
