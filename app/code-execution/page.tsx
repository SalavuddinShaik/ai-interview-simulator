"use client";
import { useState } from "react";
import Editor from "@monaco-editor/react";

// ✅ Define the feedback type
type FeedbackType = {
  correctness: string;
  efficiency: string;
  suggestions: string;
};

export default function CodeExecutionPage() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [feedback, setFeedback] = useState<FeedbackType | null>(null);
  const [loading, setLoading] = useState(false);

  const executeCode = async () => {
    if (!code.trim()) {
      alert("Please write some code before executing!");
      return;
    }

    setLoading(true);
    setOutput("");
    setFeedback(null);

    try {
      const response = await fetch("http://localhost:8000/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const data = await response.json();
      setOutput(data.output);
      setFeedback(data.feedback);
    } catch (error) {
      console.error("🚨 Error executing code:", error);
      setOutput("⚠️ An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-900 text-white flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-4">💻 AI Code Execution</h1>

      {/* 🔹 Language Selection */}
      <div className="mb-4">
        <label className="mr-2 text-lg">Select Language:</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="p-2 rounded bg-gray-800 text-white"
        >
          <option value="python">Python</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>

      {/* 🔹 Code Editor */}
      <div className="w-full max-w-4xl h-64 border border-gray-700 rounded-lg overflow-hidden">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={(value) => setCode(value || "")}
        />
      </div>

      {/* 🔹 Execute Button */}
      <button
        onClick={executeCode}
        disabled={loading}
        className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg"
      >
        {loading ? "Executing..." : "🚀 Run Code"}
      </button>

      {/* 🔹 Output Section */}
      {output && (
        <div className="mt-6 p-4 w-full max-w-4xl bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-yellow-400">🖥️ Output</h3>
          <pre className="whitespace-pre-wrap text-gray-300">{output}</pre>
        </div>
      )}

      {/* 🔹 AI Feedback Section */}
      {feedback && (
        <div className="mt-6 p-5 w-full max-w-4xl bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-blue-400">
            💡 AI Feedback
          </h3>

          {/* ✅ Correctness */}
          <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h4 className="text-green-400 font-medium">✅ Correctness</h4>
            <p className="text-gray-300">
              {feedback.correctness || "No feedback available."}
            </p>
          </div>

          {/* ⚡ Efficiency */}
          <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h4 className="text-yellow-400 font-medium">⚡ Efficiency</h4>
            <p className="text-gray-300">
              {feedback.efficiency || "No feedback available."}
            </p>
          </div>

          {/* 📌 Suggestions */}
          <div className="mt-4 p-4 bg-gray-900 rounded-lg border border-gray-700">
            <h4 className="text-blue-400 font-medium">📌 Suggestions</h4>
            <p className="text-gray-300">
              {feedback.suggestions || "No feedback available."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
