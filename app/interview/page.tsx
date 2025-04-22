"use client";

import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthContext from "../../context/AuthContext";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import Editor from "@monaco-editor/react";

const playSound = (filename: string) => {
  const audioPath = `/sounds/${filename}`;
  console.log("🔊 Trying to play:", audioPath);

  const audio = new Audio(audioPath);
  audio.preload = "auto";
  audio.volume = 1;

  audio
    .play()
    .then(() => {
      console.log("✅ Sound played:", filename);
    })
    .catch((err) => {
      console.error("❌ Sound failed:", err);
    });
};
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
  });
};

export default function Interview() {
  const { token, refreshUserData } = useContext(AuthContext);
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [topic, setTopic] = useState("Data Structures");

  const [difficulty, setDifficulty] = useState("Medium");
  const [questionGenerated, setQuestionGenerated] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("Python");
  const [executionOutput, setExecutionOutput] = useState("");
  const [executionFeedback, setExecutionFeedback] = useState(null);
  const isCodingTopic = topic === "Data Structures" || topic === "Algorithms";
  const isTextTopic = topic === "System Design" || topic === "Behavioral";
  const demoMode = true;
  const sampleQuestions: Record<string, string> = {
    "Data Structures": `Implement a Stack using two Queues.
  
  Write a class \`MyStack\` with the following methods:
  - \`push(x: int)\`: Pushes element \`x\` onto the stack.
  - \`pop()\`: Removes the element on the top of the stack and returns it.
  - \`top()\`: Returns the top element.
  - \`empty()\`: Returns whether the stack is empty.`,

    Algorithms: `Given an integer array, return the length of the longest increasing subsequence.
  
  Example:
  Input: [10,9,2,5,3,7,101,18]
  Output: 4
  Explanation: The LIS is [2,3,7,101]`,

    "System Design": "Design a URL shortening service like Bit.ly.",
    Behavioral: "Tell me about a time you failed and what you learned.",
    Conceptual: "What is the difference between REST and WebSocket?",
  };

  const languageTemplates: Record<string, string> = {
    Python: `def hello():\n    print("Hello, Python!")`,
    JavaScript: `function hello() {\n  console.log("Hello, JavaScript!");\n}`,
    Java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, Java!");\n  }\n}`,
    "C++": `#include<iostream>\nusing namespace std;\n\nint main() {\n  cout << "Hello, C++!";\n  return 0;\n}`,
  };
  useEffect(() => {
    if (!token) {
      // ✅ Clear interview data on logout
      localStorage.removeItem("currentQuestion");
      localStorage.removeItem("userAnswer");
      localStorage.removeItem("aiFeedback");
      localStorage.removeItem("answerTopic");

      // ✅ Redirect to login
      router.replace("/login");
      return;
    }

    // ✅ Load interview data ONLY if logged in
    const savedQuestion = localStorage.getItem("currentQuestion");
    const savedAnswer = localStorage.getItem("userAnswer");
    const savedFeedback = localStorage.getItem("aiFeedback");

    if (savedQuestion) setQuestion(savedQuestion);
    if (savedAnswer) setAnswer(savedAnswer);
    if (savedFeedback) {
      try {
        setFeedback(JSON.parse(savedFeedback));
      } catch {
        setFeedback("");
      }
    }

    if (savedQuestion) setQuestionGenerated(true);
  }, [token, router]);

  const startSpeechRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert(
        "Speech recognition is not supported in this browser. Try using Chrome."
      );
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    setListening(true);
    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setAnswer(spokenText);
      setListening(false);
    };
    recognition.onerror = (error) => {
      console.error("Speech recognition error:", error);
      alert("Error with speech recognition. Please try again.");
      setListening(false);
    };
    recognition.start();
  };

  const fetchQuestion = async () => {
    setLoading(true);
    setQuestion("");
    setFeedback("");
    setQuestionGenerated(false);

    try {
      if (demoMode) {
        // ✅ Use predefined question from sampleQuestions
        const demoQuestion =
          sampleQuestions[topic] || "Here is a sample question.";
        setQuestion(`**Question:**\n\n${demoQuestion}`);
        localStorage.setItem("currentQuestion", demoQuestion);
        localStorage.removeItem("userAnswer");
        localStorage.removeItem("aiFeedback");
        setQuestionGenerated(true);
        return; // 🛑 Skip API call in demo mode
      }

      // 🔁 Fallback to real API when demoMode is false
      const res = await fetch("http://localhost:8000/api/generateQuestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty, language: selectedLanguage }),
      });
      const data = await res.json();
      setQuestion(data.question || "⚠️ No question received. Try again.");
      localStorage.setItem("currentQuestion", data.question || "");
      localStorage.removeItem("userAnswer");
      localStorage.removeItem("aiFeedback");
      setQuestionGenerated(true);
    } catch (error) {
      console.error("🚨 Error fetching question:", error);
      setQuestion("⚠️ Failed to fetch question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isInvalidAnswer = (question: string, answer: string): boolean => {
    const q = question.toLowerCase().replace(/\s+/g, " ").trim();
    const a = answer.toLowerCase().replace(/\s+/g, " ").trim();

    return (
      a.length < 30 || // Too short
      a.includes(q.slice(0, 50)) || // Contains part of the question
      !a.match(/[a-zA-Z0-9]{3,}/g) || // No meaningful content
      ["hi", "hello", "hi hello"].includes(a) // Garbage input
    );
  };

  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert("Please enter your answer before submitting!");
      return;
    }
    // ⛔️ Check if answer is invalid
    if (isInvalidAnswer(question, answer)) {
      alert(
        "⚠️ Your answer is too short or too similar to the question. Please write a meaningful response."
      );
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      // ✅ Add logging HERE — this is Step A
      console.log("📤 Sending to /api/evaluate:", {
        token,
        question,
        answer,
        topic,
        difficulty,
      });
      if (demoMode) {
        const fakeFeedback = {
          grade: "pass",
          correctness:
            "Your explanation demonstrates a solid understanding of the system design problem.",
          efficiency:
            "Your architecture handles scaling and availability well with clear separation of services.",
          suggestions:
            "Consider mentioning monitoring tools or adding cache invalidation strategy.",
        };

        // ✅ Send a simulated evaluation to backend so XP/score updates
        await fetch("http://localhost:8000/api/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            simulate: true, // 🔁 tell backend this is a demo update
            question,
            answer,
            topic,
            difficulty,
            grade: "pass", // force pass for demo
          }),
        });

        setFeedback(fakeFeedback);
        localStorage.setItem("userAnswer", answer);
        localStorage.setItem("aiFeedback", JSON.stringify(fakeFeedback));
        localStorage.setItem("answerTopic", topic);
        setQuestionGenerated(false);
        await refreshUserData();

        triggerConfetti();
        playSound("success.mp3");
        setLoading(false);
        return; // 🛑 Stop here and skip backend
      }

      const res = await fetch("http://localhost:8000/api/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, answer, topic, difficulty }),
      });
      // 🔐 Step 1: Handle expired token
      if (res.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.removeItem("token");
        localStorage.removeItem("currentQuestion");
        localStorage.removeItem("userAnswer");
        localStorage.removeItem("aiFeedback");
        router.push("/login"); // redirect to login
        return;
      }

      const data = await res.json();
      // ✅ Log backend response
      console.log("🧠 Received from /api/evaluate:", data);
      if (data.feedback) {
        setFeedback(data.feedback);
        localStorage.setItem("userAnswer", answer);
        localStorage.setItem("aiFeedback", JSON.stringify(data.feedback));
        localStorage.setItem("answerTopic", topic);
        localStorage.removeItem("currentQuestion");
        await refreshUserData();
        localStorage.removeItem("answerTopic");

        if (data.feedback.grade === "pass") {
          triggerConfetti();
          playSound("success.mp3");
        } else {
          playSound("fail.mp3");
        }
      } else {
        setFeedback("⚠️ AI did not return feedback. Try again.");
        playSound("fail.mp3");
      }
    } catch (error) {
      console.error("🚨 Error submitting answer:", error);
      setFeedback("⚠️ An error occurred. Please try again.");
    } finally {
      setLoading(false);
      playSound("submit.mp3");
    }
  };
  const runCode = async () => {
    setLoading(true);
    setExecutionOutput("");
    setExecutionFeedback(null);

    try {
      const res = await fetch("http://localhost:8000/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: answer, language: selectedLanguage }),
      });

      const data = await res.json();
      setExecutionOutput(data.output || "No output returned.");
      setExecutionFeedback(data.feedback || null);
    } catch (error) {
      setExecutionOutput("⚠️ Error executing code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetInterview = () => {
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setExecutionOutput(""); // ✅ clear terminal
    setExecutionFeedback(null); // ✅ clear feedback
    setQuestionGenerated(false);
    localStorage.removeItem("currentQuestion");
    localStorage.removeItem("userAnswer");
    localStorage.removeItem("aiFeedback");
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-[Inter]">
      <motion.h1
        className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 text-transparent bg-clip-text mb-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        INTERVIEW EDGE
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="grid sm:grid-cols-2 gap-4 mb-8"
      >
        <select
          className="p-3 rounded-xl bg-gray-700 text-white border border-gray-600 hover:border-blue-400"
          value={topic}
          onChange={(e) => {
            const newTopic = e.target.value;
            setTopic(newTopic);
            setAnswer(""); // ✅ clear previous code or text
            setExecutionOutput(""); // ✅ clear terminal
            setExecutionFeedback(null); // ✅ clear feedback
            setFeedback(""); // ✅ clear AI grade feedback
          }}
        >
          <option value="Data Structures">📦 Data Structures</option>
          <option value="Algorithms">⚙️ Algorithms</option>
          <option value="System Design">🧠 System Design</option>
          <option value="Behavioral">💬 Behavioral</option>
        </select>

        <select
          className="p-3 rounded-xl bg-gray-700 text-white border border-gray-600 hover:border-blue-400"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option value="Easy">🥗 Easy</option>
          <option value="Medium">🌮 Medium</option>
          <option value="Hard">🌶️ Hard</option>
        </select>
        {isCodingTopic && (
          <select
            className="p-3 rounded-xl bg-gray-700 text-white border border-gray-600 hover:border-blue-400"
            value={selectedLanguage}
            onChange={(e) => {
              const lang = e.target.value;
              setSelectedLanguage(lang);
              if (isCodingTopic) {
                setAnswer(languageTemplates[lang]);
              }
            }}
          >
            <option value="Python">🐍 Python</option>
            <option value="JavaScript">🟨 JavaScript</option>
            <option value="Java">☕ Java</option>
            <option value="C++">💻 C++</option>
          </select>
        )}

        <button
          onClick={fetchQuestion}
          className="col-span-2 bg-gradient-to-r from-purple-500 to-blue-600 px-8 py-3 rounded-xl text-white font-semibold shadow-lg hover:scale-105 hover:brightness-110 transition"
        >
          {loading ? "🔄 Generating..." : "🧠 Generate Question"}
        </button>
      </motion.div>

      {questionGenerated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-2 max-w-4xl w-full p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700"
        >
          <h2 className="text-lg font-semibold text-blue-300 mb-2">
            Question:
          </h2>
          <pre className="text-white bg-gray-900 p-4 rounded-xl border border-gray-600 whitespace-pre-wrap text-sm leading-relaxed">
            {question}
          </pre>
        </motion.div>
      )}

      <div className="w-full max-w-4xl mt-6 rounded-xl overflow-hidden border border-gray-600 shadow-inner">
        {isCodingTopic && (
          <Editor
            height="300px"
            language={
              selectedLanguage === "C++"
                ? "cpp"
                : selectedLanguage.toLowerCase()
            }
            theme="vs-dark"
            value={answer}
            onChange={(value) => setAnswer(value || "")}
          />
        )}
        {isTextTopic && (
          <textarea
            className="w-full h-40 mt-4 p-4 text-sm rounded-xl bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        )}

        {/* Terminal Output */}
        {executionOutput && (
          <div className="mt-6 w-full max-w-4xl bg-black text-green-400 p-4 rounded-xl border border-green-600 font-mono text-sm">
            <strong className="text-white">💻 Output:</strong>
            <pre className="whitespace-pre-wrap mt-2">{executionOutput}</pre>
          </div>
        )}

        {/* AI Feedback */}

        {isCodingTopic && executionFeedback && (
          <>

            <div className="mt-4 max-w-4xl w-full p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
              <h3 className="text-xl font-bold text-blue-300 mb-4">
                🧠 AI Feedback
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-green-400 font-semibold mb-2">
                    ✅ Correctness
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {executionFeedback.correctness || "No feedback"}
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-yellow-400 font-semibold mb-2">
                    ⚡ Efficiency
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {executionFeedback.efficiency || "No feedback"}
                  </p>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                  <h4 className="text-blue-400 font-semibold mb-2">
                    📌 Suggestions
                  </h4>
                  <p className="text-gray-300 text-sm">
                    {executionFeedback.suggestions || "No feedback"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {executionFeedback?.correctness?.includes("unreadable") && (
          <div className="mt-4 p-4 bg-red-900 border border-red-500 text-red-200 rounded-lg max-w-4xl text-sm">
            🧠 <strong>Why this happened:</strong>
            <ul className="list-disc ml-5 mt-2">
              <li>There may be syntax errors or missing parts in your code</li>
              <li>
                The AI might have responded in a format that wasn’t parsable
              </li>
              <li>
                Some advanced features (like C++ templates or Java input
                scanners) might not be supported
              </li>
            </ul>
            <div className="mt-3 text-red-300">
              🔄 Tip: Try simplifying your code or switching the language and
              run again.
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 justify-center">
        {isCodingTopic && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={runCode}
            className="bg-yellow-500 px-6 py-2 rounded-xl text-white font-semibold"
          >
            ▶️ Run Code
          </motion.button>
        )}

        {isTextTopic && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={startSpeechRecognition}
            className="bg-green-500 px-6 py-2 rounded-xl text-white font-semibold"
          >
            🎤 Speak Answer
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.1 }}
          onClick={submitAnswer}
          className="bg-blue-500 px-6 py-2 rounded-xl text-white font-semibold"
        >
          {loading ? "Submitting..." : "🚀 Submit Answer"}
        </motion.button>
        {questionGenerated && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            onClick={resetInterview}
            className="bg-red-600 px-6 py-2 rounded-xl text-white font-semibold"
          >
            🔁 New Interview
          </motion.button>
        )}
      </div>

      {listening && (
        <p className="text-yellow-400 mt-3 text-sm">
          🎙 Listening... Speak now!
        </p>
      )}

      {isTextTopic && feedback && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-w-4xl w-full"
        >
          <h3 className="text-2xl font-bold text-gray-200 mb-6 flex items-center gap-2">
            💡 AI Feedback
          </h3>

          {feedback.grade && (
            <div className="mb-4 text-center">
              <span
                className={`text-md font-semibold px-5 py-2 rounded-full ${
                  feedback.grade === "pass" ? "bg-green-600" : "bg-red-600"
                } text-white`}
              >
                {feedback.grade === "pass" ? "✅ Passed" : "❌ Failed"}
              </span>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h4 className="text-green-400 font-semibold mb-2">
                ✅ Correctness
              </h4>
              <p className="text-gray-300 text-sm">
                {feedback.correctness || "No feedback available."}
              </p>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h4 className="text-yellow-400 font-semibold mb-2">
                ⚡ Efficiency
              </h4>
              <p className="text-gray-300 text-sm">
                {feedback.efficiency || "No feedback available."}
              </p>
            </div>

            <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
              <h4 className="text-blue-400 font-semibold mb-2">
                📌 Suggestions
              </h4>
              <p className="text-gray-300 text-sm">
                {feedback.suggestions || "No feedback available."}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
