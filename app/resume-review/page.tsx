"use client";
import { useState } from "react";

export default function ResumeReviewPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!resumeText && !file) return;

    setLoading(true);
    setFeedback(null);

    const formData = new FormData();
    if (file) formData.append("resume", file);
    else formData.append("resumeText", resumeText);
    if (jobDescription) formData.append("jobDescription", jobDescription);

    try {
      const res = await fetch("http://localhost:8000/api/resume-review", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setFeedback(data);
    } catch (err) {
      console.error("Resume Review Error:", err);
      setFeedback({ error: "Something went wrong. Try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-4xl font-bold mb-6 text-purple-400">
        📄 Resume Review & ATS Analyzer
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm mb-1 text-gray-300">
            Upload PDF:
          </label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-4"
          />
          <label className="block text-sm mb-1 text-gray-300">
            Or Paste Resume:
          </label>
          <textarea
            className="w-full h-56 p-4 rounded bg-gray-800 border border-gray-700"
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste resume text here"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">
            Job Description (optional):
          </label>
          <textarea
            className="w-full h-56 p-4 rounded bg-gray-800 border border-gray-700"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job description here"
          />
        </div>
      </div>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-medium"
      >
        {loading ? "Analyzing..." : "Analyze Resume"}
      </button>

      {feedback && (
        <div className="mt-8 bg-gray-800 p-6 rounded border border-gray-700">
          {feedback.error ? (
            <p className="text-red-500">{feedback.error}</p>
          ) : (
            <>
              <p className="text-lg text-green-400 font-bold">
                ✅ Strengths: {feedback.strengths}
              </p>
              <p className="mt-2 text-sm text-yellow-400">
                ⚠️ Weaknesses: {feedback.weaknesses}
              </p>
              <p className="mt-2 text-sm text-gray-300">
                💡 Suggestions: {feedback.improvementSuggestions}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                🗣️ Tone: {feedback.tone}
              </p>
              {feedback.matchScore && (
                <p className="mt-2 text-sm text-blue-400">
                  🎯 Match Score: {feedback.matchScore}/100
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
