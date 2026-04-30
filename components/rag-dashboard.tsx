"use client";

import { useState } from "react";
import { Uploader } from "@/components/uploader";
import { DocumentList } from "@/components/document-list";
import { RagChat } from "@/components/rag-chat";

export function RagDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          RAG Demo
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Sube PDFs o imágenes a Vercel Blob, embeddings con{" "}
          <code className="rounded bg-muted px-1">gemini-embedding-2</code> en
          Pinecone, y chatea con{" "}
          <code className="rounded bg-muted px-1">gemini-3-flash-preview</code>.
          Cada
          respuesta puede mostrar la captura de la página citada.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Uploader
          onUploaded={() => setRefreshKey((k) => k + 1)}
        />
        <DocumentList refreshKey={refreshKey} />
      </div>

      <RagChat />
    </div>
  );
}
