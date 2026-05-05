"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ExternalLink, FileQuestion, Loader2, X } from "lucide-react";
import type { DocumentManifest } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

function isTextMime(m: string) {
  return (
    m === "text/plain" ||
    m === "text/markdown" ||
    m === "text/x-markdown"
  );
}

function isImageMime(m: string) {
  return m.startsWith("image/");
}

export function DocumentPreviewOverlay({
  doc,
  open,
  onClose,
}: {
  doc: DocumentManifest | null;
  open: boolean;
  onClose: () => void;
}) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textError, setTextError] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  useEffect(() => {
    if (!open || !doc) {
      setTextContent(null);
      setTextError(null);
      setTextLoading(false);
      return;
    }

    if (!isTextMime(doc.mimeType)) return;

    setTextLoading(true);
    setTextError(null);
    setTextContent(null);
    let cancelled = false;
    void fetch(doc.originalUrl, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar el archivo");
        return r.text();
      })
      .then((t) => {
        if (!cancelled) setTextContent(t);
      })
      .catch((e) => {
        if (!cancelled) {
          setTextError(e instanceof Error ? e.message : "Error al cargar");
        }
      })
      .finally(() => {
        if (!cancelled) setTextLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, doc]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !doc) return null;

  const openTabLabel = "Abrir en pestaña nueva";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-[2px] sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Vista previa: ${doc.fileName}`}
      onClick={onClose}
    >
      <div
        className={cn(
          "flex max-h-[92vh] w-full max-w-5xl flex-col gap-3 rounded-xl border border-border bg-card shadow-2xl",
          "animate-in fade-in-0 zoom-in-95 duration-100"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-mono text-sm font-medium text-foreground">
              {doc.fileName}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">{doc.mimeType}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={doc.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
            >
              <ExternalLink className="size-3.5" />
              {openTabLabel}
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onClose}
              aria-label="Cerrar vista previa"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
          {doc.mimeType === "application/pdf" ? (
            <iframe
              title={doc.fileName}
              src={doc.originalUrl}
              className="h-[min(78vh,720px)] w-full rounded-md border border-border bg-muted"
            />
          ) : isImageMime(doc.mimeType) ? (
            <div className="relative mx-auto h-[min(78vh,720px)] w-full max-w-4xl rounded-md border border-border bg-muted">
              <Image
                src={doc.originalUrl}
                alt={doc.fileName}
                fill
                className="object-contain p-2"
                sizes="(max-width: 896px) 100vw, 896px"
                unoptimized
                priority
              />
            </div>
          ) : isTextMime(doc.mimeType) ? (
            <div className="flex h-[min(78vh,720px)] flex-col rounded-md border border-border bg-muted/40">
              {textLoading ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  Cargando texto…
                </div>
              ) : textError ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-sm text-destructive">
                  {textError}
                  <a
                    href={doc.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    {openTabLabel}
                  </a>
                </div>
              ) : (
                <ScrollArea className="h-[min(78vh,720px)]">
                  <pre className="whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-foreground">
                    {textContent ?? ""}
                  </pre>
                </ScrollArea>
              )}
            </div>
          ) : (
            <div className="flex h-[min(40vh,320px)] flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
              <FileQuestion className="size-10 text-muted-foreground" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Vista previa integrada no disponible para este tipo de archivo.
                Puedes abrirlo en una pestaña nueva.
              </p>
              <a
                href={doc.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "default" }), "gap-2")}
              >
                <ExternalLink className="size-4" />
                {openTabLabel}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
