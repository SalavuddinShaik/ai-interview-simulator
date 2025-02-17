"use client";
import { useState } from "react";

export default function Interview() {
  const [isStarted, setIsStarted] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold text-blue-500 mb-6">
        AI Interview Simulator
      </h1>
      {!isStarted ? (
        <button
          onClick={() => setIsStarted(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
        >
          Start Interview
        </button>
      ) : (
        <p className="text-lg">Fetching AI-generated questions...</p>
      )}
    </div>
  );
}
