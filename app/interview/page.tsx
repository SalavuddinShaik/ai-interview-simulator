"use client";
import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthContext from "../../context/AuthContext";
import { BsSun, BsMoon, BsStopwatch } from "react-icons/bs";

export default function Interview() {
  const { token } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const [question, setQuestion] = useState(""); // Stores generated question
  const [answer, setAnswer] = useState(""); // Stores user answer
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [topic, setTopic] = useState("Data Structures");
  const [difficulty, setDifficulty] = useState("Medium");
  const [questionGenerated, setQuestionGenerated] = useState(false);

  // 🎤 Speech-to-Text Function
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

  // 📡 Generate Question from AI
  const fetchQuestion = async () => {
    setLoading(true);
    setQuestion("");
    setFeedback("");
    setQuestionGenerated(false);

    try {
      const res = await fetch("http://localhost:8000/api/generateQuestion", {
        // 🔥 Fix URL to backend
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty }),
      });

      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

      const data = await res.json();
      setQuestion(data.question || "⚠️ No question received. Try again.");
      setQuestionGenerated(true);
    } catch (error) {
      console.error("🚨 Error fetching question:", error);
      setQuestion("⚠️ Failed to fetch question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 📡 Submit Answer to AI for Feedback
  const submitAnswer = async () => {
    if (!answer.trim()) {
      alert("Please enter your answer before submitting!");
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const response = await fetch("http://localhost:8000/api/evaluate", {
        // 🔥 Ensure the correct backend port
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Full API Response:", data); // Debugging step

      // 🔥 FIX: Ensure `data.feedback` exists before setting state
      if (data.feedback) {
        setFeedback(data.feedback);
      } else {
        console.error("❌ Missing feedback in API response:", data);
        setFeedback("⚠️ AI did not return feedback. Try again.");
      }
    } catch (error) {
      console.error("🚨 Error submitting answer:", error);
      setFeedback("⚠️ An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 transition-all duration-300 bg-gray-900 text-white">
      <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text drop-shadow-lg mb-6">
        INTERVIEW EDGE
      </h1>

      {/* 🔽 Topic Selection Dropdown */}
      <select
        className="p-3 w-80 rounded-lg bg-gray-700 text-white border border-gray-600 hover:border-blue-400 mb-4"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      >
        <option value="Data Structures">Data Structures</option>
        <option value="Algorithms">Algorithms</option>
        <option value="System Design">System Design</option>
        <option value="Behavioral">Behavioral</option>
      </select>

      {/* 🔽 Difficulty Selection Dropdown */}
      <select
        className="p-3 w-80 rounded-lg bg-gray-700 text-white border border-gray-600 hover:border-blue-400 mb-6"
        value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)}
      >
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>

      {/* 🔘 Generate Question Button */}
      <button
        onClick={fetchQuestion}
        className="bg-gradient-to-r from-purple-500 to-blue-600 px-8 py-3 rounded-lg text-white font-semibold shadow-lg hover:scale-105 transition-all duration-300 flex items-center gap-2 mb-6"
      >
        {loading ? "🔄 Generating..." : "🧠 Generate Question"}
      </button>

      {/* 📢 Display Question */}
      {questionGenerated && (
        <div className="mt-6 max-w-2xl w-full p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-blue-300 mb-2">
            Question:
          </h2>
          <pre className="text-white bg-gray-900 p-4 rounded-lg border border-gray-600 whitespace-pre-wrap">
            {question}
          </pre>
        </div>
      )}

      {/* 📝 Answer Input */}
      <textarea
        className="w-full p-4 rounded-lg bg-gray-900 text-white border border-gray-600 focus:border-blue-400 outline-none"
        rows={4}
        placeholder="Type or speak your answer..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
      ></textarea>

      {/* 🎤 Speak Answer Button & Submit */}
      <div className="mt-4 flex gap-4">
        <button
          onClick={startSpeechRecognition}
          className="bg-green-500 px-6 py-2 rounded-lg text-white font-semibold hover:scale-105 transition"
        >
          🎤 Speak Answer
        </button>

        <button
          onClick={submitAnswer}
          className="bg-blue-500 px-6 py-2 rounded-lg text-white font-semibold hover:scale-105 transition"
        >
          {loading ? "Submitting..." : "Submit Answer"}
        </button>
      </div>

      {/* 🎙 Listening Indicator */}
      {listening && (
        <p className="text-yellow-500 mt-2">🎙 Listening... Speak now!</p>
      )}

      {/* 🧠 AI Feedback */}
      {feedback && (
        <div className="mt-6 p-5 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-w-2xl w-full transition-all duration-300">
          <h3 className="text-xl font-semibold text-gray-200 mb-4 flex items-center gap-2">
            💡 AI Feedback
          </h3>

          {/* ✅ Correctness Section */}
          <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-sm hover:scale-[1.02] transition-all">
            <h4 className="text-green-400 font-medium flex items-center gap-2">
              <span className="text-lg">✅</span> Correctness
            </h4>
            <p className="text-gray-300 text-sm">
              {feedback.correctness || "No feedback available."}
            </p>
          </div>

          {/* ⚡ Efficiency Section */}
          <div className="mb-4 p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-sm hover:scale-[1.02] transition-all">
            <h4 className="text-yellow-400 font-medium flex items-center gap-2">
              <span className="text-lg">⚡</span> Efficiency
            </h4>
            <p className="text-gray-300 text-sm">
              {feedback.efficiency || "No feedback available."}
            </p>
          </div>

          {/* 📌 Suggestions Section */}
          <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 shadow-sm hover:scale-[1.02] transition-all">
            <h4 className="text-blue-400 font-medium flex items-center gap-2">
              <span className="text-lg">📌</span> Suggestions
            </h4>
            <p className="text-gray-300 text-sm">
              {feedback.suggestions || "No feedback available."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
