const mongoose = require("mongoose");

const InterviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },  // Unique user ID
  question: { type: String, required: true },  // Interview question
  userAnswer: { type: String, required: true },  // User's answer
  aiFeedback: { type: String },  // AI-generated feedback
  score: { type: Number, default: 0 },  // Score given by AI
  createdAt: { type: Date, default: Date.now }  // Timestamp
});

module.exports = mongoose.model("Interview", InterviewSchema);
