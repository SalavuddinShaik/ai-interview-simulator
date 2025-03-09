"use client";

import Link from "next/link";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export default function Navbar() {
    const { token, logoutUser } = useContext(AuthContext);

    return (
        <nav className="bg-gray-800 p-4 flex justify-between text-white">
            <Link href="/" className="text-xl font-bold">
                InterviewEdge
            </Link>
            <div>
                {token ? (
                    <>
                        <Link href="/dashboard" className="px-4 hover:text-gray-300">
                            Dashboard
                        </Link>
                        <button onClick={logoutUser} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link href="/login" className="px-4 hover:text-gray-300">
                            Login
                        </Link>
                        <Link href="/signup" className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
}
