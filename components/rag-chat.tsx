"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useMemo, useState } from "react";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
      <Card className="flex min-h-[520px] flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="size-4" />
            Chat RAG
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          <ScrollArea className="min-h-[320px] flex-1 rounded-md border border-border/60 bg-muted/10 p-3">
            <div className="space-y-4 pr-2">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Pregunta sobre tus documentos. Las respuestas incluyen
                  referencias [#n] y el panel derecho muestra la página o imagen
                  de origen.
                </p>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[95%] rounded-lg px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-card-foreground ring-1 ring-border/60"
                    }`}
                  >
                    {m.parts.map((part, i) =>
                      part.type === "text" ? (
                        <p key={i} className="whitespace-pre-wrap">
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
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              rows={3}
              className="resize-none"
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
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Fuentes (imagen + página)</h3>
          <span className="text-xs text-muted-foreground">
            {sources.length} referencias
          </span>
        </div>
        <Separator />
        <ScrollArea className="h-[480px] pr-2">
          <div className="flex flex-col gap-3">
            {sources.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Las capturas de página aparecerán aquí cuando el modelo cite
                fragmentos recuperados.
              </p>
            ) : (
              sources.map((s, i) => <SourceCard key={`${s.documentId}-${s.page}-${i}`} source={s} />)
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
