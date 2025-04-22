const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.get("/", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(403).json({ error: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.json({ performanceStats: user.performanceStats });
  } catch (err) {
    console.error("Error in /performance route:", err.message);
    return res.status(500).json({ error: "Token error" });
  }
});

module.exports = router;
