"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface InterviewQuestion {
  type: string;
  question: string;
  why: string;
}

interface ResumeFeedbackType {
  company?: string;
  role?: string;
  strengths: string;
  weaknesses: string;
  missingKeywords?: string[];
  addedKeywords?: string[];
  improvementSuggestions: string;
  tone: string;
  matchScore?: number;
  optimizedBullets?: string[];
  interviewStyle?: string;
  interviewQuestions?: InterviewQuestion[];
  skills?: string[];
  experience?: {
    years: string;
    domain: string;
    recentCompany: string;
  };
}

export default function ResumeReviewPage() {
  const router = useRouter();
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
      const token = localStorage.getItem("token");
      const API_URL =
        typeof window !== "undefined" &&
        window.location.hostname !== "localhost"
          ? `http://${window.location.hostname}:8000/api`
          : "http://localhost:8000/api";

      const res = await fetch(`${API_URL}/resume-review`, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setFeedback(data);

      // Save to localStorage for interview page
      if (data.interviewQuestions) {
        localStorage.setItem("interviewPrep", JSON.stringify(data));
      }
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

  const handleStartInterview = () => {
    router.push("/interview");
  };

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white px-6 py-10 flex justify-center items-start">
      <div className="w-full max-w-6xl bg-gradient-to-br from-[#1e1e2f] to-[#111118] p-8 rounded-2xl border border-gray-700 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
        {/* Header */}
        <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-2 flex items-center gap-3">
          🎯 Smart Interview Prep
        </h1>
        <p className="text-gray-400 mb-8">
          Upload your resume + job description → Get ATS-optimized resume +
          personalized interview questions
        </p>

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">
                📄 Upload Resume (PDF):
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
                    <span>Click to upload your resume</span>
                    {file && (
                      <p className="text-xs text-green-400 mt-1">
                        ✅ {file.name}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400 mb-1 block">
                Or Paste Resume Text:
              </label>
              <textarea
                className="w-full h-40 bg-gray-800 text-white border border-gray-600 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume text here..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-400 mb-1 block">
              📋 Paste Job Description:
            </label>
            <textarea
              className="w-full h-64 bg-gray-800 text-white border border-gray-600 rounded-lg p-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here for personalized analysis..."
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 Tip: Include the full JD for better company detection &
              tailored questions
            </p>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          onClick={handleAnalyze}
          disabled={loading || (!resumeText && !file)}
          className="mt-8 px-8 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? "🔄 Analyzing..." : "🚀 Analyze & Prepare"}
        </motion.button>

        {/* Results Section */}
        {feedback && feedback.strengths !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mt-10 space-y-6"
          >
            {/* Company & Score Cards */}
            {feedback.company && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-6 rounded-xl border border-blue-500/50">
                  <p className="text-blue-300 text-sm">Target Company</p>
                  <p className="text-2xl font-bold text-white">
                    {feedback.company}
                  </p>
                  <p className="text-gray-400 text-sm">{feedback.role}</p>
                </div>
                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 rounded-xl border border-green-500/50">
                  <p className="text-green-300 text-sm">ATS Match Score</p>
                  <p className="text-4xl font-bold text-white">
                    {feedback.matchScore}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 rounded-xl border border-purple-500/50">
                  <p className="text-purple-300 text-sm">Interview Style</p>
                  <p className="text-sm text-white">
                    {feedback.interviewStyle}
                  </p>
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {feedback.missingKeywords &&
              feedback.missingKeywords.length > 0 && (
                <div className="bg-yellow-900/20 p-6 rounded-xl border border-yellow-500/50">
                  <h3 className="text-yellow-400 text-lg font-bold mb-3">
                    ⚠️ Missing Keywords (Add to Resume)
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {feedback.missingKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-sm"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Optimized Bullets */}
            {feedback.optimizedBullets &&
              feedback.optimizedBullets.length > 0 && (
                <div className="bg-green-900/20 p-6 rounded-xl border border-green-500/50">
                  <h3 className="text-green-400 text-lg font-bold mb-3">
                    ✅ Optimized Resume Bullets (Copy These)
                  </h3>
                  <ul className="space-y-2">
                    {feedback.optimizedBullets.map((bullet, i) => (
                      <li key={i} className="text-green-200 text-sm">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Strengths & Weaknesses */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-[#161627] p-6 rounded-xl border border-gray-700">
                <h3 className="text-green-400 text-lg font-bold mb-2">
                  ✅ Strengths
                </h3>
                <p className="text-gray-300 text-sm">{feedback.strengths}</p>
              </div>
              <div className="bg-[#161627] p-6 rounded-xl border border-gray-700">
                <h3 className="text-yellow-400 text-lg font-bold mb-2">
                  ⚠️ Areas to Improve
                </h3>
                <p className="text-gray-300 text-sm">{feedback.weaknesses}</p>
              </div>
            </div>

            {/* Interview Questions Preview */}
            {feedback.interviewQuestions &&
              feedback.interviewQuestions.length > 0 && (
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 p-6 rounded-xl border border-purple-500/50">
                  <h3 className="text-purple-400 text-lg font-bold mb-4">
                    🎤 {feedback.company} Interview Questions (Personalized for
                    You)
                  </h3>
                  <div className="space-y-4">
                    {feedback.interviewQuestions.map((q, i) => (
                      <div key={i} className="bg-black/30 p-4 rounded-lg">
                        <span className="text-xs text-purple-400 uppercase">
                          {q.type}
                        </span>
                        <p className="text-white mt-1">{q.question}</p>
                        <p className="text-gray-500 text-xs mt-2">💡 {q.why}</p>
                      </div>
                    ))}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={handleStartInterview}
                    className="mt-6 w-full px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg hover:brightness-110 transition"
                  >
                    🎤 Start {feedback.company} Mock Interview
                  </motion.button>
                </div>
              )}

            {/* Skills Detected */}
            {feedback.skills && feedback.skills.length > 0 && (
              <div className="bg-[#161627] p-6 rounded-xl border border-gray-700">
                <h3 className="text-blue-400 text-lg font-bold mb-3">
                  🛠 Skills Detected
                </h3>
                <div className="flex flex-wrap gap-2">
                  {feedback.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
