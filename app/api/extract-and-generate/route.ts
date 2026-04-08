import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const extractedText = formData.get("extractedText") as string | null;
    const fileName = formData.get("fileName") as string | null;
    const numFlashcards = parseInt((formData.get("numFlashcards") as string) || "10", 10);
    const numMCQs = parseInt((formData.get("numMCQs") as string) || "5", 10);
    const numCRQs = parseInt((formData.get("numCRQs") as string) || "0", 10);

    if (!extractedText || !fileName) {
      return NextResponse.json(
        { error: "No extracted text or filename provided" },
        { status: 400 }
      );
    }

    if (numFlashcards === 0 && numMCQs === 0 && numCRQs === 0) {
      return NextResponse.json(
        { error: "Please request at least one study material type (Flashcards, MCQs, or CRQs)." },
        { status: 400 }
      );
    }

    if (extractedText.trim().length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from the PDF. The file might be image-based or too short.",
        },
        { status: 400 }
      );
    }

    // Truncate text to fit within context window (roughly 150k chars is safe)
    const truncatedText = extractedText.substring(0, 150000);

    // Generate flashcards and MCQs using Gemini
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    let generationReqs = "";
    let jsonStructure = "{\n";
    if (numFlashcards > 0) {
      generationReqs += `- ${numFlashcards} flashcards with a "front" (question/term) and "back" (answer/definition)\n`;
      jsonStructure += `  "flashcards": [\n    { "front": "question or term", "back": "answer or definition" }\n  ],\n`;
    }
    if (numMCQs > 0) {
      generationReqs += `- ${numMCQs} multiple choice questions each with exactly 4 options\n`;
      jsonStructure += `  "mcQuestions": [\n    {\n      "question": "the question text",\n      "options": ["option A", "option B", "option C", "option D"],\n      "correctIndex": 0,\n      "explanation": "brief explanation of why this is correct"\n    }\n  ],\n`;
    }
    if (numCRQs > 0) {
      generationReqs += `- ${numCRQs} constructed response (free response) questions that require critical thinking. Provide a sample optimal answer and a list of key concepts the answer must include.\n`;
      jsonStructure += `  "crQuestions": [\n    { "question": "the question", "sampleAnswer": "detailed optimal answer", "keyConcepts": ["concept 1", "concept 2"] }\n  ]\n`;
    }
    
    jsonStructure = jsonStructure.replace(/,\n$/, "\n") + "}";

    const prompt = `You are an expert educational content creator. Your task is to generate study materials from academic text. 
Always respond with ONLY valid JSON. Keep it robust and accurate.

Analyze the following academic text and generate study materials.

Generate exactly:
${generationReqs}

Return ONLY this JSON structure without any additional markdown formatting:
${jsonStructure}

Make the flashcards cover key concepts, definitions, and important facts.
Make the MCQs and CRQs test understanding, not just recall.
Vary the difficulty from basic to advanced.

TEXT:
${truncatedText}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Try to extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate structure conditionally
    const returnData: any = {};
    
    if (numFlashcards > 0) {
      if (!parsed.flashcards) {
        return NextResponse.json({ error: "AI response missing flashcards" }, { status: 500 });
      }
      returnData.flashcards = parsed.flashcards.map((c: any, i: number) => ({
        id: `fc-${Date.now()}-${i}`,
        front: c.front,
        back: c.back,
        easinessFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
      }));
    } else { returnData.flashcards = []; }

    if (numMCQs > 0) {
      if (!parsed.mcQuestions) {
        return NextResponse.json({ error: "AI response missing mcQuestions" }, { status: 500 });
      }
      returnData.mcQuestions = parsed.mcQuestions.map((q: any, i: number) => ({
        id: `mcq-${Date.now()}-${i}`,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      }));
    } else { returnData.mcQuestions = []; }

    if (numCRQs > 0) {
      if (!parsed.crQuestions) {
        return NextResponse.json({ error: "AI response missing crQuestions" }, { status: 500 });
      }
      returnData.crQuestions = parsed.crQuestions.map((q: any, i: number) => ({
        id: `crq-${Date.now()}-${i}`,
        question: q.question,
        sampleAnswer: q.sampleAnswer,
        keyConcepts: q.keyConcepts,
      }));
    }

    return NextResponse.json({
      flashcards: returnData.flashcards,
      mcQuestions: returnData.mcQuestions,
      crQuestions: returnData.crQuestions,
      fileName: fileName,
      textPreview: extractedText.substring(0, 200),
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
