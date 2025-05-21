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
  "You’re one step closer to your dream job!",
];
export default function Dashboard() {
  const router = useRouter();
  const { token, user } = useContext(AuthContext);

  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState("Beginner");
  const [interviews, setInterviews] = useState(0);
  const [streak, setStreak] = useState(0);
  const [skills, setSkills] = useState({});
  const [quote, setQuote] = useState("");

  const [stats, setStats] = useState({
    totalAnswers: 0,
    accuracy: "0%",
    lastTopic: "-",
    difficulty: "-",
  });

  const goals = [
    "Complete 10 mock interviews",
    "Improve system design skills",
    "Reach Intermediate level by May",
  ];
  const achievements = ["🎯 First Answer", "💯 100 XP", "🏆 3-Day Streak"];

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      const data = await fetchUserData(token);
      if (!data) return;

      setXp(data.xp || 0);
      setLevel(data.level || "Beginner");
      setInterviews(data.answers?.length || 0);
      setStreak(data.streak || 0);
      setSkills(data.performanceStats || {});

      const passedAnswers =
        data.answers?.filter(
          (a: { feedback?: { grade?: string } }) =>
            a.feedback?.grade?.toLowerCase() === "pass"
        ) || [];

      const last = passedAnswers[passedAnswers.length - 1];
      const recentTopic = last?.topic || "-";
      const recentDifficulty = last?.difficulty || "-";
      const accuracy = Math.round(
        (passedAnswers.length / (data.answers?.length || 1)) * 100
      );

      setStats({
        totalAnswers: data.answers?.length || 0,
        accuracy: `${accuracy}%`,
        lastTopic: recentTopic,
        difficulty: recentDifficulty,
      });
    };

    fetchData();

    const randomQuote =
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    setQuote(randomQuote);
  }, [token]);

  const skillLabels = {
    dataStructures: "Data Structures",
    algorithms: "Algorithms",
    systemDesign: "System Design",
    behavioral: "Behavioral",
    conceptual: "Conceptual",
  };

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white p-6 flex flex-col items-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-500 text-transparent bg-clip-text mb-3 drop-shadow-lg">
        Hi, {user?.name || "Guest"} 👋
      </h1>

      <p className="text-lg mb-4">
        Level: <span className="text-green-400 font-semibold">{level}</span>
      </p>

      <div className="w-full max-w-md mb-6 p-4 bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 shadow-[0_0_12px_rgba(124,58,237,0.3)]">
        <p className="text-sm text-gray-400 mb-1">XP Progress</p>
        <div className="bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-in-out ${
              xp >= 200
                ? "bg-green-400"
                : xp >= 100
                ? "bg-yellow-400"
                : "bg-red-400"
            } shadow-[0_0_8px_rgba(0,0,0,0.3)]`}
            style={{ width: `${(xp / 300) * 100}%` }}
          ></div>
        </div>

        <p className="text-sm text-center mt-1">{xp} / 300 XP</p>
        <p className="text-yellow-400 text-sm text-center mt-1">
          🧗‍♂️ {300 - xp} XP left to reach Intermediate
        </p>
      </div>

      <button
        onClick={() => router.push("/interview")}
        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white font-semibold py-3 px-8 rounded-full shadow-md transition"
      >
        🎮 Start Interview
      </button>

      <div className="w-full max-w-md text-center mb-6 p-4 rounded-2xl border border-gray-700 shadow-[0_0_12px_rgba(124,58,237,0.4)] bg-gradient-to-br from-[#1e1e2f] to-[#111118]">
        <p className="text-lg text-blue-300 font-semibold mb-2">
          🧠 <span className="text-white">Interviews Attended:</span>{" "}
          <span className="text-blue-400">{interviews}</span>
        </p>
        <p className="text-sm text-orange-300 font-medium">
          🔥 <span className="text-white">Current Streak:</span> {streak} days
        </p>
      </div>

      <div className="w-full max-w-md mb-6 p-4 bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 shadow-[0_0_12px_rgba(124,58,237,0.3)]">
        <h2 className="text-xl font-bold text-yellow-300 mb-3">
          🏆 Achievements
        </h2>
        <ul className="flex gap-2 flex-wrap text-sm text-green-300">
          {achievements.map((a, i) => (
            <li
              key={i}
              className="px-4 py-1 bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white rounded-full shadow text-sm font-semibold"
            >
              {a}
            </li>
          ))}
        </ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="w-full max-w-md mb-6 p-5 bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 shadow-[0_0_16px_rgba(124,58,237,0.4)]"
      >
        <h2 className="text-xl font-bold text-yellow-300 mb-3">📌 Goals</h2>
        <ul className="list-disc list-inside space-y-2 text-white text-sm">
          {goals.map((goal, idx) => (
            <li key={idx}>{goal}</li>
          ))}
        </ul>
      </motion.div>

      <div className="bg-gray-800 text-white text-sm p-3 rounded mt-2 w-full max-w-md">
        🌅 {quote}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-6 w-full max-w-md p-5 text-sm bg-gradient-to-br from-[#1e1e2f] to-[#111118] rounded-2xl border border-gray-700 shadow-[0_0_16px_rgba(124,58,237,0.4)]"
      >
        <h3 className="text-xl font-bold text-purple-400 mb-4 flex items-center gap-2">
          🧠 Quick Stats
        </h3>

        <p className="mb-2">✅ Total Answers: {stats.totalAnswers}</p>
        <p className="mb-2">🎯 Accuracy: {stats.accuracy}</p>

        {/* Recent Topic */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-gray-300">Recent Topic:</span>
          <span className="bg-blue-800 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
            {stats.lastTopic}
          </span>
        </div>

        {/* Difficulty */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-gray-300">Difficulty:</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              stats.difficulty === "Easy"
                ? "bg-green-800 text-green-300"
                : stats.difficulty === "Medium"
                ? "bg-yellow-800 text-yellow-300"
                : "bg-red-800 text-red-300"
            }`}
          >
            {stats.difficulty || "-"}
          </span>
        </div>
      </motion.div>

      <div className="mt-10 w-full max-w-2xl">
        <h2 className="text-xl font-bold text-yellow-300 mb-4">
          🧪 Skill Proficiency
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(skills).map(([key, value]) => {
            const numericValue = value as number;

            return (
              <div
                key={key}
                className="rounded-2xl p-4 border border-gray-700 shadow-[0_0_12px_rgba(124,58,237,0.4)] bg-gradient-to-br from-[#1e1e2f] to-[#111118] transition hover:shadow-lg hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-300 capitalize">
                    {skillLabels[key as keyof typeof skillLabels] || key}
                  </span>
                  <span className="text-sm font-bold text-white">
                    {Math.min(numericValue, 10).toFixed(1)}/10
                  </span>
                </div>

                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-full rounded-full ${
                      numericValue >= 7
                        ? "bg-green-400"
                        : numericValue >= 4
                        ? "bg-yellow-400"
                        : "bg-red-400"
                    }`}
                    style={{
                      width: `${(Math.min(numericValue, 10) / 10) * 100}%`,
                      transition: "width 0.5s ease-in-out",
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-8 bg-gradient-to-r from-gray-600 to-gray-700 hover:brightness-110 text-white px-6 py-2 rounded-full shadow-md transition"
      >
        🔁 Refresh Dashboard
      </button>
    </div>
  );
}
