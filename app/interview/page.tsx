"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthContext from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import Editor from "@monaco-editor/react";

// Types
type Feedback = {
  grade?: string;
  correctness?: string;
  efficiency?: string;
  suggestions?: string;
};

type InterviewQuestion = {
  type: string;
  question: string;
  why: string;
};

type InterviewPrepData = {
  company?: string;
  role?: string;
  interviewStyle?: string;
  interviewQuestions?: InterviewQuestion[];
};

const playSound = (filename: string) => {
  const audio = new Audio(`/sounds/${filename}`);
  audio.volume = 0.5;
  audio.play().catch(() => {});
};

const triggerConfetti = () => {
  confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
};

export default function Interview() {
  const { token, refreshUserData } = useContext(AuthContext);
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [questionType, setQuestionType] = useState("coding");
  const [questionWhy, setQuestionWhy] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Python");
  const [executionOutput, setExecutionOutput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [interviewPrep, setInterviewPrep] = useState<InterviewPrepData | null>(
    null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionGenerated, setQuestionGenerated] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [topic, setTopic] = useState("Data Structures");
  const [difficulty, setDifficulty] = useState("Medium");

  const languageConfig: Record<
    string,
    { id: string; template: string; icon: string }
  > = {
    Python: {
      id: "python",
      template: "# Write your solution here\n\ndef solution():\n    pass\n",
      icon: "",
    },
    JavaScript: {
      id: "javascript",
      template: "// Write your solution here\n\nfunction solution() {\n  \n}\n",
      icon: "",
    },
    Java: {
      id: "java",
      template:
        "class Solution {\n    public static void main(String[] args) {\n        \n    }\n}",
      icon: "",
    },
    "C++": {
      id: "cpp",
      template:
        "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}",
      icon: "",
    },
    Kotlin: {
      id: "kotlin",
      template: "fun main() {\n    // Write your solution here\n    \n}",
      icon: "",
    },
  };

  const getApiUrl = () => {
    return typeof window !== "undefined" &&
      window.location.hostname !== "localhost"
      ? `http://${window.location.hostname}:8000/api`
      : "http://localhost:8000/api";
  };

  // Timer
  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!token) {
      router.replace("/login");
      return;
    }

    const savedPrep = localStorage.getItem("interviewPrep");
    if (savedPrep) {
      try {
        const prep = JSON.parse(savedPrep);
        setInterviewPrep(prep);

        if (prep.interviewQuestions?.length > 0) {
          loadQuestion(prep.interviewQuestions[0]);
          setTimerRunning(true);
        }
      } catch (e) {
        console.log("No prep data");
      }
    }
  }, [token, router]);

  const loadQuestion = (q: InterviewQuestion) => {
    setQuestion(q.question);
    setQuestionType(q.type);
    setQuestionWhy(q.why);
    setQuestionGenerated(true);
    setFeedback(null);
    setExecutionOutput("");
    setShowHint(false);

    if (q.question.toLowerCase().includes("kotlin")) {
      setSelectedLanguage("Kotlin");
      setAnswer(languageConfig["Kotlin"].template);
    } else {
      setAnswer(languageConfig[selectedLanguage].template);
    }
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setSeconds(0);

    if (interviewPrep?.interviewQuestions?.length) {
      loadQuestion(interviewPrep.interviewQuestions[currentQuestionIndex]);
      setTimerRunning(true);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${getApiUrl()}/generateQuestion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, language: selectedLanguage }),
      });
      const data = await res.json();
      setQuestion(data.question || "Failed to load question");
      setQuestionType(
        topic === "Data Structures" || topic === "Algorithms"
          ? "coding"
          : topic.toLowerCase().replace(" ", "_")
      );
      setQuestionGenerated(true);
      setTimerRunning(true);
      setAnswer(languageConfig[selectedLanguage].template);
    } catch {
      setQuestion("Failed to load question. Please try again.");
    }
    setLoading(false);
  };

  const runCode = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiUrl()}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: answer, language: selectedLanguage }),
      });
      const data = await res.json();
      setExecutionOutput(data.output || "No output");
    } catch {
      setExecutionOutput("Error executing code");
    }
    setLoading(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;

    setLoading(true);
    setTimerRunning(false);

    try {
      const res = await fetch(`${getApiUrl()}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question,
          answer,
          topic: questionType,
          difficulty,
        }),
      });

      const data = await res.json();

      if (data.feedback) {
        setFeedback({
          correctness:
            data.feedback.correctness || data.feedback.overall_feedback || "",
          efficiency: data.feedback.efficiency || "",
          suggestions: data.feedback.suggestions || "",
          grade: data.feedback.grade || "",
        });

        if (data.feedback.grade?.toLowerCase() === "pass") {
          triggerConfetti();
          playSound("success.mp3");
        }

        await refreshUserData();
      }
    } catch {
      setFeedback({ suggestions: "Error evaluating answer." });
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    if (!interviewPrep?.interviewQuestions) return;
    if (currentQuestionIndex < interviewPrep.interviewQuestions.length - 1) {
      const nextIdx = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIdx);
      loadQuestion(interviewPrep.interviewQuestions[nextIdx]);
      setTimerRunning(true);
      setSeconds(0);
    }
  };

  const exitSession = () => {
    localStorage.removeItem("interviewPrep");
    setInterviewPrep(null);
    setQuestionGenerated(false);
    setTimerRunning(false);
  };

  // ========== SETUP SCREEN ==========
  if (!interviewPrep && !questionGenerated) {
    return (
      <div className="min-h-screen bg-[#0e0e1a] text-white px-6 py-10 flex justify-center items-start">
        <div className="w-full max-w-4xl bg-gradient-to-br from-[#1e1e2f] to-[#111118] p-8 rounded-2xl border border-gray-700 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
          {/* Header */}
          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text mb-2 flex items-center gap-3">
            Interview Practice
          </h1>
          <p className="text-gray-400 mb-8">
            Practice coding, system design, and behavioral questions with AI
            feedback
          </p>

          {/* Setup Form */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Category
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Data Structures">Data Structures</option>
                <option value="Algorithms">Algorithms</option>
                <option value="System Design">System Design</option>
                <option value="Behavioral">Behavioral</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full bg-gray-800 text-white border border-gray-600 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {Object.entries(languageConfig).map(([lang, config]) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.03 }}
            onClick={fetchQuestion}
            disabled={loading}
            className="mt-8 w-full px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-lg shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Loading..." : "Start Practice"}
          </motion.button>

          {/* Personalized CTA */}
          <div className="mt-8 pt-8 border-t border-gray-700">
            <p className="text-gray-500 text-center mb-4">
              Want questions tailored to a specific company?
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => router.push("/resume-review")}
              className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg hover:brightness-110 transition"
            >
              Get Personalized Questions
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // ========== MAIN INTERVIEW INTERFACE ==========
  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 shadow-[0_0_15px_rgba(124,58,237,0.4)] p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Left: Company Info */}
            <div className="flex items-center gap-4">
              {interviewPrep?.company ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center text-xl font-bold">
                    {interviewPrep.company.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">
                      {interviewPrep.company}
                    </h1>
                    <p className="text-gray-400 text-sm">
                      {interviewPrep.role}
                    </p>
                  </div>
                </>
              ) : (
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                  Practice Mode
                </h1>
              )}
            </div>

            {/* Center: Timer & Progress */}
            <div className="flex items-center gap-6">
              {/* Timer */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                  seconds > 1800
                    ? "bg-red-500/20 border border-red-500/50"
                    : "bg-blue-500/20 border border-blue-500/50"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    timerRunning ? "bg-green-400 animate-pulse" : "bg-gray-500"
                  }`}
                />
                <span
                  className={`font-mono font-bold ${
                    seconds > 1800 ? "text-red-400" : "text-blue-300"
                  }`}
                >
                  {formatTime(seconds)}
                </span>
              </div>

              {/* Progress */}
              {interviewPrep?.interviewQuestions && (
                <div className="flex items-center gap-3 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/50">
                  <div className="flex gap-1.5">
                    {interviewPrep.interviewQuestions.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-3 h-3 rounded-full transition-all ${
                          idx === currentQuestionIndex
                            ? "bg-purple-500 shadow-lg shadow-purple-500/50"
                            : idx < currentQuestionIndex
                            ? "bg-green-500"
                            : "bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-purple-300 text-sm font-semibold">
                    {currentQuestionIndex + 1} /{" "}
                    {interviewPrep.interviewQuestions.length}
                  </span>
                </div>
              )}
            </div>

            {/* Right: Exit */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={exitSession}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/50 hover:bg-red-500/30 transition font-medium"
            >
              Exit
            </motion.button>
          </div>
        </div>

        {/* Main Content - Split View */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Question */}
          <div className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 shadow-[0_0_15px_rgba(124,58,237,0.4)] p-6 flex flex-col">
            {/* Question Type Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  questionType === "coding"
                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                    : questionType === "system_design"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                    : "bg-purple-500/20 text-purple-400 border border-purple-500/50"
                }`}
              >
                {questionType === "coding"
                  ? "Coding"
                  : questionType === "system_design"
                  ? "System Design"
                  : "Behavioral"}
              </span>
              {interviewPrep?.company && (
                <span className="text-gray-500 text-sm">
                  {interviewPrep.company} Style
                </span>
              )}
            </div>

            {/* Question */}
            <h2 className="text-xl font-semibold text-white leading-relaxed mb-6">
              {question}
            </h2>

            {/* Why Hint */}
            {questionWhy && (
              <div className="mb-6">
                <motion.button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition"
                  whileHover={{ x: 4 }}
                >
                  <span
                    className={`transition-transform ${
                      showHint ? "rotate-90" : ""
                    }`}
                  >
                    &rarr;
                  </span>
                  <span className="text-sm font-medium">
                    Why this question?
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showHint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <p className="text-gray-300 text-sm">{questionWhy}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Feedback Section */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 mt-auto"
                >
                  {/* Grade Banner */}
                  <div
                    className={`p-4 rounded-xl border ${
                      feedback.grade?.toLowerCase() === "pass"
                        ? "bg-green-500/20 border-green-500/50"
                        : "bg-yellow-500/20 border-yellow-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          feedback.grade?.toLowerCase() === "pass"
                            ? "bg-green-500/30"
                            : "bg-yellow-500/30"
                        }`}
                      >
                        {feedback.grade?.toLowerCase() === "pass" ? "✓" : "!"}
                      </div>
                      <div>
                        <h3
                          className={`text-lg font-bold ${
                            feedback.grade?.toLowerCase() === "pass"
                              ? "text-green-400"
                              : "text-yellow-400"
                          }`}
                        >
                          {feedback.grade?.toLowerCase() === "pass"
                            ? "Solution Accepted!"
                            : "Keep Improving!"}
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Completed in {formatTime(seconds)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Cards */}
                  {feedback.correctness && (
                    <div className="p-4 bg-[#161627] rounded-xl border border-gray-700">
                      <h4 className="text-green-400 font-semibold mb-2">
                        Correctness
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {feedback.correctness}
                      </p>
                    </div>
                  )}

                  {feedback.efficiency && (
                    <div className="p-4 bg-[#161627] rounded-xl border border-gray-700">
                      <h4 className="text-blue-400 font-semibold mb-2">
                        Efficiency
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {feedback.efficiency}
                      </p>
                    </div>
                  )}

                  {feedback.suggestions && (
                    <div className="p-4 bg-[#161627] rounded-xl border border-gray-700">
                      <h4 className="text-purple-400 font-semibold mb-2">
                        Suggestions
                      </h4>
                      <p className="text-gray-300 text-sm">
                        {feedback.suggestions}
                      </p>
                    </div>
                  )}

                  {/* Next Question Button */}
                  {interviewPrep?.interviewQuestions &&
                    currentQuestionIndex <
                      interviewPrep.interviewQuestions.length - 1 && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        whileHover={{ scale: 1.03 }}
                        onClick={nextQuestion}
                        className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg hover:brightness-110 transition"
                      >
                        Next Question
                      </motion.button>
                    )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Panel - Code Editor */}
          <div className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 shadow-[0_0_15px_rgba(124,58,237,0.4)] overflow-hidden flex flex-col">
            {/* Editor Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <select
                  value={selectedLanguage}
                  onChange={(e) => {
                    setSelectedLanguage(e.target.value);
                    if (
                      !answer ||
                      Object.values(languageConfig).some(
                        (c) => c.template === answer
                      )
                    ) {
                      setAnswer(languageConfig[e.target.value].template);
                    }
                  }}
                  className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(languageConfig).map(([lang, config]) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={runCode}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/50 hover:bg-yellow-500/30 transition font-medium text-sm disabled:opacity-50"
                >
                  Run
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={submitAnswer}
                  disabled={loading || !answer.trim()}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-semibold text-sm shadow-lg hover:brightness-110 disabled:opacity-50 transition"
                >
                  {loading ? "..." : "Submit"}
                </motion.button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-[400px]">
              <Editor
                height="100%"
                language={languageConfig[selectedLanguage].id}
                theme="vs-dark"
                value={answer}
                onChange={(value) => setAnswer(value || "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  renderLineHighlight: "all",
                  cursorBlinking: "smooth",
                  smoothScrolling: true,
                }}
              />
            </div>

            {/* Output Panel */}
            <div className="border-t border-gray-700">
              <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase">
                  Output
                </span>
              </div>
              <div className="p-4 min-h-[100px] max-h-[150px] overflow-y-auto font-mono text-sm">
                {executionOutput ? (
                  <pre className="text-green-400 whitespace-pre-wrap">
                    {executionOutput}
                  </pre>
                ) : (
                  <span className="text-gray-600">
                    Run your code to see output...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
