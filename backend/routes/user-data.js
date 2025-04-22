const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

require("dotenv").config();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.userId = decoded.userId;
    next();
  });
};

router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const answers = user.answers || [];
    let dynamicXP = 0;
    let dynamicScore = 0;

    // ✅ Ensure default structure
    const performanceStats = {
      dataStructures: 0,
      algorithms: 0,
      systemDesign: 0,
      behavioral: 0,
      conceptual: 0,
    };

    answers.forEach((ans) => {
      const grade = ans.feedback?.grade?.toLowerCase();
      if (grade === "pass") {
        dynamicXP += 15;
        dynamicScore += 10;

        const mapKey = {
          datastructures: "dataStructures",
          algorithms: "algorithms",
          systemdesign: "systemDesign",
          behavioral: "behavioral",
          conceptual: "conceptual",
        };

        const key = mapKey[ans.topic?.toLowerCase().replace(/\s/g, "")];
        if (key && performanceStats.hasOwnProperty(key)) {
          performanceStats[key] += 1;
        }
      }
    });

    const streakDates = new Set(
      answers.map((a) => new Date(a.date).toISOString().split("T")[0])
    );

    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      if (streakDates.has(dateStr)) {
        currentStreak++;
      } else {
        break;
      }
    }

    res.json({
      name: user.name,
      score: dynamicScore,
      xp: dynamicXP,
      level: user.level || "Beginner",
      streak: currentStreak,
      answers: user.answers || [],
      performanceStats: performanceStats || {},
      goals: user.goals || [],
      achievements: user.achievements || [],
      jobApplications: user.jobApplications || 0,
    });
  } catch (error) {
    console.error("❌ Error fetching user data:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
