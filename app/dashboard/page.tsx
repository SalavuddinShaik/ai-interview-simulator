"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import AuthContext from "@/context/AuthContext";
import { fetchUserData } from "@/services/api";
import { motion } from "framer-motion";

const motivationalQuotes = [
  "Keep pushing your limits!",
  "Every interview makes you sharper!",
  "Consistency beats intensity.",
  "You're one step closer to your dream job!",
];

export default function Dashboard() {
  const router = useRouter();
  const { token, user } = useContext(AuthContext);

  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState("Beginner");
  const [interviews, setInterviews] = useState(0);
  const [streak, setStreak] = useState(0);
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalAnswers: 0,
    accuracy: 0,
    lastTopic: "-",
    difficulty: "-",
    passedCount: 0,
  });

  const [recentActivity, setRecentActivity] = useState<
    Array<{
      topic: string;
      difficulty: string;
      grade: string;
      date: string;
    }>
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setLoading(true);
      const data = await fetchUserData(token);
      if (!data) {
        setLoading(false);
        return;
      }

      setXp(data.xp || 0);
      setLevel(data.level || "Beginner");
      setInterviews(data.answers?.length || 0);
      setStreak(data.streak || 0);
      setSkills(data.performanceStats || {});

      const answers = data.answers || [];
      const passedAnswers = answers.filter(
        (a: { feedback?: { grade?: string } }) =>
          a.feedback?.grade?.toLowerCase() === "pass"
      );

      const last = answers[answers.length - 1];
      const accuracy =
        answers.length > 0
          ? Math.round((passedAnswers.length / answers.length) * 100)
          : 0;

      setStats({
        totalAnswers: answers.length,
        accuracy,
        lastTopic: last?.topic || "-",
        difficulty: last?.difficulty || "-",
        passedCount: passedAnswers.length,
      });

      // Recent activity (last 5)
      const recent = answers
        .slice(-5)
        .reverse()
        .map((a: any) => ({
          topic: a.topic || "General",
          difficulty: a.difficulty || "Medium",
          grade: a.feedback?.grade || "pending",
          date: a.createdAt
            ? new Date(a.createdAt).toLocaleDateString()
            : "Recent",
        }));
      setRecentActivity(recent);

      setLoading(false);
    };

    fetchData();
    setQuote(
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    );
  }, [token]);

  const skillLabels: Record<string, string> = {
    dataStructures: "Data Structures",
    algorithms: "Algorithms",
    systemDesign: "System Design",
    behavioral: "Behavioral",
    conceptual: "Conceptual",
  };

  const getLevelProgress = () => {
    if (level === "Beginner")
      return { current: xp, max: 300, next: "Intermediate" };
    if (level === "Intermediate")
      return { current: xp - 300, max: 500, next: "Advanced" };
    return { current: xp - 800, max: 700, next: "Expert" };
  };

  const levelProgress = getLevelProgress();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e1a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white">
      {/* Header Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Welcome */}
            <div>
              <motion.h1
                className="text-3xl md:text-4xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                  {user?.name || "Guest"}
                </span>{" "}
              </motion.h1>
              <p className="text-gray-400">{quote}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/resume-review")}
                className="px-5 py-3 bg-gradient-to-br from-[#1e1e2f] to-[#111118] border border-gray-700 rounded-xl text-white font-medium hover:border-purple-500/50 transition shadow-lg"
              >
                Smart Prep
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push("/interview")}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition"
              >
                Start Interview
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* XP Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-5 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Total XP
              </span>
              <span className="text-2xl">⚡</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{xp}</p>
            <p className="text-purple-400 text-sm">
              {levelProgress.max - levelProgress.current} to{" "}
              {levelProgress.next}
            </p>
          </motion.div>

          {/* Level Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-5 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">Level</span>
              <span className="text-2xl">🏆</span>
            </div>
            <p className="text-3xl font-bold text-green-400 mb-1">{level}</p>
            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-2">
              <div
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-700"
                style={{
                  width: `${
                    (levelProgress.current / levelProgress.max) * 100
                  }%`,
                }}
              />
            </div>
          </motion.div>

          {/* Interviews Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-5 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">
                Interviews
              </span>
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">{interviews}</p>
            <p className="text-blue-400 text-sm">{stats.passedCount} passed</p>
          </motion.div>

          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-5 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-400 text-sm font-medium">Streak</span>
              <span className="text-2xl">🔥</span>
            </div>
            <p className="text-3xl font-bold text-orange-400 mb-1">
              {streak} days
            </p>
            <p className="text-gray-500 text-sm">Keep it going!</p>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Skills */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-6 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">📊</span> Skill Proficiency
            </h2>

            {Object.keys(skills).length > 0 ? (
              <div className="space-y-5">
                {Object.entries(skills).map(([key, value], index) => {
                  const numericValue = Math.min(value as number, 10);
                  const percentage = (numericValue / 10) * 100;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-300 font-medium">
                          {skillLabels[key] || key}
                        </span>
                        <span
                          className={`text-sm font-bold ${
                            numericValue >= 7
                              ? "text-green-400"
                              : numericValue >= 4
                              ? "text-yellow-400"
                              : "text-red-400"
                          }`}
                        >
                          {numericValue.toFixed(1)}/10
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            numericValue >= 7
                              ? "bg-gradient-to-r from-green-500 to-emerald-400"
                              : numericValue >= 4
                              ? "bg-gradient-to-r from-yellow-500 to-orange-400"
                              : "bg-gradient-to-r from-red-500 to-pink-400"
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No skills tracked yet</p>
                <button
                  onClick={() => router.push("/interview")}
                  className="text-purple-400 hover:text-purple-300 font-medium"
                >
                  Start your first interview →
                </button>
              </div>
            )}
          </motion.div>

          {/* Right Column - Activity & Stats */}
          <div className="space-y-6">
            {/* Accuracy Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-6 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              <h3 className="text-gray-400 text-sm font-medium mb-4">
                Success Rate
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="#374151"
                      strokeWidth="8"
                      fill="none"
                    />
                    <motion.circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={226}
                      initial={{ strokeDashoffset: 226 }}
                      animate={{
                        strokeDashoffset: 226 - (226 * stats.accuracy) / 100,
                      }}
                      transition={{ duration: 1.5, delay: 0.5 }}
                    />
                    <defs>
                      <linearGradient
                        id="gradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-white">
                    {stats.accuracy}%
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">
                    {stats.passedCount}/{stats.totalAnswers}
                  </p>
                  <p className="text-gray-500 text-sm">Questions passed</p>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-6 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Recent Activity
              </h3>

              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            activity.grade.toLowerCase() === "pass"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        />
                        <span className="text-gray-300 text-sm">
                          {activity.topic}
                        </span>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          activity.difficulty === "Easy"
                            ? "bg-green-500/20 text-green-400"
                            : activity.difficulty === "Medium"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {activity.difficulty}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">
                  No activity yet
                </p>
              )}
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-6 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>🏅</span> Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                {interviews >= 1 && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full text-xs font-semibold text-white">
                    🎯 First Answer
                  </span>
                )}
                {xp >= 100 && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full text-xs font-semibold text-white">
                    💯 100 XP
                  </span>
                )}
                {streak >= 3 && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-xs font-semibold text-white">
                    🔥 3-Day Streak
                  </span>
                )}
                {stats.passedCount >= 5 && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full text-xs font-semibold text-white">
                    ✅ 5 Passed
                  </span>
                )}
                {stats.accuracy >= 80 && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full text-xs font-semibold text-white">
                    🎯 80% Accuracy
                  </span>
                )}
                {interviews === 0 && xp < 100 && (
                  <p className="text-gray-500 text-sm">
                    Complete interviews to unlock achievements!
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Goals Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 p-6 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
        >
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl"></span> Recommended Next Steps
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3"></div>
              <h3 className="text-white font-semibold mb-1">Upload Resume</h3>
              <p className="text-gray-400 text-sm mb-3">
                Get personalized interview questions
              </p>
              <button
                onClick={() => router.push("/resume-review")}
                className="text-purple-400 text-sm font-medium hover:text-purple-300"
              >
                Go to Smart Prep →
              </button>
            </div>

            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">💻</span>
              </div>
              <h3 className="text-white font-semibold mb-1">Practice Coding</h3>
              <p className="text-gray-400 text-sm mb-3">
                Improve your data structures skills
              </p>
              <button
                onClick={() => router.push("/interview")}
                className="text-green-400 text-sm font-medium hover:text-green-300"
              >
                Start Practice →
              </button>
            </div>

            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                <span className="text-xl">🏗️</span>
              </div>
              <h3 className="text-white font-semibold mb-1">System Design</h3>
              <p className="text-gray-400 text-sm mb-3">
                Master architecture interviews
              </p>
              <button
                onClick={() => router.push("/interview")}
                className="text-blue-400 text-sm font-medium hover:text-blue-300"
              >
                Practice Design →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
