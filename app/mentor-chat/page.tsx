"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const mentors = {
  "The Recruiter": "/avatars/recruiter.png",
  "Team Lead": "/avatars/teamlead.png",
  "Peer Reviewer": "/avatars/peer.png",
  "The Guide": "/avatars/guide.png",
};

export default function MentorChat() {
  const [messages, setMessages] = useState([
    {
      from: "mentor",
      text: "Hi there! I’m your mentor. Ask me anything about your career, interviews, or skills.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState("The Recruiter");

  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatRef.current?.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { from: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, mentor: selectedMentor }),
      });

      const data = await res.json();

      if (
        data.error ||
        !data.greeting ||
        !data.insight ||
        !data.tip ||
        !data.encouragement
      ) {
        throw new Error("Incomplete AI response");
      }

      const reply = `
🧠 **${data.greeting}**

💡 **Insight:** ${data.insight}

📌 **Tip:** ${data.tip}

✨ **Encouragement:** ${data.encouragement}
      `.trim();

      setMessages((prev) => [...prev, { from: "mentor", text: reply }]);
    } catch (err) {
      console.error("Mentor Chat Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          from: "mentor",
          text: "⚠️ Mentor couldn't respond clearly. Please try rephrasing your question.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold text-purple-400 flex gap-2 items-center">
          🧑‍🏫 Mentor Chat
        </h2>
        <select
          className="p-2 rounded-md bg-gray-800 border border-gray-600 text-white"
          value={selectedMentor}
          onChange={(e) => setSelectedMentor(e.target.value)}
        >
          {Object.keys(mentors).map((mentor) => (
            <option key={mentor} value={mentor}>
              {mentor}
            </option>
          ))}
        </select>
      </div>

      <div
        ref={chatRef}
        className="h-[400px] overflow-y-auto bg-gray-800 p-4 rounded-md border border-gray-700 space-y-4"
      >
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${
              msg.from === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.from === "mentor" && (
              <img
                src={mentors[selectedMentor]}
                alt="mentor avatar"
                className="w-8 h-8 rounded-full mr-2 mt-1"
              />
            )}
            <div
              className={`max-w-[70%] whitespace-pre-wrap px-4 py-2 rounded-lg text-sm ${
                msg.from === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-200"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask your mentor anything..."
          className="flex-1 p-2 rounded-lg bg-gray-800 border border-gray-600 text-white outline-none"
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-medium"
        >
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}
