const BASE_URL = "/api";

async function postJson(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function generateQuestion(subject) {
  try {
    const data = await postJson("/question", { subject });
    return data.question;
  } catch (error) {
    console.error("Error generating question:", error);
    return "Error: Could not connect to AI to generate a question. Please try again.";
  }
}

export async function validateAnswer(question, answer, subject) {
  try {
    return await postJson("/validate", { question, answer, subject });
  } catch (error) {
    console.error("Error validating answer:", error);
    return {
      isCorrect: false,
      explanation: "Something went wrong evaluating your answer (AI Error). Please try again.",
    };
  }
}
