import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import answerFormat from "../../config/answerFormat";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req) {
    try {
        const { questions } = await req.json();

        if (!questions || questions.length === 0) {
            return NextResponse.json({ error: "No questions provided" }, { status: 400 });
        }

        console.log("📩 Received Questions:", questions);

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // ✅ Using Flash 1.5 for optimized performance

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                for (const question of questions) {
                    console.log(`🔹 Sending question to Gemini: ${question}`);

                    try {
                        const result = await model.generateContent({
                            contents: [
                                {
                                    role: "user",
                                    parts: [
                                        { text: `Format the answer in structured markdown with clear headings, bullet points, and proper spacing. Follow these rules:\n\n${answerFormat}\n\nQuestion: ${question}` }
                                    ]
                                }
                            ]
                        });

                        const answer = result.response.text();
                        console.log(`✅ Answer received for "${question}"`);

                        const responseChunk = JSON.stringify({ question, answer }) + "\n";
                        controller.enqueue(encoder.encode(responseChunk));
                    } catch (geminiError) {
                        console.error("❌ Gemini API Error:", geminiError);
                        controller.enqueue(encoder.encode(JSON.stringify({ question, answer: "Failed to generate answer." }) + "\n"));
                    }
                }
                controller.close();
            }
        });

        return new Response(stream, {
            headers: { "Content-Type": "text/event-stream" },
        });
    } catch (error) {
        console.error("❌ General API Error:", error);
        return NextResponse.json({ error: "Failed to generate answers", details: error.message }, { status: 500 });
    }
}
