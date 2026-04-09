import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("Missing Google Gemini API key. Set GOOGLE_GEMINI_API_KEY or VITE_GEMINI_API_KEY in .env.");
}

const MODEL = "gemini-2.0-flash";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: MODEL });

async function callGemini(prompt) {
  const result = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });
  return result.response.text().trim();
}

function extractResponseText(data) {
  const candidate = data?.candidates?.[0];
  if (!candidate) return "";

  const content = candidate.content;
  if (Array.isArray(content)) {
    const textPart = content.find(part => part.type === "output_text" || part.type === "text") || content[0];
    return textPart?.text?.trim() || "";
  }

  return "";
}

function normalizeJson(text) {
  let normalized = text.trim();
  if (normalized.startsWith("```json")) {
    normalized = normalized.slice(7).trim();
  } else if (normalized.startsWith("```")) {
    normalized = normalized.slice(3).trim();
  }
  if (normalized.endsWith("```")) {
    normalized = normalized.slice(0, -3).trim();
  }
  return normalized;
}

app.post("/api/question", async (req, res) => {
  try {
    const subject = req.body.subject || "General";
    const prompt = `You are a teacher evaluating a student. Please ask a single, simple, viva-like question about ${subject}. The question should be able to be answered in a few words. Do not include any introductory text or formatting, just return the exact question string.`;
    const question = await callGemini(prompt);

    if (!question) {
      throw new Error("AI returned an empty response.");
    }

    res.json({ question });
  } catch (error) {
    console.error("/api/question error:", error);
    res.status(500).json({ error: error?.message || "Could not connect to AI to generate a question." });
  }
});

app.post("/api/validate", async (req, res) => {
  try {
    const { question, answer, subject = "General" } = req.body;
    const prompt = `You are an encouraging and fair teacher for a ${subject} class.\n\nThe question you asked the student was: "${question}"\nThe student answered: "${answer}"\n\nEvaluate the student's answer. Is it conceptually accurate and close enough to the real answer? It doesn't have to be perfect, just demonstrate correct understanding. Respond STRICTLY with a simple JSON object in exactly this format without markdown code blocks:\n{\n  "isCorrect": true/false,\n  "explanation": "A short 1-2 sentence explanation of why it is correct or incorrect, being encouraging."\n}`;

    const rawText = normalizeJson(await callGemini(prompt));

    let evaluation = { isCorrect: false, explanation: "Unable to evaluate the answer." };
    try {
      evaluation = JSON.parse(rawText);
    } catch {
      evaluation.explanation = rawText || evaluation.explanation;
    }

    res.json(evaluation);
  } catch (error) {
    console.error("/api/validate error:", error);
    res.status(500).json({ isCorrect: false, explanation: error?.message || "Something went wrong evaluating your answer (AI Error). Please try again." });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AI server listening on http://localhost:${PORT}`);
});
