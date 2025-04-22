const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "No token provided" });

    const verified = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.userId = verified.userId; // ✅ this line is crucial
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

module.exports = authMiddleware;
