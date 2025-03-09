const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token)
      return res
        .status(401)
        .json({ message: "Access Denied: No Token Provided" });

    // Remove "Bearer " if it's included in the token
    const verified = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = verified; // Attach user data to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid Token", error: error.message });
  }
};

module.exports = authMiddleware;
