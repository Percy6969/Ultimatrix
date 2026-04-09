const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

function assertApiKey() {
  if (!OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key. Add VITE_OPENAI_API_KEY to .env");
  }
}

async function openaiRequest(body) {
  console.log("OpenAI key loaded?", Boolean(OPENAI_API_KEY));
  assertApiKey();

  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error?.message || `${response.status} ${response.statusText} ${text}`;
    console.error("OpenAI request failed:", response.status, message, data);
    throw new Error(message);
  }

  return data;
}

export async function generateQuestion(subjectLabel) {
  const data = await openaiRequest({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a quiz generator." },
      {
        role: "user",
        content: `Generate one clear ${subjectLabel} question suitable for a student.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 120,
  });

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function checkAnswer(question, answer) {
  const data = await openaiRequest({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "You are an answer checker. Reply with Correct or Incorrect and a short explanation.",
      },
      {
        role: "user",
        content: `Question: ${question}\nAnswer: ${answer}\nIs this correct?`,
      },
    ],
    temperature: 0.7,
    max_tokens: 120,
  });

  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

catch (err) {
  console.error("AI load error:", err);
  setQuestion(`Error: ${err?.message || err}`);
}
