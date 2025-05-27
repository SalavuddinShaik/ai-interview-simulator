"use client";
import Link from "next/link";
import { useContext, useState } from "react";
import AuthContext from "../context/AuthContext";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full px-6 py-4 bg-black shadow-sm font-inter border-b border-neutral-800 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
        >
          InterviewEdge
        </Link>

        {/* Mobile Menu Icon */}
        <button
          className="sm:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>

        {/* Nav Links - Desktop */}
        <div className="hidden sm:flex gap-8 text-sm font-medium text-gray-300">
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
        </div>

        {/* Auth Buttons - Desktop */}
        <div className="hidden sm:flex gap-3 items-center">
          {user ? (
            <>
              <span className="text-xs text-gray-400">Hi, {user.name}</span>
              <button
                onClick={logoutUser}
                className="px-4 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold hover:scale-105 transition shadow">
                  Login
                </button>
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
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden mt-4 space-y-4 text-sm text-gray-200">
          <div className="flex flex-col gap-3">
            <Link
              href="/interview"
              className="hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Interview
            </Link>
            <Link
              href="/dashboard"
              className="hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/mentor-chat"
              className="hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              🧑‍🏫 Mentor Chat
            </Link>
            <Link
              href="/resume-review"
              className="hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              📄 Resume Review
            </Link>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            {user ? (
              <>
                <span className="text-xs text-gray-400">Hi, {user.name}</span>
                <button
                  onClick={() => {
                    logoutUser();
                    setMenuOpen(false);
                  }}
                  className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-semibold shadow"
                  >
                    Login
                  </button>
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="text-purple-400 hover:underline text-xs"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
