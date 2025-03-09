import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { answer } = await req.json();

        if (!answer.trim()) {
            return NextResponse.json({ error: "No code provided to improve." }, { status: 400 });
        }

        console.log("🔄 Improving Code...");

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",  
                messages: [
                    { role: "system", content: "You are an AI that optimizes and improves given code." },
                    { role: "user", content: `Improve this code:\n\n${answer}\n\nProvide a more optimized and structured version with explanations.` }
                ],
                max_tokens: 500,
            }),
        });

        const data = await response.json();

        if (!data.choices || !data.choices.length) {
            return NextResponse.json({ improvement: "⚠️ No improvement suggestions received. Try again." });
        }

        return NextResponse.json({ improvement: data.choices[0].message.content });

    } catch (error) {
        console.error("🚨 API Error:", error);
        return NextResponse.json({ error: "Failed to improve the code" }, { status: 500 });
    }
}
