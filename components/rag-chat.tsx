"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useMemo, useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SourceCard } from "@/components/source-card";
import { MediaLightbox } from "@/components/media-lightbox";
import { AssistantTextWithCitations } from "@/components/assistant-text-with-citations";
import { citationNumbersInOrder } from "@/lib/citations";
import type { SourceRef } from "@/lib/types";
import type { UIMessage } from "ai";

type RagMessage = UIMessage<unknown, { sources: { items: SourceRef[] } }>;

export function RagChat() {
  const [retrievalSources, setRetrievalSources] = useState<SourceRef[]>([]);
  const [preview, setPreview] = useState<{
    source: SourceRef;
    citationTag?: string;
  } | null>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<RagMessage>({
        api: "/api/chat",
      }),
    []
  );

  const { messages, sendMessage, status, stop } = useChat<RagMessage>({
    transport,
    onData: (part) => {
      if (part.type === "data-sources") {
        setRetrievalSources(part.data.items);
      }
    },
  });

  const handleCitationClick = useCallback(
    (n: number) => {
      const src = retrievalSources[n - 1];
      if (!src) return;
      setPreview({ source: src, citationTag: `#${n}` });
      requestAnimationFrame(() => {
        document
          .getElementById(`source-citation-${n}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    },
    [retrievalSources]
  );

  const citedSources = useMemo(() => {
    const assistants = messages.filter((m) => m.role === "assistant");
    const last = assistants[assistants.length - 1];
    if (!last) return [];
    const assistantText = last.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
    const nums = citationNumbersInOrder(assistantText);
    return nums
      .map((n) => {
        const source = retrievalSources[n - 1];
        return source ? { n, source } : null;
      })
      .filter((x): x is { n: number; source: SourceRef } => x != null);
  }, [messages, retrievalSources]);

  const [input, setInput] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t || status === "streaming") return;
    setRetrievalSources([]);
    setPreview(null);
    setInput("");
    await sendMessage({ text: t });
  }

  const requestPreview = useCallback(
    (payload: { source: SourceRef; citationTag?: string }) => {
      setPreview({
        source: payload.source,
        citationTag: payload.citationTag,
      });
    },
    []
  );

  return (
    <div className="flex min-h-0 flex-1 gap-0 bg-muted/15">
      <MediaLightbox
        source={preview?.source ?? null}
        open={preview != null}
        onClose={() => setPreview(null)}
        citationTag={preview?.citationTag}
      />

      <section className="flex min-h-0 min-w-0 flex-[1_1_58%] flex-col border-r border-border lg:flex-[1_1_62%] xl:flex-[1_1_68%]">
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card/50 px-4 py-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">Chat</h2>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
          <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border/70 bg-card/40 p-4">
            <div className="space-y-4 pr-3">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Pregunta sobre tus documentos. Las respuestas citan fragmentos
                  con [#n]: puedes pulsar cada referencia para ver la vista
                  previa. En el panel derecho solo se listan las fuentes que la
                  última respuesta haya citado.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[min(100%,52rem)] rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/80 text-foreground ring-1 ring-border/60"
                    }`}
                  >
                    {m.parts.map((part, i) =>
                      part.type === "text" ? (
                        <p
                          key={i}
                          className="whitespace-pre-wrap leading-relaxed [&_button]:text-[length:inherit]"
                        >
                          {m.role === "assistant" ? (
                            <AssistantTextWithCitations
                              text={part.text}
                              onCitationClick={handleCitationClick}
                            />
                          ) : (
                            part.text
                          )}
                        </p>
                      ) : null
                    )}
                  </div>
                </div>
              ))}
              {status === "streaming" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-3 animate-spin" />
                  Generando…
                </div>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="flex shrink-0 flex-col gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              rows={3}
              className="min-h-[5rem] resize-none bg-background"
              disabled={status === "streaming"}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={status === "streaming" || !input.trim()}
              >
                {status === "streaming" ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Enviando
                  </>
                ) : (
                  <>
                    <Send className="mr-2 size-4" />
                    Enviar
                  </>
                )}
              </Button>
              {status === "streaming" && (
                <Button type="button" variant="outline" onClick={() => void stop()}>
                  Detener
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>

      <aside className="flex min-h-0 w-[min(100%,20rem)] shrink-0 flex-col bg-card/30 lg:w-80 xl:w-[22rem]">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2 lg:px-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fuentes
          </h3>
          <span className="text-[10px] text-muted-foreground">
            {citedSources.length}
          </span>
        </div>
        <Separator />
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 p-3 lg:p-4">
            {retrievalSources.length === 0 ? (
              <p className="text-[11px] leading-snug text-muted-foreground">
                Cuando envíes una pregunta, aquí verás las fuentes citadas en la
                respuesta (solo [#n] usados en el texto).
              </p>
            ) : citedSources.length === 0 ? (
              <p className="text-[11px] leading-snug text-muted-foreground">
                Aún no hay citas [#n] en la última respuesta del asistente, o
                están llegando. Las tarjetas aparecen cuando el modelo referencia
                fragmentos con [#1], [#2], etc.
              </p>
            ) : (
              citedSources.map(({ n, source }) => (
                <SourceCard
                  key={`cite-${n}-${source.documentId}-${source.page}`}
                  source={source}
                  citationNumber={n}
                  citationLabel={`#${n}`}
                  onRequestPreview={requestPreview}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}
