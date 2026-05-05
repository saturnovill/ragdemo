import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  generateId,
  type UIMessage,
} from "ai";
import { embedText, getChatModel } from "@/lib/gemini";
import { getIndex } from "@/lib/pinecone";
import type { SourceRef } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role !== "user") continue;
    const text = m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    const t = text.trim();
    if (t) return t;
  }
  return "";
}

export async function POST(req: Request) {
  const body = (await req.json()) as { messages?: UIMessage[] };
  const messages = body.messages;
  if (!messages?.length) {
    return new Response(JSON.stringify({ error: "messages requeridos" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const query = lastUserText(messages);
  if (!query) {
    return new Response(JSON.stringify({ error: "mensaje vacío" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const queryVec = await embedText(query, "RETRIEVAL_QUERY");
  const index = await getIndex();
  const res = await index.query({
    vector: queryVec,
    topK: 12,
    includeMetadata: true,
  });

  const dedup = new Map<
    string,
    SourceRef & { score: number }
  >();

  for (const m of res.matches ?? []) {
    const meta = m.metadata as Record<string, unknown> | undefined;
    if (!meta?.documentId || meta.mediaUrl == null) continue;
    const docId = String(meta.documentId);
    const page = Number(meta.page ?? 1);
    const key = `${docId}::${page}`;
    const score = m.score ?? 0;
    const prev = dedup.get(key);
    if (prev && prev.score >= score) continue;
    dedup.set(key, {
      documentId: docId,
      fileName: String(meta.fileName ?? "documento"),
      page,
      snippet: String(meta.snippet ?? "").slice(0, 2000),
      mediaUrl: String(meta.mediaUrl),
      score,
    });
  }

  const ranked = [...dedup.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
  const sources: SourceRef[] = ranked.map(({ score: _s, ...rest }) => rest);

  const blocks = sources.map(
    (s, i) =>
      `[#${i + 1}] (${s.fileName}, página ${s.page}):\n${s.snippet}`
  );

  const system = sources.length
    ? `Responde en español. Usa únicamente el contexto siguiente. Tras cada idea sustentada, añade la referencia [#n] del bloque correspondiente. Si el contexto no alcanza, dilo con claridad.\n\n---\n${blocks.join("\n\n---\n")}`
    : `No hay fragmentos recuperados de la base de conocimiento. Indica que no tienes información en los documentos y sugiere subir o indexar más archivos.`;

  const modelMessages = await convertToModelMessages(messages);

  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: async ({ writer }) => {
        writer.write({
          type: "data-sources",
          id: generateId(),
          data: { items: sources },
        });
        const result = streamText({
          model: getChatModel(),
          system,
          messages: modelMessages,
        });
        const ui = result.toUIMessageStream();
        for await (const part of ui) {
          writer.write(part);
        }
        await result.text;
      },
    }),
  });
}
