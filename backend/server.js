const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Interview = require("./models/Interview");
const User = require("./models/User");
const performanceRoute = require("./routes/performance");
const authMiddleware = require("./middleware/authMiddleware");
const atsReviewRoute = require("./routes/ats-review");
const resumeReviewRoute = require("./routes/resume-review");
require("dotenv").config();
let lastQuestion = ""; // Used to prevent duplicate questions from being generated
console.log(
  "🔑 OPENAI Key Loaded in Backend:",
  process.env.OPENAI_API_KEY ? "✅ Exists" : "❌ Missing"
);

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const mentorRoute = require("./routes/mentor");
const userDataRoute = require("./routes/user-data");
const testXpRoute = require("./routes/test-xp");
const careerRoute = require("./routes/career");
const isInvalidAnswer = (question, answer) => {
  const q = question.toLowerCase().replace(/\s+/g, " ").trim();
  const a = answer.toLowerCase().replace(/\s+/g, " ").trim();

  return (
    a.length < 30 ||
    a.includes(q.slice(0, 50)) ||
    !a.match(/[a-zA-Z0-9]{3,}/g) ||
    ["hi", "hello", "hi hello"].includes(a)
  );
};
const isDuplicateAnswer = (user, question, answer) => {
  return user.answers.some(
    (entry) =>
      entry.question.trim() === question.trim() &&
      entry.userAnswer.trim() === answer.trim()
  );
};

console.log(
  "🔍 OpenAI API Key Loaded:",
  process.env.OPENAI_API_KEY ? "✅ Exists" : "❌ Missing"
);

const app = express();
const PORT = 8000;

const allowedOrigins = [
  "http://localhost:3000",
  "https://interviewedge.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

app.post("/api/generateQuestion", async (req, res) => {
  try {
    const { topic, difficulty, language } = req.body;
    if (!topic || !difficulty || !language) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const prompt = [
      {
        role: "system",
        content:
          "You are an AI interviewer generating technical coding interview questions. Tailor each question to the chosen language. Always start with **Question:** and include code in triple backticks (e.g., ```python). Do NOT explain or wrap output in markdown.",
      },
      {
        role: "user",
        content: ["Data Structures", "Algorithms"].includes(topic)
          ? `Generate a UNIQUE ${difficulty} level coding interview question in ${language} on ${topic}. Avoid repeating: "${lastQuestion}". Include function signature and constraints.`
          : `Generate a UNIQUE ${difficulty} level non-coding interview question on ${topic}. Avoid repeating: "${lastQuestion}". Focus on architecture, design, or communication.`,
      },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: prompt,
        max_tokens: 700,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      return res
        .status(500)
        .json({ error: "Failed to generate a question from OpenAI" });
    }

    const generatedQuestion = data.choices[0].message.content.trim();

    // ✅ Update memory to avoid duplicate next time
    lastQuestion = generatedQuestion;

    return res.json({ question: generatedQuestion });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

app.post("/api/evaluate", async (req, res) => {
  console.log("🔥 /api/evaluate route hit");

  const { question, answer } = req.body;
  if (req.body.simulate) {
    console.log("🧪 Demo mode evaluation - Simulating dashboard update");

    const token = req.headers.authorization?.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const user = await User.findById(decoded.userId);

    const fakeFeedback = {
      correctness: "Simulated correctness feedback.",
      efficiency: "Simulated efficiency feedback.",
      suggestions: "Simulated suggestion for improvement.",
      grade: req.body.grade || "pass",
    };
    // 🛠 Ensure suggestions is a string
    if (typeof fakeFeedback.suggestions !== "string") {
      try {
        fakeFeedback.suggestions = JSON.stringify(fakeFeedback.suggestions);
      } catch {
        fakeFeedback.suggestions = "Suggestions formatting error.";
      }
    }

    const simulatedAnswer = {
      question: req.body.question,
      userAnswer: req.body.answer,
      feedback: fakeFeedback,
      topic: req.body.topic || "General",
      difficulty: req.body.difficulty || "Medium",
      date: new Date(),
    };

    user.answers.push(simulatedAnswer);

    if (fakeFeedback.grade === "pass") {
      const passedCount = user.answers.filter(
        (a) => a.feedback?.grade === "pass"
      ).length;

      user.xp = passedCount * 25;
      user.score = passedCount * 50;
      user.streak += 1;

      // Optional: update level
      if (user.xp >= 300) user.level = "Advanced";
      else if (user.xp >= 150) user.level = "Intermediate";
      else user.level = "Beginner";
    }

    await user.save();
    // ✅ STEP 2: Update skill performanceStats
    const topicKey = (req.body.topic || "").toLowerCase().replace(/\s/g, "");

    if (!user.performanceStats) user.performanceStats = {};

    if (fakeFeedback.grade === "pass") {
      if (topicKey.includes("datastructures")) {
        user.performanceStats.dataStructures =
          (user.performanceStats.dataStructures || 0) + 1;
      } else if (topicKey.includes("algorithms")) {
        user.performanceStats.algorithms =
          (user.performanceStats.algorithms || 0) + 1;
      } else if (topicKey.includes("systemdesign")) {
        user.performanceStats.systemDesign =
          (user.performanceStats.systemDesign || 0) + 1;
      } else if (topicKey.includes("behavioral")) {
        user.performanceStats.behavioral =
          (user.performanceStats.behavioral || 0) + 1;
      } else if (topicKey.includes("conceptual")) {
        user.performanceStats.conceptual =
          (user.performanceStats.conceptual || 0) + 1;
      }
    }
    console.log("📈 Updated performanceStats:", user.performanceStats);
    return res.json({ feedback: fakeFeedback });
  }

  console.log("📥 Received:", {
    question: question?.slice(0, 50),
    answer: answer?.slice(0, 50),
  });

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an AI code evaluator. Analyze the user's answer and respond with structured feedback in JSON format.",
        },
        {
          role: "user",
          content: `Question:\n${question}\n\nAnswer:\n${answer}`,
        },
      ],
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  let feedback;
  // ✅ Handle contentEvaluation format from OpenAI
  if (
    !feedback &&
    data.choices &&
    data.choices[0]?.message?.content.includes('"contentEvaluation"')
  ) {
    console.log("🧠 Detected 'contentEvaluation' format. Remapping...");

    try {
      const rawContent = data.choices[0]?.message?.content || "";
      const cleaned = rawContent.replace(/```json|```/g, "").trim();
      const jsonStart = cleaned.indexOf("{");
      const parsed = JSON.parse(cleaned.slice(jsonStart));

      const sections = parsed.contentEvaluation;

      const extract = (key) =>
        Object.values(sections)
          .map((sec) => sec[key])
          .filter(Boolean)
          .join(" ");

      feedback = {
        correctness: extract("commendation") || "No correctness feedback.",
        efficiency: extract("recommendation") || "No efficiency feedback.",
        suggestions: extract("recommendation") || "No suggestions available.",
        grade: "pass",
      };

      console.log("✅ Feedback remapped from contentEvaluation:", feedback);
    } catch (err) {
      console.log("❌ Failed to parse 'contentEvaluation' block:", err.message);
    }
  }
  // ✅ Handle structured feedback with content_comprehension, technical_accuracy, etc.
  if (
    !feedback &&
    data.choices?.[0]?.message?.content.includes("content_comprehension")
  ) {
    try {
      const raw = data.choices[0].message.content
        .replace(/```json|```/g, "")
        .trim();
      const parsed = JSON.parse(raw);

      const extract = (section) => {
        if (!section) return "";
        return [
          ...(section.strengths || []),
          ...(section.areas_of_improvement || []),
          section.feedback || "",
        ].join(" ");
      };

      feedback = {
        correctness: extract(parsed.technical_accuracy),
        efficiency: extract(parsed.completeness),
        suggestions:
          [extract(parsed.innovation), extract(parsed.clarity_and_structure)]
            .join(" ")
            .trim() || "No suggestions available.",
        grade: "pass",
      };

      console.log(
        "✅ Feedback remapped from structured evaluation format:",
        feedback
      );
    } catch (err) {
      console.log(
        "❌ Failed to parse structured evaluation block:",
        err.message
      );
    }
  }

  if (data.feedback) {
    console.log("✅ Using feedback directly from OpenAI response");

    // Fallback if it's already structured with correctness etc.
    if (
      typeof data.feedback === "object" &&
      (data.feedback.correctness ||
        data.feedback.efficiency ||
        data.feedback.suggestions)
    ) {
      feedback = data.feedback;
    }

    // NEW: Handle 'evaluation' format like data.feedback.evaluation.architecture
    else if (
      data.feedback.evaluation &&
      data.feedback.evaluation.architecture
    ) {
      const fb = data.feedback.evaluation;

      const extractSection = (section) => {
        const s = fb[section];
        if (!s) return "";
        return [
          ...(s.strengths || []),
          ...(s.areas_for_improvement || []),
          s.comment || "",
        ].join(" ");
      };

      feedback = {
        correctness: extractSection("architecture"),
        efficiency: extractSection("scalability"),
        suggestions:
          extractSection("personalization") +
          " " +
          extractSection("reliability") +
          " " +
          extractSection("analytics") +
          " " +
          extractSection("technology_choices"),
        grade: "fail",
      };
    }
  }

  try {
    // Try parsing directly – newer GPT models already return valid JSON strings
    feedback = JSON.parse(data.choices[0]?.message?.content);
    // ✅ Clean mapping: Extract only correctness, efficiency, suggestions
    if (
      !feedback.correctness &&
      !feedback.efficiency &&
      !feedback.suggestions &&
      feedback.Architecture
    ) {
      const extract = (obj) =>
        Object.values(obj || {})
          .filter(Boolean)
          .join(" ");

      feedback = {
        correctness: extract(feedback.Architecture),
        efficiency: extract(feedback["RealTimeCommunication"]),
        suggestions: extract(feedback["OverallFeedback"]),
        grade: "pass", // optional: you can assign based on keyword logic if needed
      };
    }

    // ✅ Remap structured behavioral feedback if present
    if (
      !feedback.correctness &&
      !feedback.efficiency &&
      !feedback.suggestions &&
      feedback.clarity?.comments &&
      feedback.overall_feedback
    ) {
      console.log(
        "🧠 Remapping structured behavioral feedback to standard format..."
      );

      feedback = {
        correctness: feedback.clarity.comments || "No correctness feedback.",
        efficiency: feedback.depth?.comments || "No efficiency feedback.",
        suggestions: feedback.overall_feedback || "No suggestions available.",
        grade: "pass",
      };

      // Optional: downgrade to fail if average rating is low
      const scores = [
        feedback.clarity?.rating,
        feedback.completeness?.rating,
        feedback.relevance?.rating,
        feedback.persuasiveness?.rating,
        feedback.depth?.rating,
        feedback.professionalism?.rating,
      ].filter((n) => typeof n === "number");

      const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      if (avg < 4) feedback.grade = "fail";
    }

    // ✅ Remap system design-style structured feedback if present
    if (
      !feedback.correctness &&
      !feedback.efficiency &&
      !feedback.suggestions &&
      feedback.analysis?.assessment
    ) {
      console.log("🧠 Remapping system design feedback...");

      const strengths = feedback.analysis.assessment.strengths?.join(" ") || "";
      const weaknesses =
        feedback.analysis.assessment.weaknesses?.join(" ") || "";
      const tradeoffs = Object.values(feedback.analysis.trade_offs || {}).join(
        " "
      );

      feedback = {
        correctness: strengths || "No correctness feedback.",
        efficiency: tradeoffs || "No efficiency feedback.",
        suggestions: weaknesses || "No suggestions available.",
        grade: "pass",
      };

      // Optional: downgrade to fail if average rating is low
      const scores = [
        feedback.clarity?.rating,
        feedback.completeness?.rating,
        feedback.relevance?.rating,
        feedback.persuasiveness?.rating,
        feedback.depth?.rating,
        feedback.professionalism?.rating,
      ].filter((n) => typeof n === "number");

      const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
      if (avg < 4) feedback.grade = "fail";
    }
    // ✅ Remap OpenAI feedback using category-style keys like Architecture, Security, etc.
    if (
      !feedback.correctness &&
      !feedback.efficiency &&
      !feedback.suggestions &&
      feedback.Architecture &&
      feedback["Security and Privacy"]
    ) {
      console.log("🧠 Remapping category-based architecture feedback...");

      const extractValues = (obj) =>
        Object.values(obj || {})
          .filter(Boolean)
          .join(" ");

      const correctness =
        extractValues(feedback.Architecture) +
        " " +
        extractValues(feedback["Data Storage"]);

      const efficiency =
        extractValues(feedback["Scalability and Reliability"]) +
        " " +
        extractValues(feedback["Real-Time Communication"]);

      const suggestions =
        (feedback.Overall?.PotentialImprovements || "") +
        " " +
        extractValues(feedback["Security and Privacy"]) +
        " " +
        extractValues(feedback["Presence and Notifications"]);

      feedback = {
        correctness: correctness || "No correctness feedback.",
        efficiency: efficiency || "No efficiency feedback.",
        suggestions: suggestions || "No suggestions available.",
        grade: "pass",
      };
    }
    // ✅ Remap deeply structured feedback like "database_design", "scalability", etc.
    if (
      !feedback.correctness &&
      !feedback.efficiency &&
      !feedback.suggestions &&
      feedback.feedback &&
      feedback.feedback.database_design
    ) {
      console.log(
        "🧠 Detected deep structured system design feedback. Remapping..."
      );

      const extractSection = (section) => {
        const s = feedback.feedback[section];
        if (!s) return "";
        return [...(s.strengths || []), ...(s.suggestions || [])].join(" ");
      };

      feedback = {
        correctness: extractSection("database_design"),
        efficiency:
          extractSection("scalability") +
          " " +
          extractSection("availability_and_fault_tolerance") +
          " " +
          extractSection("caching"),
        suggestions:
          extractSection("analytics") +
          " " +
          extractSection("overall_design") +
          " " +
          extractSection("short_url_generation"),
        grade: "pass",
      };
    }
  } catch {
    // fallback in case OpenAI wraps in ```json blocks
    try {
      const raw = data.choices[0]?.message?.content || "";
      console.log("🪵 Raw OpenAI response:\n", raw);

      let cleaned = raw.replace(/```json|```/g, "").trim();

      // Extra step: find first '{' and slice from there
      const firstBrace = cleaned.indexOf("{");
      if (firstBrace !== -1) {
        cleaned = cleaned.slice(firstBrace);
      }

      feedback = JSON.parse(cleaned);
      // ✅ NEW: Handle OpenAI feedback with aspect/comment structure
      if (
        !feedback.correctness &&
        !feedback.efficiency &&
        !feedback.suggestions &&
        Array.isArray(feedback.feedback)
      ) {
        console.log(
          "🧠 Detected feedback array with 'aspect' fields. Remapping..."
        );

        const byAspect = {
          correctness: [],
          efficiency: [],
          suggestions: [],
        };

        for (const item of feedback.feedback) {
          const aspect = item.aspect?.toLowerCase() || "";
          const comment = item.comment || "";

          if (
            aspect.includes("database") ||
            aspect.includes("url generation") ||
            aspect.includes("design")
          ) {
            byAspect.correctness.push(comment);
          } else if (
            aspect.includes("scalability") ||
            aspect.includes("availability") ||
            aspect.includes("caching") ||
            aspect.includes("performance")
          ) {
            byAspect.efficiency.push(comment);
          } else {
            byAspect.suggestions.push(comment);
          }
        }

        feedback = {
          correctness:
            byAspect.correctness.join(" ") || "No correctness feedback.",
          efficiency:
            byAspect.efficiency.join(" ") || "No efficiency feedback.",
          suggestions:
            byAspect.suggestions.join(" ") || "No suggestions available.",
          grade: "pass",
        };
      }

      // 🧠 Step 2: Handle OpenAI feedback array format
      if (Array.isArray(feedback)) {
        const converted = {
          suggestions: "",
          correctness: "",
          efficiency: "",
        };

        for (const item of feedback) {
          if (
            item.category?.toLowerCase().includes("architecture") ||
            item.category?.toLowerCase().includes("components")
          ) {
            converted.correctness += item.comment + " ";
          } else if (
            item.category?.toLowerCase().includes("scalability") ||
            item.category?.toLowerCase().includes("communication")
          ) {
            converted.efficiency += item.comment + " ";
          } else {
            converted.suggestions += item.comment + " ";
          }
        }

        feedback = {
          ...converted,
          grade: "fail",
        };
      }
    } catch {
      console.log(
        "❌ Still failed to parse AI response:",
        data.choices[0]?.message?.content
      );
      return res.status(500).json({ error: "AI response is not valid JSON" });
    }
  }

  // Decode JWT
  const token = req.headers.authorization?.split(" ")[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.log("❌ Token has expired.");
      return res
        .status(401)
        .json({ error: "Session expired. Please login again." });
    } else {
      console.log("❌ JWT verification failed:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }
  }

  const user = await User.findById(decoded.userId);

  // Prepare feedback + push to user

  // if (isDuplicateAnswer(user, question, answer)) {
  //   return res
  //     .status(409)
  //     .json({ error: "Duplicate answer detected. Try something new!" });
  // }
  // ✅ NEW: Handle numeric-scored structured feedback with section.feedback and ratings
  if (
    !feedback.correctness &&
    !feedback.efficiency &&
    !feedback.suggestions &&
    typeof feedback.feedback === "object" &&
    Object.values(feedback.feedback).every(
      (v) => typeof v === "object" && "feedback" in v
    )
  ) {
    console.log("🧠 Remapping numeric feedback with per-section ratings...");

    const suggestionParts = [];
    let totalScore = 0;
    let count = 0;

    for (const section of Object.values(feedback.feedback)) {
      if (section.feedback) {
        suggestionParts.push(section.feedback);
      }
      for (const key in section) {
        if (typeof section[key] === "number") {
          totalScore += section[key];
          count++;
        }
      }
    }

    feedback.correctness = suggestionParts[0] || "No correctness feedback.";
    feedback.efficiency = suggestionParts[1] || "No efficiency feedback.";
    feedback.suggestions =
      suggestionParts.slice(2).join(" ") || "No suggestions available.";

    const avg = totalScore / (count || 1);
    feedback.grade = avg < 4 ? "fail" : "pass";

    suggestions = feedback.suggestions;
    grade = feedback.grade;
  }

  let grade = (feedback.grade || "").toLowerCase().trim();
  const correctness = (feedback.correctness || "").toLowerCase();
  const efficiency = (feedback.efficiency || "").toLowerCase();
  let suggestions = "";

  // ✅ Handle string suggestions
  if (typeof feedback.suggestions === "string" && feedback.suggestions.trim()) {
    suggestions = feedback.suggestions.trim();
  }
  // ✅ Handle array of suggestion objects
  else if (
    Array.isArray(feedback.feedback?.suggestions) &&
    typeof feedback.suggestions !== "string"
  ) {
    feedback.suggestions = feedback.feedback.suggestions
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item.suggestion) return item.suggestion;
        return JSON.stringify(item);
      })
      .join(" ");
    suggestions = feedback.suggestions;
  }

  // ✅ Handle object suggestions
  else if (
    typeof feedback.suggestions === "object" &&
    feedback.suggestions !== null
  ) {
    suggestions = Object.values(feedback.suggestions).join(" ").trim();
  }

  // ✅ Fallback: try to extract from other known fields
  if (!suggestions) {
    if (feedback.overall_suggestions) {
      suggestions = feedback.overall_suggestions;
    } else if (typeof feedback.overall === "string") {
      suggestions = feedback.overall;
    } else if (feedback.improvements) {
      suggestions = Array.isArray(feedback.improvements)
        ? feedback.improvements.join(" ")
        : feedback.improvements;
    } else if (feedback.overall?.comments) {
      suggestions = Array.isArray(feedback.overall.comments)
        ? feedback.overall.comments.join(" ")
        : feedback.overall.comments;
    } else if (feedback.feedback?.suggestions) {
      suggestions = Array.isArray(feedback.feedback.suggestions)
        ? feedback.feedback.suggestions.join(" ")
        : feedback.feedback.suggestions;
    }
  }
  // 🔥 Handle category-based design feedback from OpenAI (e.g., DesignComponents, Summary, etc.)
  if (
    !feedback.correctness &&
    !feedback.efficiency &&
    !suggestions &&
    (feedback.DesignComponents || feedback.SecurityMeasures || feedback.Summary)
  ) {
    console.log("🧠 Remapping structured architecture feedback...");

    const extractSection = (section) =>
      Object.values(section || {})
        .map((val) => {
          if (typeof val === "string") return val;
          if (Array.isArray(val)) return val.join(" ");
          return Object.values(val).join(" ");
        })
        .join(" ");

    feedback = {
      correctness: extractSection(feedback.DesignComponents),
      efficiency:
        extractSection(feedback.Scalability) +
        " " +
        extractSection(feedback.DataStorage),
      suggestions:
        extractSection(feedback.SecurityMeasures) +
        " " +
        (feedback.Summary || ""),
      grade: "pass",
    };

    suggestions = feedback.suggestions;
  }
  // ✅ Handle structured feedback like strengths, areas_for_improvement, examples, overall_assessment
  if (!suggestions && feedback.feedback) {
    const fb = feedback.feedback;

    if (
      Array.isArray(fb.areas_for_improvement) ||
      Array.isArray(fb.examples) ||
      Array.isArray(fb.strengths) ||
      typeof fb.overall_assessment === "string"
    ) {
      const suggestionParts = [];

      if (Array.isArray(fb.areas_for_improvement)) {
        suggestionParts.push(...fb.areas_for_improvement);
      }

      if (Array.isArray(fb.examples)) {
        suggestionParts.push(...fb.examples);
      }

      if (Array.isArray(fb.strengths)) {
        suggestionParts.push(...fb.strengths);
      }

      if (typeof fb.overall_assessment === "string") {
        suggestionParts.push(fb.overall_assessment);
      }

      suggestions = suggestionParts.join(" ").trim();
    }
  }
  // ✅ Handle nested feedback like feedback.overall_design.description, strengths, areas_for_improvement
  if (
    !suggestions &&
    typeof feedback.feedback === "object" &&
    Object.values(feedback.feedback).some(
      (section) =>
        typeof section === "object" &&
        (section.areas_for_improvement ||
          section.strengths ||
          section.description)
    )
  ) {
    console.log("🧠 Remapping nested structured feedback...");

    const suggestionParts = [];

    for (const section of Object.values(feedback.feedback)) {
      if (typeof section === "object") {
        if (Array.isArray(section.areas_for_improvement)) {
          suggestionParts.push(...section.areas_for_improvement);
        } else if (typeof section.areas_for_improvement === "string") {
          suggestionParts.push(section.areas_for_improvement);
        }

        if (typeof section.strengths === "string") {
          suggestionParts.push(section.strengths);
        }

        if (typeof section.description === "string") {
          suggestionParts.push(section.description);
        }
      }
    }

    suggestions = suggestionParts.join(" ").trim();
  }
  // ✅ Handle array of suggestion objects
  if (
    Array.isArray(feedback.feedback?.suggestions) &&
    typeof feedback.suggestions !== "string"
  ) {
    feedback.suggestions = feedback.feedback.suggestions
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item.suggestion) return item.suggestion;
        return JSON.stringify(item);
      })
      .join(" ");
    suggestions = feedback.suggestions;
  }

  // ✅ Remap feedback.feedback.advice if present
  if (
    !suggestions &&
    feedback.feedback &&
    feedback.feedback.advice &&
    typeof feedback.feedback.advice === "object"
  ) {
    console.log("🧠 Extracting suggestions from feedback.feedback.advice...");
    suggestions = Object.values(feedback.feedback.advice).join(" ").trim();
  }
  console.log("✨ Advice-based suggestions extracted:", suggestions);

  feedback.suggestions = suggestions || "No suggestions available.";

  // 🧹 Ensure suggestions is a string before saving
  if (typeof feedback.suggestions !== "string") {
    try {
      feedback.suggestions = JSON.stringify(feedback.suggestions);
    } catch {
      feedback.suggestions = "Suggestions formatting error.";
    }
  }

  if (typeof feedback.suggestions !== "string") {
    feedback.suggestions = JSON.stringify(feedback.suggestions);
  }

  console.log("✅ Final Suggestions Field:", feedback.suggestions);

  const combined = `${correctness} ${efficiency} ${suggestions}`.toLowerCase();

  const keywords = [
    "correct",
    "efficient",
    "well done",
    "structured",
    "clear explanation",
    "scalable",
    "secure",
    "reasonable design",
    "good choice",
    "reliable",
    "logical",
    "realistic",
  ];

  let matchCount = keywords.filter((k) => combined.includes(k)).length;

  // 🎯 Relaxed grading logic — pass if there's decent structure or effort
  if (!["pass", "fail"].includes(grade)) {
    const evaluation = feedback.evaluation || feedback.feedback || {};
    const strengthsCount = Object.values(evaluation).filter((section) => {
      return (
        section &&
        typeof section === "object" &&
        (Array.isArray(section.strengths) || Array.isArray(section.comments)) &&
        (section.strengths?.length > 0 || section.comments?.length > 0)
      );
    }).length;

    const totalSections = Object.keys(evaluation).length;

    if (matchCount >= 2 || strengthsCount >= 2 || totalSections >= 4) {
      console.log("🎓 Soft pass applied — structure or strengths detected.");
      grade = "pass";
    } else {
      console.log("❌ Not enough structure or strengths — grading as fail.");
      grade = "fail";
    }
  }

  // ✅ Additional soft grading logic for structured feedback
  if (!["pass", "fail"].includes(grade)) {
    const evaluation = feedback.evaluation || feedback.feedback || {};
    const strengthsCount = Object.values(evaluation).filter((section) => {
      return (
        section &&
        typeof section === "object" &&
        Array.isArray(section.strengths) &&
        section.strengths.length > 0
      );
    }).length;

    if (strengthsCount >= 4) {
      console.log("🎓 Soft pass applied — 4+ structured strengths found.");
      grade = "pass";
    }
  }

  // ✅ Soft override: Learning mode logic
  if (!["pass", "fail"].includes(grade)) {
    const fb = feedback.feedback || {};

    // Count strengths in nested structured feedback
    const sectionStrengths = Object.values(fb).filter((section) => {
      if (!section || typeof section !== "object") return false;
      return Array.isArray(section.strengths) && section.strengths.length >= 1;
    }).length;

    // If at least 3 sections have strengths, override to pass
    if (sectionStrengths >= 3) {
      console.log("🎓 Soft pass applied — enough strengths detected.");
      grade = "pass";
    }
  }

  console.log("🎯 Grade value:", grade);
  feedback.grade = grade; // ✅ Assign final grade to feedback

  // 🛠 Ensure suggestions is a string before saving
  if (typeof feedback.suggestions !== "string") {
    try {
      feedback.suggestions = JSON.stringify(feedback.suggestions);
    } catch {
      feedback.suggestions = "Suggestions formatting error.";
    }
  }
  // ✅ Fallback grade logic if still missing
  if (!["pass", "fail"].includes(grade)) {
    const combinedText =
      `${correctness} ${efficiency} ${suggestions}`.toLowerCase();
    const passSignals = [
      "correct",
      "efficient",
      "well done",
      "scalable",
      "good",
      "clear",
      "secure",
      "logical",
    ];
    const positiveMentions = passSignals.filter((word) =>
      combinedText.includes(word)
    ).length;

    if (positiveMentions >= 2) {
      grade = "pass";
      console.log("🎓 Fallback grade: PASS applied based on keywords");
    } else {
      grade = "fail";
      console.log("❌ Fallback grade: FAIL applied due to weak content");
    }

    feedback.grade = grade;
  }

  const newAnswer = {
    question,
    userAnswer: answer,
    feedback,
    topic: req.body.topic || "General",
    difficulty: req.body.difficulty || "Medium",
    date: new Date(),
  };
  if (feedback.structure && typeof feedback.structure === "object") {
    feedback.structure = JSON.stringify(feedback.structure);
  }

  user.answers.push(newAnswer);

  if (grade === "pass") {
    user.xp += 15;
    user.score += 10;
    console.log("✅ XP and score updated");
  } else {
    console.log("❌ No XP. Grade is not pass.");
  }

  await user.save();
  console.log("💾 User saved to DB");
  console.log("🧠 Updated User Object:", {
    name: user.name,
    xp: user.xp,
    score: user.score,
    answers: user.answers.length,
  });
  // ✅ Final fallback in case all fields are still empty
  // ✅ Final fallback: convert structured feedback if main fields are empty
  if (
    !feedback.correctness &&
    !feedback.efficiency &&
    !feedback.suggestions &&
    feedback.feedback &&
    typeof feedback.feedback === "object"
  ) {
    console.log("🧠 Detected alternate structured feedback. Converting...");
    const fb = feedback.feedback;

    const extractSection = (section) => {
      const s = fb[section];
      if (!s) return "";
      return [
        s.comment || "",
        ...(s.strengths || []),
        ...(s.suggestions || []),
        ...(s.improvements || []),
      ].join(" ");
    };

    feedback = {
      correctness:
        extractSection("1. Database Schema Design") +
        " " +
        extractSection("3. URL Generation") +
        " " +
        extractSection("database_design") +
        " " +
        extractSection("short_url_generation"),
      efficiency:
        extractSection("2. Scalability Strategies") +
        " " +
        extractSection("4. High Availability and Fault Tolerance") +
        " " +
        extractSection("5. Caching Strategies") +
        " " +
        extractSection("scalability") +
        " " +
        extractSection("high_availability") +
        " " +
        extractSection("caching_strategy"),
      suggestions:
        extractSection("6. Analytics Implementation") +
        " " +
        extractSection("Overall Design") +
        " " +
        extractSection("analytics") +
        " " +
        extractSection("overall_design"),
      grade: "pass",
    };

    // ✅ Use fb.evaluation instead of feedback.evaluation
    const evalScores = fb.evaluation || {};
    const scoreSum = [
      evalScores.clarity,
      evalScores.relevance,
      evalScores.depth,
      evalScores.communicationStrategies,
      evalScores.impact,
    ].reduce((a, b) => a + (b || 0), 0);

    const avg = scoreSum / 5;
    if (avg < 4) feedback.grade = "fail";
  }
  if (!["pass", "fail"].includes(feedback.grade?.toLowerCase?.())) {
    const correctnessText = (feedback.correctness || "").toLowerCase();
    const efficiencyText = (feedback.efficiency || "").toLowerCase();

    if (
      correctnessText.includes("correct") ||
      efficiencyText.includes("efficient") ||
      efficiencyText.includes("o(1)")
    ) {
      feedback.grade = "pass";
      console.log("🛠 Fallback grade: PASS");
    } else {
      feedback.grade = "fail";
      console.log("🛠 Fallback grade: FAIL");
    }
  }

  res.json({ feedback });
});

app.post("/api/execute", async (req, res) => {
  try {
    const { language, code } = req.body;
    if (!language || !code) {
      return res.status(400).json({ error: "Missing language or code" });
    }

    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    let filename, filepath, command;

    const lang = language.toLowerCase();

    if (lang === "python") {
      filename = "code.py";
      filepath = path.join(tempDir, filename);
      command = `python3 ${filepath}`;
    } else if (lang === "javascript") {
      filename = "code.js";
      filepath = path.join(tempDir, filename);
      command = `node ${filepath}`;
    } else if (lang === "java") {
      filename = "Main.java";
      filepath = path.join(tempDir, filename);
      command = `javac ${filepath} && java -cp ${tempDir} Main`;
    } else if (lang === "c++" || lang === "cpp") {
      filename = "main.cpp";
      filepath = path.join(tempDir, filename);
      command = `g++ -std=c++11 ${filepath} -o ${tempDir}/main && ${tempDir}/main`;
    } else {
      return res.status(400).json({ error: "Unsupported language" });
    }

    fs.writeFileSync(filepath, code);

    exec(command, { timeout: 7000 }, async (error, stdout, stderr) => {
      const executionOutput = error ? stderr || error.message : stdout;

      const aiPrompt = `
    You are an AI code reviewer. Analyze the following ${language} code and return a JSON object with the following keys:
    - correctness
    - efficiency
    - suggestions

    Important:
    - Do not include markdown (no triple backticks)
    - Do not explain anything outside the JSON
    - Do not include code in the response

    Strictly return only JSON like this:
    {
      "correctness": "Describe if the code is correct or has issues.",
      "efficiency": "Explain time/space complexity and performance.",
      "suggestions": "Give clear suggestions for improvement."
    }

    Code:
    ${code}
    `;

      const aiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [{ role: "system", content: aiPrompt }],
            max_tokens: 300,
          }),
        }
      );

      const aiData = await aiResponse.json();
      const aiFeedback = aiData.choices[0]?.message?.content || "{}";

      let feedback;
      try {
        const cleaned = aiFeedback.replace(/```json|```/g, "").trim();
        feedback = JSON.parse(cleaned);
        // ✅ Handle alternate structured feedback like clarity/impact/etc.
        if (
          !feedback.correctness &&
          !feedback.efficiency &&
          !feedback.suggestions &&
          feedback.clarity &&
          feedback.impact
        ) {
          console.log(
            "🧠 Detected alternate clarity-based feedback. Remapping..."
          );

          feedback = {
            correctness:
              feedback.clarity?.comments || "No correctness feedback.",
            efficiency:
              feedback.engagement?.comments || "No efficiency feedback.",
            suggestions:
              feedback.impact?.comments || "No suggestions available.",
            grade: "pass",
          };

          const scores = [
            feedback.clarity?.score,
            feedback.completeness?.score,
            feedback.specificity?.score,
            feedback.relevance?.score,
            feedback.engagement?.score,
            feedback.impact?.score,
          ].filter((n) => typeof n === "number");

          const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
          if (avg < 4) feedback.grade = "fail";
        }
        // ✅ NEW: Handle OpenAI feedback with aspect/comment structure
        if (
          !feedback.correctness &&
          !feedback.efficiency &&
          !feedback.suggestions &&
          Array.isArray(feedback.feedback)
        ) {
          console.log(
            "🧠 Detected feedback array with 'aspect' fields. Remapping..."
          );

          const byAspect = {
            correctness: [],
            efficiency: [],
            suggestions: [],
          };

          for (const item of feedback.feedback) {
            const aspect = item.aspect?.toLowerCase() || "";
            const comment = item.comment || "";

            if (
              aspect.includes("database") ||
              aspect.includes("url generation") ||
              aspect.includes("design")
            ) {
              byAspect.correctness.push(comment);
            } else if (
              aspect.includes("scalability") ||
              aspect.includes("availability") ||
              aspect.includes("caching") ||
              aspect.includes("performance")
            ) {
              byAspect.efficiency.push(comment);
            } else {
              byAspect.suggestions.push(comment);
            }
          }

          feedback = {
            correctness:
              byAspect.correctness.join(" ") || "No correctness feedback.",
            efficiency:
              byAspect.efficiency.join(" ") || "No efficiency feedback.",
            suggestions:
              byAspect.suggestions.join(" ") || "No suggestions available.",
            grade: "pass",
          };
        }

        // 🧠 Step 2: Handle OpenAI feedback array format
        if (Array.isArray(feedback)) {
          const converted = {
            suggestions: "",
            correctness: "",
            efficiency: "",
          };

          for (const item of feedback) {
            if (
              item.category?.toLowerCase().includes("architecture") ||
              item.category?.toLowerCase().includes("components")
            ) {
              converted.correctness += item.comment + " ";
            } else if (
              item.category?.toLowerCase().includes("scalability") ||
              item.category?.toLowerCase().includes("communication")
            ) {
              converted.efficiency += item.comment + " ";
            } else {
              converted.suggestions += item.comment + " ";
            }
          }

          feedback = {
            ...converted,
            grade: "fail",
          };
        }
      } catch {
        feedback = {
          correctness: "⚠️ AI returned an unreadable response.",
          efficiency: "Consider rephrasing or rerunning the code.",
          suggestions: "Try testing different inputs or changing languages.",
        };
      }

      res.json({ output: executionOutput, feedback });
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ message: "Invalid credentials!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials!" });

    const token = jwt.sign(
      { userId: user._id, name: user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error });
  }
});
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
    });

    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, name: newUser.name },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

app.use("/api/mentor", mentorRoute);
app.use("/api/user-data", userDataRoute);
app.use("/api/performance", performanceRoute);

app.use("/api/test-xp", testXpRoute);
app.use("/api/career", careerRoute);
app.use("/api/ats-review", atsReviewRoute);
app.use("/api/resume-review", resumeReviewRoute);
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
