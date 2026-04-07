import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
// @ts-expect-error - pdf-parse v1 has no type declarations
import pdf from "pdf-parse/lib/pdf-parse.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length < 50) {
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

    // Generate flashcards and MCQs using Claude
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6-20250514",
      max_tokens: 4096,
      system: `You are an expert educational content creator. Your task is to generate study materials from academic text. 
Always respond with ONLY valid JSON, no markdown formatting, no code blocks, no explanation.`,
      messages: [
        {
          role: "user",
          content: `Analyze the following academic text and generate study materials.

Generate exactly:
- 10 flashcards with a "front" (question/term) and "back" (answer/definition)
- 5 multiple choice questions each with exactly 4 options

Return ONLY this JSON structure (no markdown, no code fences):
{
  "flashcards": [
    { "front": "question or term", "back": "answer or definition" }
  ],
  "mcQuestions": [
    {
      "question": "the question text",
      "options": ["option A", "option B", "option C", "option D"],
      "correctIndex": 0,
      "explanation": "brief explanation of why this is correct"
    }
  ]
}

Make the flashcards cover key concepts, definitions, and important facts.
Make the MCQs test understanding, not just recall.
Vary the difficulty from basic to advanced.

TEXT:
${truncatedText}`,
        },
      ],
    });

    // Parse Claude's response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Try to extract JSON from the response (handle potential markdown wrapping)
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Claude response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse AI response. Please try again." },
        { status: 500 }
      );
    }

    // Validate structure
    if (!parsed.flashcards || !parsed.mcQuestions) {
      return NextResponse.json(
        { error: "AI response missing required fields. Please try again." },
        { status: 500 }
      );
    }

    // Add IDs to flashcards and MCQs
    const flashcards = parsed.flashcards.map(
      (card: { front: string; back: string }, index: number) => ({
        id: `fc-${Date.now()}-${index}`,
        front: card.front,
        back: card.back,
        easinessFactor: 2.5,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date().toISOString(),
      })
    );

    const mcQuestions = parsed.mcQuestions.map(
      (
        q: {
          question: string;
          options: string[];
          correctIndex: number;
          explanation: string;
        },
        index: number
      ) => ({
        id: `mcq-${Date.now()}-${index}`,
        question: q.question,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })
    );

    return NextResponse.json({
      flashcards,
      mcQuestions,
      fileName: file.name,
      textPreview: extractedText.substring(0, 200),
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
