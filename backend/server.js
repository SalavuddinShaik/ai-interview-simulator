const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Interview = require("./models/Interview");
const User = require("./models/User");
const authMiddleware = require("./middleware/authMiddleware");
require("dotenv").config();
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");


console.log(
  "🔍 OpenAI API Key Loaded:",
  process.env.OPENAI_API_KEY ? "✅ Exists" : "❌ Missing"
);

const app = express();
const PORT = 8000; // Ensure it is explicitly set to 8000

/**
 * ✅ Enable CORS (Fix CORS Issue)
 */
const corsOptions = {
  origin: "http://localhost:3000",
  methods: "GET,POST,PUT,DELETE,OPTIONS",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
};
app.use(cors(corsOptions));

/**
 * ✅ Middleware
 */
app.use(express.json());

/**
 * ✅ Test Route
 */
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

/**
 * ✅ MongoDB Connection
 */
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected!"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

/**
 * ✅ Generate Interview Question using OpenAI
 */
app.post("/api/generateQuestion", async (req, res) => {
  try {
    const { topic, difficulty } = req.body;

    if (!topic || !difficulty) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log("🚀 Requesting question from OpenAI...");
    console.log(`➡️ Topic: ${topic}, Difficulty: ${difficulty}`);

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
              "You are an AI interviewer generating technical interview questions.",
          },
          {
            role: "user",
            content: `Generate a ${difficulty} level question on ${topic} for a coding interview.`,
          },
        ],
        max_tokens: 700,
      }),
    });

    const data = await response.json();
    console.log(
      "📡 Raw AI Response from OpenAI:",
      JSON.stringify(data, null, 2)
    );

    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error("❌ OpenAI Response Error:", data);
      return res
        .status(500)
        .json({ error: "Failed to generate a question from OpenAI" });
    }

    const generatedQuestion = data.choices[0].message.content.trim();
    return res.json({ question: generatedQuestion });
  } catch (error) {
    console.error("🚨 Error generating question:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

/**
 * ✅ AI Evaluation Route (Fix 500 Error)
 */
app.post("/api/evaluate", async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: "Missing question or answer" });
    }

    console.log("🚀 Evaluating Answer...");
    console.log(`➡️ Question: ${question}`);
    console.log(`➡️ Answer: ${answer}`);

    const prompt = `
      Evaluate the following answer for correctness, efficiency, and improvements.

      Question: ${question}
      Answer: ${answer}

      Provide a JSON response **without markdown formatting** in this exact format:
      {
        "correctness": "Feedback on correctness...",
        "efficiency": "Feedback on efficiency...",
        "suggestions": "Improvement suggestions..."
      }
    `;

    console.log("📡 Sending request to OpenAI...");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    console.log("✅ OpenAI Response:", JSON.stringify(data, null, 2));

    const rawResponse = data.choices[0]?.message?.content || "";
    console.log("📡 Raw AI Response Before Parsing:", rawResponse);

    const cleanedResponse = rawResponse.replace(/```json|```/g, "").trim();
    let feedback;

    try {
      feedback = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("🚨 JSON Parsing Error:", parseError);
      console.error("❌ OpenAI Raw Response:", rawResponse);
      return res.status(500).json({ error: "AI response is not valid JSON" });
    }

    res.json({ feedback });
  } catch (error) {
    console.error("🚨 Error in /api/evaluate:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});
/**
 * ✅ AI Code Execution Route (Like LeetCode)
 */
app.post("/api/execute", async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: "Missing language or code" });
    }

    console.log(`🚀 Executing ${language} code...`);

    let filename, command;

    if (language === "python") {
      filename = path.join(__dirname, "code.py");
      command = `python3 ${filename}`;
    } else if (language === "javascript") {
      filename = path.join(__dirname, "code.js");
      command = `node ${filename}`;
    } else {
      return res.status(400).json({ error: "Unsupported language" });
    }

    // 🔹 Write code to a temporary file
    fs.writeFileSync(filename, code);

    // 🔹 Execute the code
    exec(command, async (error, stdout, stderr) => {
      const executionOutput = error ? stderr || error.message : stdout;

      // 🔹 Send code to OpenAI for analysis
      const aiPrompt = `
        Analyze the following ${language} code:
        ${code}

        1️⃣ Identify potential bugs.
        2️⃣ Provide Big-O time complexity analysis.
        3️⃣ Suggest improvements.

        Respond in JSON format:
        {
          "correctness": "Your correctness analysis...",
          "efficiency": "Big-O analysis...",
          "suggestions": "Code improvement suggestions..."
        }
      `;

      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
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
      });

      const aiData = await aiResponse.json();
      const aiFeedback = aiData.choices[0]?.message?.content || "{}";

      let feedback;
      try {
        feedback = JSON.parse(aiFeedback);
      } catch {
        feedback = { correctness: "Error parsing AI response", efficiency: "", suggestions: "" };
      }

      res.json({ output: executionOutput, feedback });
    });
  } catch (error) {
    console.error("🚨 Error executing code:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


/**
 * ✅ User Login Route (Fix 404 Error)
 */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔍 Login Attempt: ", email);

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("❌ User Not Found");
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password Incorrect");
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    console.log("✅ Login Successful! Token Sent.");
    res.json({ token });
  } catch (error) {
    console.error("🚨 Error in Login:", error);
    res.status(500).json({ message: "Login failed", error });
  }
});

/**
 * ✅ Start Server
 */
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
