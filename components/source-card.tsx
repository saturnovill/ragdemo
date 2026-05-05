"use client";

import Image from "next/image";
import { ZoomIn } from "lucide-react";
import type { SourceRef } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SourceCard({
  source,
  citationNumber,
  citationLabel,
  onRequestPreview,
}: {
  source: SourceRef;
  /** Índice [#n] para scroll al hacer clic en la cita del chat */
  citationNumber?: number;
  /** Texto mostrado en la tarjeta, ej. #1 */
  citationLabel?: string;
  onRequestPreview: (payload: {
    source: SourceRef;
    citationTag?: string;
  }) => void;
}) {
  const altThumb = `Referencia ${source.fileName} p.${source.page}`;

  const wrapperProps =
    citationNumber != null
      ? { id: `source-citation-${citationNumber}` as const }
      : {};

  return (
    <div {...wrapperProps}>
      <Card className="overflow-hidden border-border/80 bg-card/80">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex flex-wrap items-center gap-2">
            {citationLabel ? (
              <Badge variant="default" className="font-mono text-[10px]">
                {citationLabel}
              </Badge>
            ) : null}
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
            onClick={() =>
              onRequestPreview({
                source,
                citationTag: citationLabel,
              })
            }
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
    </div>
  );
}
