"use client";
import { useState } from "react";
import { motion } from "framer-motion";

// ✅ Feedback Type
interface ResumeFeedbackType {
  strengths: string;
  weaknesses: string;
  improvementSuggestions: string;
  tone: string;
  matchScore?: number;
}

export default function ResumeReviewPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<ResumeFeedbackType | null>(null);

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
      setFeedback({
        strengths: "",
        weaknesses: "",
        improvementSuggestions: "",
        tone: "",
        matchScore: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white px-6 py-10 flex justify-center items-start">
      <div className="w-full max-w-5xl bg-gradient-to-br from-[#1e1e2f] to-[#111118] p-8 rounded-2xl border border-gray-700 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-8 flex items-center gap-3">
          📄 Resume Review & ATS Analyzer
        </h1>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">
                Upload Resume PDF:
              </label>
              <div className="relative border-2 border-dashed border-purple-500 bg-[#161627] rounded-xl p-6 text-center hover:bg-[#1c1c32] transition">
                <label className="cursor-pointer text-purple-300 font-semibold text-sm">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-8 h-8 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 16v-8m0 0l-3 3m3-3l3 3m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Click to upload your resume (PDF)</span>
                    {file && (
                      <p className="text-xs text-green-400 mt-1">
                        ✅ Selected: {file.name}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">
                Or Paste Resume:
              </label>
              <textarea
                className="w-full h-56 bg-gray-800 text-white border border-gray-600 rounded-lg p-4 resize-none shadow focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume text here..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">
              Job Description (optional):
            </label>
            <textarea
              className="w-full h-64 bg-gray-800 text-white border border-gray-600 rounded-lg p-4 resize-none shadow focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "Analyzing..." : "🚀 Analyze Resume"}
        </motion.button>

        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 p-6 rounded-2xl border border-purple-500 bg-gradient-to-br from-[#161627] to-[#0e0e1a] shadow-[0_0_15px_rgba(168,85,247,0.3)] space-y-6"
          >
            {feedback.strengths === undefined ? (
              <p className="text-red-400 font-semibold text-center">
                ❌ Something went wrong. Please try again.
              </p>
            ) : (
              <>
                <div>
                  <h3 className="text-green-400 text-xl font-bold flex items-center gap-2">
                    ✅ Strengths:
                  </h3>
                  <p className="mt-2 text-sm text-green-200 leading-relaxed">
                    {feedback.strengths}
                  </p>
                </div>

                <div>
                  <h3 className="text-yellow-400 text-xl font-bold flex items-center gap-2">
                    ⚠️ Weaknesses:
                  </h3>
                  <p className="mt-2 text-sm text-yellow-100 leading-relaxed">
                    {feedback.weaknesses}
                  </p>
                </div>

                <div>
                  <h3 className="text-blue-400 text-xl font-bold flex items-center gap-2">
                    💡 Suggestions:
                  </h3>
                  <p className="mt-2 text-sm text-blue-100 leading-relaxed">
                    {feedback.improvementSuggestions}
                  </p>
                </div>

                <div>
                  <h3 className="text-purple-400 text-xl font-bold flex items-center gap-2">
                    🗣️ Tone:
                  </h3>
                  <p className="mt-2 text-sm text-purple-200 leading-relaxed">
                    {feedback.tone}
                  </p>
                </div>

                {feedback.matchScore !== undefined && (
                  <div className="text-center mt-4 text-lg font-semibold text-cyan-400">
                    🎯 Match Score: {feedback.matchScore}/100
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
