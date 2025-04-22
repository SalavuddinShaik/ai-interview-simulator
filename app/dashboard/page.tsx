"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import AuthContext from "@/context/AuthContext";
import { fetchUserData } from "@/services/api";

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

  const motivationalQuotes = [
    "Keep pushing your limits!",
    "Every interview makes you sharper!",
    "Consistency beats intensity.",
    "You’re one step closer to your dream job!",
  ];

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
          (a) => a.feedback?.grade?.toLowerCase() === "pass"
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
      <h1 className="text-4xl font-extrabold text-yellow-400 mb-3 drop-shadow-md">
        Hi, {user?.name || "Guest"} 👋
      </h1>

      <p className="text-lg mb-4">
        Level: <span className="text-green-400 font-semibold">{level}</span>
      </p>

      <div className="w-full max-w-md mb-6">
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
        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full mb-6"
      >
        🎮 Start Interview
      </button>

      <div className="text-center mb-4">
        <p className="text-xl text-blue-400">
          🧠 Interviews Attended:{" "}
          <span className="font-bold">{interviews}</span>
        </p>
        <p className="text-blue-300 text-sm mt-1">
          🔥 Current Streak: {streak} days
        </p>
      </div>

      <div className="w-full max-w-md mb-6">
        <h2 className="text-xl font-bold text-yellow-300 mb-3">
          🏆 Achievements
        </h2>
        <ul className="flex gap-2 flex-wrap text-sm text-green-300">
          {achievements.map((a, i) => (
            <li key={i} className="bg-gray-700 px-3 py-1 rounded-full">
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full max-w-md mb-6">
        <h2 className="text-xl font-bold text-yellow-300 mb-3">📌 Goals</h2>
        <ul className="list-disc list-inside space-y-2 text-white text-sm">
          {goals.map((goal, idx) => (
            <li key={idx}>{goal}</li>
          ))}
        </ul>
      </div>

      <div className="bg-gray-800 text-white text-sm p-3 rounded mt-2 w-full max-w-md">
        🌅 {quote}
      </div>
      <div className="mt-6 w-full max-w-md bg-gray-900 rounded-lg p-4 text-sm">
        <h3 className="text-yellow-300 font-bold mb-2">🧠 Quick Stats</h3>
        <p>Total Answers: {stats.totalAnswers}</p>
        <p>Accuracy: {stats.accuracy}</p>

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
      </div>

      <div className="mt-10 w-full max-w-2xl">
        <h2 className="text-xl font-bold text-yellow-300 mb-4">
          🧪 Skill Proficiency
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(skills).map(([key, value]) => (
            <div
              key={key}
              className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-300 capitalize">
                  {skillLabels[key] || key}
                </span>
                <span className="text-sm font-bold text-white">
                  {Math.min(value, 10).toFixed(1)}/10
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className={`h-full rounded-full ${
                    value >= 7
                      ? "bg-green-400"
                      : value >= 4
                      ? "bg-yellow-400"
                      : "bg-red-400"
                  }`}
                  style={{
                    width: `${(Math.min(value, 10) / 10) * 100}%`,
                    transition: "width 0.5s ease-in-out",
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => window.location.reload()}
        className="mt-8 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-full"
      >
        🔁 Refresh Dashboard
      </button>
    </div>
  );
}
