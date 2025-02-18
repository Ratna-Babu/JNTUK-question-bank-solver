import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Convert file to Base64 (required for Gemini API)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64String = buffer.toString("base64");

        // Process PDF with Gemini API
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        const prompt = "Extract the subject name and all questions with their marks from this question bank PDF. Ignore section headings like 'UNIT 1'. Format the response as:\n\nSubject: <subject name>\nQuestions:\n1. <question 1> - <marks>\n2. <question 2> - <marks>\n...";
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ inlineData: { mimeType: "application/pdf", data: base64String } }, { text: prompt }] }]
        });

        let extractedText = result.response.text();
        let subjectMatch = extractedText.match(/Subject:\s*(.+)/);
        let subject = subjectMatch ? subjectMatch[1].trim() : "Unknown Subject";

        let extractedQuestions = extractedText
            .split("\n")
            .filter(line => line.match(/^\d+\./)) 
            .map(q => q.trim());

        return NextResponse.json({
            success: true,
            subject,
            questions: extractedQuestions
        });
    } catch (error) {
        console.error("❌ Error extracting questions:", error);
        return NextResponse.json({ error: "Failed to extract questions from PDF" }, { status: 500 });
    }
}
