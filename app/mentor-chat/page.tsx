"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Listbox } from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";

const mentors = {
  "The Recruiter": "/avatars/recruiter.jpg",
  "Team Lead": "/avatars/teamlead.jpg",
  "Peer Reviewer": "/avatars/peer.jpg",
  "The Guide": "/avatars/guide.jpg",
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
    <div className="min-h-screen bg-[#0e0e1a] text-white px-4 py-8 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-gradient-to-br from-[#1e1e2f] to-[#111118] p-6 rounded-2xl border border-gray-700 shadow-[0_0_12px_rgba(124,58,237,0.3)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text drop-shadow-lg flex gap-2 items-center mb-2">
            🧑‍🏫 Mentor Chat
          </h2>

          <Listbox value={selectedMentor} onChange={setSelectedMentor}>
            <div className="relative mt-1 w-52">
              <Listbox.Button className="relative w-full cursor-pointer rounded-lg bg-gray-800 text-white py-2 pl-3 pr-10 text-left shadow-md border border-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 sm:text-sm">
                <span className="block truncate">{selectedMentor}</span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-300" />
                </span>
              </Listbox.Button>

              <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-900 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                {Object.keys(mentors).map((mentor, idx) => (
                  <Listbox.Option
                    key={idx}
                    value={mentor}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                        active ? "bg-purple-600 text-white" : "text-gray-300"
                      }`
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? "font-medium" : "font-normal"
                          }`}
                        >
                          {mentor}
                        </span>
                        {selected ? (
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>
        </div>

        <div
          ref={chatRef}
          className="h-[400px] overflow-y-auto px-4 py-3 space-y-4 rounded-2xl border border-gray-700 shadow-[0_0_12px_rgba(124,58,237,0.3)] bg-gradient-to-br from-[#1e1e2f] to-[#111118] backdrop-blur-md scroll-smooth"
        >
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 12 }}
              className={`flex ${
                msg.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.from === "mentor" && (
                <img
                  src={mentors[selectedMentor]}
                  alt="mentor avatar"
                  className="w-10 h-10 rounded-full mr-3 border-2 border-purple-500 shadow-md"
                />
              )}
              <div
                className={`max-w-[70%] whitespace-pre-wrap px-4 py-3 text-sm rounded-2xl shadow-md ${
                  msg.from === "user"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                    : "bg-gradient-to-br from-[#1e1e2f] to-[#111118] text-gray-100 border border-gray-600"
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
    </div>
  );
}
