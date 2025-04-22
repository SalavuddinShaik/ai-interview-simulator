"use client";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export default function SkillRadar({ stats }: { stats: any }) {
  const data = [
    { subject: "DS", value: stats?.dataStructures || 0 },
    { subject: "Algo", value: stats?.algorithms || 0 },
    { subject: "System", value: stats?.systemDesign || 0 },
    { subject: "Behavioral", value: stats?.behavioral || 0 },
    { subject: "Conceptual", value: stats?.conceptual || 0 },
  ];

  return (
    <div className="bg-[#1c1c2e] p-4 rounded-xl shadow-md w-full max-w-lg text-center mb-8">
      <h2 className="text-lg font-bold text-purple-400 mb-4">
        🧠 Your Skill Radar
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis />
          <Radar
            name="Skills"
            dataKey="value"
            stroke="#8884d8"
            fill="#8884d8"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
