const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("resume"), async (req, res) => {
  let resumeText = req.body.resumeText;
  const jobDescription = req.body.jobDescription;

  // If PDF file uploaded, parse it
  if (!resumeText && req.file) {
    try {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = parsed.text;
    } catch (err) {
      console.error("❌ PDF Parse Error:", err.message);
      return res.status(400).json({ error: "Invalid PDF file." });
    }
  }

  if (!resumeText) {
    return res.status(400).json({ error: "Resume content is missing." });
  }

  const prompt = jobDescription
    ? `
Compare the resume to the job description and return JSON with:
{
  "strengths": "...",
  "weaknesses": "...",
  "improvementSuggestions": "...",
  "tone": "...",
  "matchScore": 0 to 100
}
Resume: ${resumeText}
Job Description: ${jobDescription}
`
    : `
Analyze this resume and return JSON with:
{
  "strengths": "...",
  "weaknesses": "...",
  "improvementSuggestions": "...",
  "tone": "..."
}
Resume: ${resumeText}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a resume analysis expert." },
        { role: "user", content: prompt },
      ],
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return res.json(parsed);
  } catch (error) {
    console.error("❌ OpenAI Error:", error.message);
    return res.status(500).json({ error: "OpenAI API failed." });
  }
});

module.exports = router;
