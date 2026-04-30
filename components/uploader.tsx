"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function Uploader({
  onUploaded,
  embedded = false,
}: {
  onUploaded: () => void;
  embedded?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setBusy(true);
      const loadingMsg =
        file.type === "application/pdf"
          ? "Indexando PDF (varias páginas pueden tardar un poco)…"
          : "Subiendo e indexando…";
      const toastId = toast.loading(loadingMsg);
      try {
        const fd = new FormData();
        fd.set("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.error ?? "Error al subir");
        }
        toast.success("Documento indexado", {
          id: toastId,
          description: data.fileName ?? file.name,
        });
        onUploaded();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al subir", {
          id: toastId,
        });
      } finally {
        setBusy(false);
      }
    },
    [onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled: busy,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/webp": [".webp"],
    },
  });

  const zone = (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border/90 bg-muted/25 text-center transition-colors hover:bg-muted/45",
        embedded ? "mt-2 px-2 py-5" : "min-h-[120px] px-4 py-8",
        isDragActive && "border-primary bg-muted/55"
      )}
    >
      <input {...getInputProps()} />
      {busy ? (
        <Loader2
          className={cn(
            "animate-spin text-muted-foreground",
            embedded ? "size-6" : "mb-2 size-8"
          )}
        />
      ) : (
        <Upload
          className={cn(
            "text-muted-foreground",
            embedded ? "mb-1 size-5" : "mb-2 size-8"
          )}
        />
      )}
      <p
        className={cn(
          "font-medium text-foreground",
          embedded ? "text-[11px] leading-tight" : "text-sm"
        )}
      >
        {embedded ? "Soltar o elegir archivo" : "Arrastra PDF, imagen, TXT o MD"}
      </p>
      {!embedded && (
        <p className="mt-1 text-xs text-muted-foreground">
          Indexación Pinecone + captura de página
        </p>
      )}
      <Button
        type="button"
        variant="secondary"
        className={cn("mt-3", embedded && "h-7 text-[11px]")}
        size={embedded ? "sm" : "default"}
      >
        Explorar…
      </Button>
    </div>
  );

  if (embedded) {
    return zone;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="size-4" />
          Subir conocimiento
        </CardTitle>
      </CardHeader>
      <CardContent>{zone}</CardContent>
    </Card>
  );
}
