"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ZoomIn, X } from "lucide-react";
import type { SourceRef } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SourceCard({ source }: { source: SourceRef }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const close = useCallback(() => setLightboxOpen(false), []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, close]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lightboxOpen]);

  const altThumb = `Referencia ${source.fileName} p.${source.page}`;
  const altLarge = `Ampliada: ${source.fileName}, página ${source.page}`;

  return (
    <>
      <Card className="overflow-hidden border-border/80 bg-card/80">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-sm font-medium leading-tight">
              {source.fileName}
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              Pág. {source.page}
            </Badge>
          </div>
          <CardDescription className="line-clamp-4 text-xs">
            {source.snippet}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <button
            type="button"
            className={cn(
              "group relative aspect-[4/3] w-full cursor-zoom-in bg-muted outline-none",
              "ring-offset-background transition-opacity hover:opacity-[0.97]",
              "focus-visible:ring-2 focus-visible:ring-ring"
            )}
            onClick={() => setLightboxOpen(true)}
            aria-label={`Ampliar imagen: ${source.fileName}, página ${source.page}`}
          >
            <Image
              src={source.mediaUrl}
              alt={altThumb}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
              unoptimized
            />
            <span
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30 group-focus-visible:bg-black/25"
              aria-hidden
            >
              <ZoomIn className="size-9 text-white opacity-0 drop-shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </span>
          </button>
        </CardContent>
      </Card>

      {lightboxOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={`Vista ampliada: ${source.fileName}`}
          onClick={close}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-6xl flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 text-white">
              <p className="min-w-0 truncate text-sm font-medium">
                {source.fileName}{" "}
                <span className="text-white/70">· pág. {source.page}</span>
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="shrink-0 gap-1 bg-white/15 text-white hover:bg-white/25"
                onClick={close}
                aria-label="Cerrar vista ampliada"
              >
                <X className="size-4" />
                Cerrar
              </Button>
            </div>
            <div className="relative h-[min(85vh,880px)] w-full rounded-lg border border-white/10 bg-black/40 shadow-2xl">
              <Image
                src={source.mediaUrl}
                alt={altLarge}
                fill
                className="object-contain p-2"
                sizes="100vw"
                unoptimized
                priority
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
