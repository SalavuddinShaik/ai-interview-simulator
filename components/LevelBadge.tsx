"use client";
import { useEffect, useContext, useState } from "react";
import AuthContext from "@/context/AuthContext";
import { motion } from "framer-motion";
import { fetchUserData } from "@/services/api";
import { ProgressBar } from "@/components/ProgressBar";
import LevelBadge from "@/components/LevelBadge";

function getLevelFromXP(xp: number): string {
  if (xp >= 1200) return "Expert";
  if (xp >= 900) return "Advanced";
  if (xp >= 600) return "Skilled";
  if (xp >= 300) return "Intermediate";
  return "Beginner";
}

export default function Dashboard() {
  const { user, token, refreshUserData } = useContext(AuthContext);
  const [careerData, setCareerData] = useState({
    currentMilestone: "",
    interviewsAttended: 0,
    jobApplications: 0,
    xp: 0,
    score: 0,
    goals: [],
    skillsTracked: [],
    streak: 0,
    achievements: [],
  });

  useEffect(() => {
    const loadCareerData = async () => {
      if (!token) return;
      try {
        const data = await fetchUserData(token);
        console.log("📊 Full User Dashboard Data:", data);

        const calculatedLevel = getLevelFromXP(data.xp || 0);

        setCareerData({
          currentMilestone: calculatedLevel,
          interviewsAttended: data.answers?.length || 0,
          jobApplications: data.score || 0,
          xp: data.xp || 0,
          score: data.score || 0,
          goals: data.goals || [],
          skillsTracked: Object.keys(data.performanceStats || {}).filter(
            (key) => data.performanceStats[key] > 0
          ),
          streak: data.streak || 0,
          achievements: generateAchievements(data),
        });
      } catch (err) {
        console.error("Failed to fetch user dashboard data", err);
      }
    };

    loadCareerData();
  }, [token]);

  function generateAchievements(data: any) {
    const achievements = [];
    if (data.answers?.length > 0)
      achievements.push("🏅 First Answer Submitted");
    if ((data.xp || 0) >= 100) achievements.push("💯 XP Reached");
    if ((data.streak || 0) >= 3) achievements.push("🔥 3-Day Streak");
    return achievements;
  }

  const skillLabels: Record<string, string> = {
    dataStructures: "Data Structures",
    algorithms: "Algorithms",
    systemDesign: "System Design",
    behavioral: "Behavioral",
    conceptual: "Conceptual",
  };

  return (
    <div className="min-h-screen bg-[#0e0e1a] text-white p-6 flex flex-col items-center">
      <motion.h1
        className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-pink-500 to-yellow-400 text-transparent bg-clip-text"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Career Progress Tracker
      </motion.h1>

      <LevelBadge level={careerData.currentMilestone} xp={careerData.xp} />

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-5xl mt-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        <AnimatedCard label="Score" value={careerData.score.toString()} />
        <AnimatedCard
          label="Current Milestone"
          value={careerData.currentMilestone}
        />
        <AnimatedCard
          label="Interviews Attended"
          value={careerData.interviewsAttended.toString()}
        />
        <AnimatedCard
          label="Applications Sent"
          value={careerData.jobApplications.toString()}
        />
        <AnimatedCard
          label="🔥 Streak"
          value={`${careerData.streak} day${
            careerData.streak === 1 ? "" : "s"
          }`}
        />
        <div className="col-span-1 sm:col-span-2 md:col-span-3">
          <p className="text-sm text-gray-400 mb-1 text-center">
            XP to Next Level
          </p>
          <ProgressBar value={careerData.xp} max={300} />
        </div>
      </motion.div>

      <div className="w-full max-w-3xl mt-10">
        <h2 className="text-xl font-bold text-yellow-300 mb-4">
          🏆 Achievements
        </h2>
        <ul className="flex flex-wrap gap-3">
          {careerData.achievements.map((achieve, idx) => (
            <li
              key={idx}
              className="bg-gradient-to-r from-purple-500 to-indigo-600 px-4 py-2 rounded-full text-sm font-semibold"
            >
              {achieve}
            </li>
          ))}
        </ul>

        <h2 className="text-xl font-bold text-yellow-300 mt-10 mb-4">
          📌 Goals
        </h2>
        <ul className="space-y-2 list-disc list-inside text-white">
          {careerData.goals.map((goal, idx) => (
            <li key={idx}>{goal}</li>
          ))}
        </ul>

        <h2 className="text-xl font-bold text-yellow-300 mt-6 mb-4">
          🛠️ Skills Tracked
        </h2>
        <div className="flex flex-wrap gap-3">
          {careerData.skillsTracked.map((skill, idx) => (
            <span
              key={idx}
              className="bg-blue-800 text-white px-3 py-1 rounded-full text-sm"
            >
              {skillLabels[skill] || skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnimatedCard({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      className="bg-[#1c1c2e] p-4 rounded-xl text-center shadow-lg border border-gray-700"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-green-400 mt-1">{value}</p>
    </motion.div>
  );
}
