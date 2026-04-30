import { GoogleGenAI } from "@google/genai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

let genai: GoogleGenAI | null = null;

const EMBED_MODEL = "gemini-embedding-2";
const CHAT_MODEL = "gemini-3-flash-preview";
const OUTPUT_DIM = 1536;

export function getGenAI(): GoogleGenAI {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  if (!genai) genai = new GoogleGenAI({ apiKey: key });
  return genai;
}

export function getGoogleProvider() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("Missing GOOGLE_GENERATIVE_AI_API_KEY");
  return createGoogleGenerativeAI({ apiKey });
}

export function getChatModel() {
  return getGoogleProvider()(CHAT_MODEL);
}

export async function embedText(
  text: string,
  task: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<number[]> {
  const ai = getGenAI();
  const trimmed = text.trim().slice(0, 8000) || " ";
  const res = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: trimmed,
    config: {
      outputDimensionality: OUTPUT_DIM,
      taskType: task,
    },
  });
  const values = res.embeddings?.[0]?.values;
  if (!values?.length) throw new Error("Empty embedding from Gemini");
  return values;
}

export async function embedTextAndImage(
  text: string,
  mimeType: string,
  imageBase64: string,
  task: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"
): Promise<number[]> {
  const ai = getGenAI();
  const res = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: {
      role: "user",
      parts: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: text.slice(0, 4000) || " " },
      ],
    },
    config: {
      outputDimensionality: OUTPUT_DIM,
      taskType: task,
    },
  });
  const values = res.embeddings?.[0]?.values;
  if (!values?.length) throw new Error("Empty multimodal embedding from Gemini");
  return values;
}

export async function describeImageForIndex(
  mimeType: string,
  imageBase64: string
): Promise<string> {
  const ai = getGenAI();
  const res = await ai.models.generateContent({
    model: CHAT_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: { mimeType, data: imageBase64 },
          },
          {
            text: "Describe this image briefly in Spanish for search indexing (2-4 sentences). Include any visible text, UI labels, or document structure.",
          },
        ],
      },
    ],
  });
  return (res.text ?? "").trim() || "(imagen sin descripción)";
}
