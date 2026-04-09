const BASE_URL = "/api";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI?.getGenerativeModel({ model: "gemini-2.0-flash" });

const fallbackQuestionBank = {
  physics: [
    {
      question: "What force pulls objects toward Earth?",
      acceptedAnswers: ["gravity", "gravitational force"],
      explanation:
        "Gravity is the force that attracts objects toward Earth.",
    },
    {
      question: "What is the unit of force?",
      acceptedAnswers: ["newton", "newtons", "n"],
      explanation: "Force is measured in newtons (N).",
    },
    {
      question: "What do we call a push or a pull?",
      acceptedAnswers: ["force", "a force"],
      explanation: "In physics, a push or a pull is called a force.",
    },
    {
      question: "What kind of energy does a moving object have?",
      acceptedAnswers: ["kinetic energy", "kinetic"],
      explanation: "A moving object has kinetic energy.",
    },
    {
      question: "What is the speed of light usually written as in equations?",
      acceptedAnswers: ["c"],
      explanation: "The speed of light is commonly represented by c.",
    },
  ],
  chemistry: [
    {
      question: "What is H2O commonly called?",
      acceptedAnswers: ["water"],
      explanation: "H2O is the chemical formula for water.",
    },
    {
      question: "What pH value is considered neutral?",
      acceptedAnswers: ["7", "seven"],
      explanation: "A neutral solution has a pH of 7.",
    },
    {
      question: "What particle has a negative charge?",
      acceptedAnswers: ["electron", "electrons"],
      explanation: "Electrons are negatively charged particles.",
    },
    {
      question: "What gas do plants absorb for photosynthesis?",
      acceptedAnswers: ["carbon dioxide", "co2"],
      explanation: "Plants absorb carbon dioxide during photosynthesis.",
    },
    {
      question: "What is the center of an atom called?",
      acceptedAnswers: ["nucleus", "the nucleus"],
      explanation: "The nucleus is at the center of the atom.",
    },
  ],
  mathematics: [
    {
      question: "What is the value of pi rounded to two decimal places?",
      acceptedAnswers: ["3.14", "3.1416"],
      explanation: "Pi rounded to two decimal places is 3.14.",
    },
    {
      question: "What do we call a polygon with three sides?",
      acceptedAnswers: ["triangle", "a triangle"],
      explanation: "A polygon with three sides is a triangle.",
    },
    {
      question: "What is 9 multiplied by 9?",
      acceptedAnswers: ["81", "eighty one", "eighty-one"],
      explanation: "9 multiplied by 9 equals 81.",
    },
    {
      question: "What is the square root of 64?",
      acceptedAnswers: ["8", "eight"],
      explanation: "The square root of 64 is 8.",
    },
    {
      question: "What is the name of an angle greater than 90 degrees but less than 180 degrees?",
      acceptedAnswers: ["obtuse angle", "obtuse"],
      explanation: "That type of angle is called an obtuse angle.",
    },
  ],
};

function normalizeText(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s.]/g, "")
    .replace(/\s+/g, " ");
}

function getSubjectKey(subject) {
  return normalizeText(subject);
}

function getFallbackQuestions(subject) {
  return fallbackQuestionBank[getSubjectKey(subject)] ?? fallbackQuestionBank.physics;
}

function pickFallbackQuestion(subject, excludeQuestion) {
  const questions = getFallbackQuestions(subject);
  const candidates = excludeQuestion
    ? questions.filter(({ question }) => question !== excludeQuestion)
    : questions;

  const pool = candidates.length > 0 ? candidates : questions;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

function findFallbackQuestion(subject, questionText) {
  return getFallbackQuestions(subject).find(
    ({ question }) => normalizeText(question) === normalizeText(questionText),
  );
}

/**
 * Utility to retry AI calls once if they fail due to rate limits or temporary errors.
 */
async function callWithRetry(fn, retries = 1) {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.status === 429 || error.message?.includes("429"))) {
      console.log("Rate limit hit, retrying in 2 seconds...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

function evaluateFallbackAnswer(question, answer, subject) {
  const fallbackQuestion = findFallbackQuestion(subject, question);
  const normalizedAnswer = normalizeText(answer);

  if (!fallbackQuestion) {
    return {
      isCorrect: normalizedAnswer.length > 0,
      explanation:
        normalizedAnswer.length > 0
          ? "Your answer was recorded, but the offline checker could not fully verify it. Try another question once the AI connection is available."
          : "Please enter an answer before submitting.",
    };
  }

  const isCorrect = fallbackQuestion.acceptedAnswers.some((acceptedAnswer) =>
    normalizedAnswer.includes(normalizeText(acceptedAnswer)),
  );

  return {
    isCorrect,
    explanation: isCorrect
      ? `Correct. ${fallbackQuestion.explanation}`
      : `Not quite. ${fallbackQuestion.explanation}`,
  };
}

/**
 * Generates a concept question for the given subject.
 */
export async function generateQuestion(subject) {
  if (!model) {
    return pickFallbackQuestion(subject).question;
  }

  try {
    const prompt = `You are a teacher evaluating a student.
Please ask a single, simple, viva-like question about ${subject}.
The question should be able to be answered in a few words.
Do not include any introductory text or formatting, just return the exact string of the question.`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    const generatedQuestion = result.response.text().trim();

    return generatedQuestion || pickFallbackQuestion(subject).question;
  } catch (error) {
    console.error("Error generating question:", error);
    return pickFallbackQuestion(subject).question;
  }
}

/**
 * Validates the user's answer against the given question.
 * Returns { isCorrect: boolean, explanation: string }.
 */
export async function validateAnswer(question, answer, subject) {
  if (!model) {
    return evaluateFallbackAnswer(question, answer, subject);
  }

  try {
    const prompt = `You are an encouraging and fair teacher for a ${subject} class.

The question you asked the student was: "${question}"
The student answered: "${answer}"

Evaluate the student's answer. Is it conceptually accurate and close enough to the real answer?
It doesn't have to be perfect, just demonstrate correct understanding.

Respond STRICTLY with a simple JSON object in exactly this format without markdown code blocks:
{
  "isCorrect": true,
  "explanation": "A short 1-2 sentence explanation of why it is correct or incorrect, being encouraging."
}`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    let rawText = result.response.text().trim();

    if (rawText.startsWith("```json")) {
      rawText = rawText.substring(7).trim();
      if (rawText.endsWith("```")) {
        rawText = rawText.substring(0, rawText.length - 3).trim();
      }
    } else if (rawText.startsWith("```")) {
      rawText = rawText.substring(3).trim();
      if (rawText.endsWith("```")) {
        rawText = rawText.substring(0, rawText.length - 3).trim();
      }
    }

    const evaluation = JSON.parse(rawText);
    return {
      isCorrect: Boolean(evaluation.isCorrect),
      explanation:
        typeof evaluation.explanation === "string" && evaluation.explanation.trim()
          ? evaluation.explanation.trim()
          : "Your answer was checked successfully.",
    };
  } catch (error) {
    console.error("Error validating answer:", error);
    return evaluateFallbackAnswer(question, answer, subject);
  }
}
