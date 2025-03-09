import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { topic, difficulty } = await req.json();

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are an AI interviewer generating technical interview questions." },
                    { role: "user", content: `Generate a ${difficulty} level question on ${topic} for a coding interview.` }
                ],
                max_tokens: 700,
            }),
        });

        const data = await response.json();
        return NextResponse.json({ question: data.choices[0].message.content });
    } catch (error) {
        console.error("🚨 API Server Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
