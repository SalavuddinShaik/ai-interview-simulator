"use client";
import Link from "next/link";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export default function Navbar() {
  const { user, logoutUser } = useContext(AuthContext);

  return (
    <nav className="bg-gray-900 text-white shadow-md w-full px-6 py-4 flex items-center justify-between">
      <Link href="/interview" className="text-xl font-bold text-purple-400">
        InterviewEdge
      </Link>

      <div className="flex items-center gap-6">
        <Link
          href="/interview"
          className="hover:text-purple-400 transition duration-200"
        >
          Interview
        </Link>
        <Link
          href="/dashboard"
          className="hover:text-purple-400 transition duration-200"
        >
          Dashboard
        </Link>
        <Link
          href="/mentor-chat"
          className="hover:text-purple-400 transition duration-200"
        >
          🧑‍🏫 Mentor Chat
        </Link>

        {user ? (
          <>
            <span className="text-sm text-gray-300">Hi, {user.name}</span>
            <button
              onClick={logoutUser}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-sm hover:underline text-purple-300"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
