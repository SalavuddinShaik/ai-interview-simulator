const express = require("express");
const router = express.Router();
const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/", async (req, res) => {
  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res
      .status(400)
      .json({ error: "Missing resume or job description." });
  }

  const prompt = `
Compare the resume to the job description and return a JSON with:
- matchScore (0-100),
- summaryFeedback (short summary of resume alignment),
- improvementTips (what the candidate can improve),
- missingKeywords (list of important job-related keywords missing in resume)

Respond ONLY in JSON format.

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an ATS resume evaluator bot." },
        { role: "user", content: prompt },
      ],
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(
        raw
          .replace(/```json|```/g, "")
          .replace(/\n/g, "")
          .trim()
      );
    } catch (err) {
      console.error("❌ ATS Parse Error:", err.message);
      return res.status(200).json({ error: "Could not parse AI response." });
    }

    return res.json(parsed);
  } catch (error) {
    console.error("❌ ATS Review Error:", error.message);
    return res.status(500).json({ error: "OpenAI API call failed." });
  }
});

module.exports = router;
