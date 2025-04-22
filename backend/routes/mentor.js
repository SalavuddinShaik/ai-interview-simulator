const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const mentorPrompts = {
  "the recruiter":
    "You are The Recruiter — a hiring manager giving clear, concise, and realistic interview feedback.",
  "team lead":
    "You are the Team Lead — a mentor who provides honest, constructive feedback while guiding personal growth.",
  "peer reviewer":
    "You are a Peer Reviewer — a colleague giving insightful, balanced code or career feedback like in a real team.",
  "the guide":
    "You are The Guide — an insightful career coach who provides motivational, big-picture advice with warmth.",
};

router.post("/", async (req, res) => {
  const {
    message,
    mentor = "the recruiter",
    jobDescription = "",
    userContext = "",
  } = req.body;

  const mentorKey = mentor.toLowerCase();
  const persona = mentorPrompts[mentorKey] || mentorPrompts["the recruiter"];

  const basicGreeting = ["hi", "hello", "hey", "how are you"];
  const normalized = message.toLowerCase().trim();

  // 🟢 Instant replies for small talk
  if (basicGreeting.includes(normalized)) {
    return res.json({
      greeting: "Hey! I'm doing great — excited to help you grow your career!",
      insight: "Let’s dive into your goals or prep for an interview.",
      tip: "Ask me about resume tips, career paths, or technical interviews.",
      encouragement: "You're doing awesome — keep pushing forward! 💪",
      persona: mentorKey,
    });
  }

  const prompt = `
${persona}

You are mentoring a user on interviews, careers, and resume skills.

Your response must be strictly in this JSON format:
{
  "greeting": "short and friendly hello",
  "insight": "direct, unique feedback based on the user's question",
  "tip": "practical advice or action step",
  "encouragement": "motivational sentence to uplift them",
  "persona": "${mentorKey}"
}

User Message: "${message}"
Job Description: "${jobDescription || "N/A"}"
User Context: "${userContext || "N/A"}"

Make sure to include specific, thoughtful advice based on the user’s message. Do not repeat generic feedback. Never leave any field blank.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: persona },
        { role: "user", content: prompt },
      ],
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    console.log("🧠 Mentor raw response:", raw);

    let parsed;
    try {
      parsed = JSON.parse(
        raw
          .replace(/```json|```/g, "")
          .replace(/\n/g, "")
          .trim()
      );
    } catch (err) {
      console.error("❌ JSON parse failed:", err.message);
      return res.status(200).json({
        greeting: "Hey!",
        insight:
          "I'm here to help, but I couldn’t quite format the last reply.",
        tip: "Try being specific, like 'How do I prepare for system design?'",
        encouragement: "You’re doing great by asking. Let’s keep going!",
        persona: mentorKey,
      });
    }

    return res.json(parsed);
  } catch (error) {
    console.error("❌ Mentor Error:", error.message);
    return res.status(200).json({
      greeting: "Oops!",
      insight: "Looks like the AI didn’t respond properly.",
      tip: "Try refreshing the page or simplifying your question.",
      encouragement: "Every error is a step closer to learning!",
      persona: mentorKey,
    });
  }
});

module.exports = router;
