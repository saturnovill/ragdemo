"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Uploader({ onUploaded }: { onUploaded: () => void }) {
  const [busy, setBusy] = useState(false);

  const onDrop = useCallback(
    async (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setBusy(true);
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
          description: data.fileName ?? file.name,
        });
        onUploaded();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al subir");
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="size-4" />
          Subir conocimiento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm transition-colors hover:bg-muted/50 ${
            isDragActive ? "border-primary bg-muted/60" : ""
          }`}
        >
          <input {...getInputProps()} />
          {busy ? (
            <Loader2 className="mb-2 size-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="mb-2 size-8 text-muted-foreground" />
          )}
          <p className="font-medium text-foreground">
            Arrastra PDF, imagen, TXT o MD
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Se indexa en Pinecone con Gemini Embedding 2 y captura de página
          </p>
          <Button type="button" variant="secondary" className="mt-4" size="sm">
            Elegir archivo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
