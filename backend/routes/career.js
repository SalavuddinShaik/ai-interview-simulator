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

    const passedAnswers = user.answers.filter(
      (a) => a.feedback?.grade === "pass"
    );

    // ✅ Dynamic milestone
    let currentMilestone = "Getting Started";
    const count = passedAnswers.length;
    if (count >= 10) currentMilestone = "Completed 10+ Technical Interviews";
    else if (count >= 5) currentMilestone = "Completed 5 Technical Interviews";
    else if (count >= 1) currentMilestone = "First Interview Passed 🎉";

    // ✅ Streak
    const dateSet = new Set(
      user.answers.map((a) => new Date(a.date).toISOString().split("T")[0])
    );
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dateSet.has(dateStr)) streak++;
      else break;
    }

    // ✅ Tracked skills (topics)
    const topicsSet = new Set(passedAnswers.map((a) => a.topic));
    const skillsTracked = Array.from(topicsSet);

    // ✅ XP and Score
    const xp = count * 15;
    const score = count * 10;

    // ✅ Applications (placeholder logic)
    const jobApplications = count * 2;

    res.json({
      currentMilestone,
      goals: [
        "Apply to 20 jobs by May",
        "Build one open-source project",
        "Enhance System Design knowledge",
      ],
      interviewsAttended: count,
      jobApplications,
      skillsTracked,
      streak,
      xp,
      score,
    });
  } catch (err) {
    console.error("Career route error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
