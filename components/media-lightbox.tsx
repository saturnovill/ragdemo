"use client";

import Image from "next/image";
import { useCallback, useEffect } from "react";
import { X } from "lucide-react";
import type { SourceRef } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function MediaLightbox({
  source,
  open,
  onClose,
  citationTag,
}: {
  source: SourceRef | null;
  open: boolean;
  onClose: () => void;
  citationTag?: string;
}) {
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !source) return null;

  const altLarge = `Ampliada: ${source.fileName}, página ${source.page}`;

  return (
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
            {citationTag && (
              <span className="mr-2 font-mono text-white/90">{citationTag}</span>
            )}
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
  );
}
