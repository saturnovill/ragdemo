"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SourceCard } from "@/components/source-card";
import type { SourceRef } from "@/lib/types";
import type { UIMessage } from "ai";

type RagMessage = UIMessage<unknown, { sources: { items: SourceRef[] } }>;

export function RagChat() {
  const [sources, setSources] = useState<SourceRef[]>([]);

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
        setSources(part.data.items);
      }
    },
  });

  const [input, setInput] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = input.trim();
    if (!t || status === "streaming") return;
    setSources([]);
    setInput("");
    await sendMessage({ text: t });
  }

  return (
    <div className="flex min-h-0 flex-1 gap-0 bg-muted/15">
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
                  Pregunta sobre tus documentos. Las respuestas incluyen
                  referencias [#n]; las fuentes con captura aparecen en el panel
                  derecho.
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
                        <p key={i} className="whitespace-pre-wrap leading-relaxed">
                          {part.text}
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
            {sources.length}
          </span>
        </div>
        <Separator />
        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-3 p-3 lg:p-4">
            {sources.length === 0 ? (
              <p className="text-[11px] leading-snug text-muted-foreground">
                Aquí verás la página o imagen citada cuando el modelo recupere
                fragmentos de tus archivos.
              </p>
            ) : (
              sources.map((s, i) => (
                <SourceCard key={`${s.documentId}-${s.page}-${i}`} source={s} />
              ))
            )}
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}
