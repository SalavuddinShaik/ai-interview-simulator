import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { answer, question } = await req.json();

    if (!answer || !question) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const prompt = `
        Analyze the following spoken answer for a behavioral interview. Provide feedback on:
        - **Clarity**: Is the response clear and structured?
        - **Confidence**: Does it sound confident and well-prepared?
        - **Structure**: Is the answer structured logically?

        Return JSON format like this:
        {
          "clarity": "Your clarity feedback...",
          "confidence": "Your confidence feedback...",
          "structure": "Your structure feedback..."
        }

        Question: ${question}
        Answer: ${answer}
        `;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "system", content: prompt }],
        max_tokens: 300,
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return NextResponse.json(
        { error: "Invalid AI response" },
        { status: 500 }
      );
    }

    const feedback = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("🚨 API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
