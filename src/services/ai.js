import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API client using the environment variable
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Use Gemini 2.0 Flash - it usually has a better quota than the preview 2.5
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Utility to retry AI calls once if they fail due to rate limits or temporary errors
 */
async function callWithRetry(fn, retries = 1) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.status === 429 || error.message?.includes("429"))) {
      console.log("Rate limit hit, retrying in 2 seconds...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

/**
 * Generates a concept question for the given subject.
 */
export async function generateQuestion(subject) {
  try {
    const prompt = `You are a teacher evaluating a student.
    Please ask a single, simple, viva-like question about ${subject}.
    The question should be able to be answered in a few words.
    Do not include any introductory text or formatting, just return the exact string of the question.`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating question:", error);
    return "Error: Could not connect to AI to generate a question. Please try again.";
  }
}

/**
 * Validates the user's answer against the given question.
 * Returns { isCorrect: boolean, explanation: string }
 */
export async function validateAnswer(question, answer, subject) {
  try {
    const prompt = `You are an encouraging and fair teacher for a ${subject} class.
    
    The question you asked the student was: "${question}"
    The student answered: "${answer}"
    
    Evaluate the student's answer. Is it conceptually accurate and close enough to the real answer? 
    It doesn't have to be perfect, just demonstrate correct understanding.

    Respond STRICTLY with a simple JSON object in exactly this format without markdown code blocks:
    {
      "isCorrect": true/false,
      "explanation": "A short 1-2 sentence explanation of why it is correct or incorrect, being encouraging."
    }`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    let rawText = result.response.text().trim();

    // Attempt to extract JSON if formatted with markdown
    if (rawText.startsWith("```json")) {
      rawText = rawText.substring(7);
      if (rawText.endsWith("```")) {
        rawText = rawText.substring(0, rawText.length - 3).trim();
      }
    } else if (rawText.startsWith("```")) {
      rawText = rawText.substring(3);
      if (rawText.endsWith("```")) {
        rawText = rawText.substring(0, rawText.length - 3).trim();
      }
    }

    const evaluation = JSON.parse(rawText);
    return evaluation;
  } catch (error) {
    console.error("Error validating answer:", error);
    return {
      isCorrect: false,
      explanation: "Something went wrong evaluating your answer (AI Error). Please try again."
    };
  }
}
