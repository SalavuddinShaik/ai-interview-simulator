// ✅ PATCHED TEST ROUTE FOR PASSED ANSWER & PERFORMANCE STATS
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // ✅ Add a fake "passed" answer with topic
    user.answers.push({
      question: "What is a binary tree?",
      userAnswer: "A binary tree is a hierarchical data structure...",
      feedback: {
        correctness: "Correct",
        efficiency: "Efficient",
        suggestions: "None",
        clarity: "Clear",
        confidence: "High",
        structure: "Good",
        relevance: "High",
        grade: "pass", // ✅ This matters
      },
      topic: "dataStructures",
      difficulty: "Medium",
    });

    // ✅ Increment performanceStats for dataStructures
    user.performanceStats.dataStructures += 1;

    await user.save();

    res.json({
      message: "✅ Fake passed answer added and performance updated",
      passedAnswers: user.answers.filter((a) => a.feedback?.grade === "pass")
        .length,
      performanceStats: user.performanceStats,
    });
  } catch (err) {
    console.error("❌ Test route error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
