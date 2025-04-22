const mongoose = require("mongoose");

// ✅ Create a separate Feedback schema
const FeedbackSchema = new mongoose.Schema(
  {
    correctness: String,
    efficiency: String,
    suggestions: String,
    relevance: String,
    clarity: String,
    confidence: String,
    structure: String,
    grade: String, // ✅ Fully enforced now
  },
  { _id: false }
); // Optional: prevent _id creation for subdoc

// ✅ Embed the FeedbackSchema here
const AnswerSchema = new mongoose.Schema({
  question: String,
  userAnswer: String,
  feedback: FeedbackSchema,
  topic: String,
  difficulty: String,
  date: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    score: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: String, default: "Beginner" },
    streak: { type: Number, default: 0 },
    answers: [AnswerSchema],
    performanceStats: {
      dataStructures: { type: Number, default: 0 },
      algorithms: { type: Number, default: 0 },
      systemDesign: { type: Number, default: 0 },
      behavioral: { type: Number, default: 0 },
      conceptual: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ✅ Force recompilation
if (mongoose.connection.models["User"]) {
  delete mongoose.connection.models["User"];
}
module.exports = mongoose.model("User", UserSchema);
