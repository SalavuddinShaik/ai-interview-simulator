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

const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));
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

  try {
    // Try parsing directly – newer GPT models already return valid JSON strings
    feedback = JSON.parse(data.choices[0]?.message?.content);
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
  const newAnswer = {
    question,
    userAnswer: answer,
    feedback,
    topic: req.body.topic || "General",
    difficulty: req.body.difficulty || "Medium",
    date: new Date(),
  };
  if (isDuplicateAnswer(user, question, answer)) {
    return res
      .status(409)
      .json({ error: "Duplicate answer detected. Try something new!" });
  }

  let grade = (feedback.grade || "").toLowerCase().trim();
  const correctness = (feedback.correctness || "").toLowerCase();
  const efficiency = (feedback.efficiency || "").toLowerCase();
  const suggestions = (feedback.suggestions || "").toLowerCase();

  if (!["pass", "fail"].includes(grade)) {
    const combined = `${correctness} ${efficiency} ${suggestions}`;
    const likelyPass =
      combined.includes("correct") ||
      combined.includes("efficient") ||
      combined.includes("well done") ||
      combined.includes("works") ||
      combined.includes("success");

    grade = likelyPass ? "pass" : "fail";
    feedback.grade = grade;
    if (!feedback.grade && grade) {
      console.log(
        "⚠️ Grade was missing from AI response. Assigned fallback grade:",
        grade
      );
    }

    // ✅ Block 1: Evaluation-based fallback
    if (!feedback.correctness) {
      feedback.correctness =
        feedback.evaluation?.overall_structure?.feedback ||
        feedback.components?.feedback ||
        null;
    }

    if (!feedback.efficiency) {
      feedback.efficiency =
        feedback.evaluation?.scalability_considerations?.feedback ||
        feedback.evaluation?.components?.feedback ||
        null;
    }

    if (!feedback.suggestions) {
      const improvements = Object.values(
        feedback.evaluation?.areas_for_improvement || {}
      ).join(" ");
      feedback.suggestions = improvements || null;
    }

    // ✅ Block 2: fallback for new structured format
    if (!feedback.correctness) {
      feedback.correctness =
        feedback.overview?.strengths?.join(" ") ||
        feedback.components?.authentication?.strengths?.join(" ") ||
        "No correctness feedback.";
    }

    if (!feedback.efficiency) {
      feedback.efficiency =
        feedback.scalability?.strengths?.join(" ") ||
        feedback.communication?.strengths?.join(" ") ||
        "No efficiency feedback.";
    }

    if (!feedback.suggestions) {
      const improvementBlocks = [
        ...(feedback.overview?.suggestions || []),
        ...(feedback.components?.authentication?.suggestions || []),
        ...(feedback.components?.catalog?.suggestions || []),
        ...(feedback.components?.shoppingCart_and_inventory?.suggestions || []),
        ...(feedback.components?.payment?.suggestions || []),
        ...(feedback.components?.recommendations?.suggestions || []),
        ...(feedback.communication?.suggestions || []),
        ...(feedback.scalability?.suggestions || []),
      ];
      feedback.suggestions =
        improvementBlocks.join(" ") || "No suggestions available.";
    }
  }

  console.log("📊 Parsed feedback:", feedback);
  console.log("🎯 Grade value:", grade);

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
