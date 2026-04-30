"use client";

import { useState } from "react";
import { FolderOpen } from "lucide-react";
import { Uploader } from "@/components/uploader";
import { DocumentList } from "@/components/document-list";
import { RagChat } from "@/components/rag-chat";
import { Separator } from "@/components/ui/separator";

export function RagDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2.5">
        <FolderOpen className="size-4 text-muted-foreground" />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold tracking-tight">
            RAG Demo
          </h1>
          <p className="truncate text-[11px] text-muted-foreground">
            Pinecone · Gemini Embedding 2 · gemini-3-flash-preview
          </p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar sm:w-64">
          <div className="shrink-0 border-b border-sidebar-border px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Conocimiento
            </p>
            <Uploader
              embedded
              onUploaded={() => setRefreshKey((k) => k + 1)}
            />
          </div>
          <Separator />
          <div className="flex min-h-0 flex-1 flex-col px-2 pb-2 pt-2">
            <p className="mb-1.5 shrink-0 px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Archivos indexados
            </p>
            <DocumentList embedded refreshKey={refreshKey} />
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <RagChat />
        </main>
      </div>
    </div>
  );
}
