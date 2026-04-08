import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const { question, sampleAnswer, keyConcepts, userResponse } = await request.json();

    if (!question || !userResponse) {
      return NextResponse.json(
        { error: "Question and userResponse are required" },
        { status: 400 }
      );
    }

    const prompt = `
    You are an encouraging and incredibly intelligent professor. Your goal is to grade a student's answer to a Constructed Response Question.
    
    Question: "${question}"
    Optimal Answer: "${sampleAnswer || 'N/A'}"
    Key Concepts to Include: ${keyConcepts ? keyConcepts.join(", ") : 'N/A'}
    
    Student's Answer: "${userResponse}"
    
    Evaluate their answer based strictly on their understanding of the underlying concepts, not minor grammar mistakes.
    Return your response EXCLUSIVELY as a JSON object matching this schema exactly:
    {
       "score": number, // out of 10
       "feedback": string, // Encouraging constructive feedback (1-3 sentences)
       "missingConcepts": string[] // Which key concepts they missed entirely. Can be empty.
    }
    `;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.2, // low temp for consistent grading
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();
    const parsedData = JSON.parse(textResponse);

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error("Grading failed:", error);
    return NextResponse.json(
      { error: "Failed to grade response. The API might be busy." },
      { status: 500 }
    );
  }
}
