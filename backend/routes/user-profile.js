const express = require("express");
const router = express.Router();
const UserProfile = require("../models/UserProfile");
const authenticate = require("../middleware/authMiddleware");

// ============ GET PROFILE ============
router.get("/", authenticate, async (req, res) => {
  try {
    let profile = await UserProfile.findOne({ userId: req.user.id });

    if (!profile) {
      profile = new UserProfile({ userId: req.user.id });
      await profile.save();
    }

    res.json(profile);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// ============ UPDATE PROFILE ============
router.put("/", authenticate, async (req, res) => {
  try {
    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      { ...req.body, "metadata.updatedAt": new Date() },
      { new: true, upsert: true }
    );

    profile.calculateCompleteness();
    await profile.save();

    res.json(profile);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// ============ GET INTERVIEW CONTEXT ============
router.get("/interview-context", authenticate, async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.json({
        level: "fresh_graduate",
        skills: [],
        experience: null,
      });
    }

    res.json(profile.getInterviewContext());
  } catch (error) {
    console.error("Get context error:", error);
    res.status(500).json({ error: "Failed to get interview context" });
  }
});

// ============ SAVE INTERVIEW RESULT ============
router.post("/interview-history", authenticate, async (req, res) => {
  try {
    const {
      topic,
      type,
      difficulty,
      scores,
      feedback,
      questionsAsked,
      duration,
    } = req.body;

    const profile = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      {
        $push: {
          interviewHistory: {
            date: new Date(),
            topic,
            type,
            difficulty,
            scores,
            feedback,
            questionsAsked,
            duration,
          },
        },
        $inc: {
          "engagement.totalSessions": 1,
          "engagement.totalPracticeTime": duration || 0,
        },
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, profile });
  } catch (error) {
    console.error("Save interview error:", error);
    res.status(500).json({ error: "Failed to save interview" });
  }
});

module.exports = router;
