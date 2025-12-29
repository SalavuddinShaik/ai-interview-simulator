const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");
const UserProfile = require("../models/UserProfile");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("resume"), async (req, res) => {
  let resumeText = req.body.resumeText;
  const jobDescription = req.body.jobDescription;

  if (!resumeText && req.file) {
    try {
      const parsed = await pdfParse(req.file.buffer);
      resumeText = parsed.text;
    } catch (err) {
      console.error("PDF Parse Error:", err.message);
      return res.status(400).json({ error: "Invalid PDF file." });
    }
  }

  if (!resumeText) {
    return res.status(400).json({ error: "Resume content is missing." });
  }

  const prompt = jobDescription
    ? `
You are a professional resume analyst and interview coach.

Analyze this resume against the job description and return ONLY valid JSON (no markdown, no code blocks):

{
  "company": "detected company name from JD",
  "role": "detected job title",
  "strengths": "what's good in the resume for this role",
  "weaknesses": "what's missing or weak",
  "missingKeywords": ["keyword1", "keyword2", "keyword3"],
  "addedKeywords": ["keyword1", "keyword2"],
  "improvementSuggestions": "specific improvements",
  "tone": "professional/casual/technical assessment",
  "matchScore": 0 to 100,
  "optimizedBullets": [
    "Rewritten achievement 1 with metrics",
    "Rewritten achievement 2 with keywords from JD",
    "Rewritten achievement 3"
  ],
  "interviewStyle": "how this company typically interviews",
  "interviewQuestions": [
    {
      "type": "coding",
      "question": "A specific coding question tailored to the candidate's background and company's interview style. Make it detailed and realistic.",
      "why": "Why this company asks this type of question"
    },
    {
      "type": "system_design",
      "question": "A specific system design question based on the candidate's experience and the role requirements. Make it detailed.",
      "why": "Why this is relevant to the role"
    },
    {
      "type": "behavioral",
      "question": "A specific behavioral question in the company's interview style. Make it detailed.",
      "why": "What competency they're evaluating"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "experience": {
    "years": "estimated years of experience",
    "domain": "primary domain (e.g., E-commerce, Healthcare, Fitness Tech)",
    "recentCompany": "most recent company name"
  }
}

IMPORTANT: 
- You MUST include exactly 3 interview questions (coding, system_design, behavioral)
- Make questions specific to the candidate's background, not generic
- Return ONLY the JSON object, no other text

Resume:
${resumeText}

Job Description:
${jobDescription}
`
    : `
Analyze this resume and return ONLY valid JSON (no markdown):

{
  "strengths": "what's strong in this resume",
  "weaknesses": "areas that need improvement",
  "improvementSuggestions": "specific actionable improvements",
  "tone": "assessment of resume tone",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": {
    "years": "estimated years",
    "domain": "primary domain",
    "recentCompany": "most recent company"
  }
}

Resume:
${resumeText}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume analyst and interview coach. You know how top tech companies conduct interviews. Always return valid JSON only, never include markdown code blocks or any text outside the JSON object.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2500,
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("JSON Parse Error:", parseErr.message);
      console.error("Raw response:", raw);
      return res.status(500).json({ error: "Failed to parse AI response." });
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        await UserProfile.findOneAndUpdate(
          { userId: decoded.userId },
          {
            $set: {
              "skills.languages":
                parsed.skills?.map((s) => ({
                  name: s,
                  proficiency: "intermediate",
                })) || [],
              experience: parsed.experience?.recentCompany
                ? [
                    {
                      company: parsed.experience.recentCompany,
                      domain: parsed.experience.domain,
                      duration: parsed.experience.years,
                    },
                  ]
                : [],
              "goals.targetCompanies": parsed.company ? [parsed.company] : [],
              "goals.targetRoles": parsed.role ? [parsed.role] : [],
              "resumeData.rawText": resumeText,
              "resumeData.uploadedAt": new Date(),
            },
          },
          { upsert: true, new: true }
        );
        console.log("UserProfile updated successfully");
      } catch (err) {
        console.log("Could not update UserProfile:", err.message);
      }
    }

    return res.json(parsed);
  } catch (error) {
    console.error("OpenAI Error:", error.message);
    return res.status(500).json({ error: "OpenAI API failed." });
  }
});

module.exports = router;
