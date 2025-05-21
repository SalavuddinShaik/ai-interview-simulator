"use client";
import Link from "next/link";
import { useContext, useState } from "react";
import AuthContext from "../context/AuthContext";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full px-4 py-3 bg-[#0a0a0a] border-b border-neutral-800 shadow-sm font-[Inter]">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-semibold text-white tracking-tight hover:text-purple-400 transition"
        >
          Interview<span className="text-purple-500">Edge</span>
        </Link>
        <button
          className="sm:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        className={`${
          menuOpen ? "block" : "hidden"
        } sm:flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-3 text-sm font-medium text-gray-200`}
      >
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6">
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

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mt-2 sm:mt-0">
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
      </div>
    </nav>
  );
}
