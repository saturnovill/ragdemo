"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentManifest } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DocumentList({
  refreshKey,
  embedded = false,
}: {
  refreshKey: number;
  embedded?: boolean;
}) {
  const [docs, setDocs] = useState<DocumentManifest[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");
      setDocs(data.documents ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al listar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function remove(id: string) {
    try {
      const res = await fetch(`/api/documents?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Error al borrar");
      }
      toast.success("Documento eliminado");
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al borrar");
    }
  }

  const listBody = (
    <>
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : docs.length === 0 ? (
        <p
          className={cn(
            "px-1 text-muted-foreground",
            embedded ? "py-3 text-[11px] leading-snug" : "px-4 pb-4 text-sm"
          )}
        >
          Sin archivos. Usa el área de arriba para indexar documentos.
        </p>
      ) : (
        <ScrollArea
          className={cn(
            embedded ? "min-h-0 flex-1" : "h-[320px] px-4 pb-4"
          )}
        >
          <ul className={cn("space-y-0.5 pr-2", embedded && "py-0.5")}>
            {docs.map((d) => (
              <li
                key={d.documentId}
                className={cn(
                  "group flex items-start gap-1 rounded-sm px-1.5 py-1.5 text-left transition-colors hover:bg-sidebar-accent/80",
                  embedded && "border border-transparent hover:border-sidebar-border"
                )}
              >
                <FileText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate font-mono text-[11px] font-medium leading-tight text-foreground"
                    title={d.fileName}
                  >
                    {d.fileName}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    <Badge
                      variant={
                        d.status === "ready"
                          ? "default"
                          : d.status === "error"
                            ? "destructive"
                            : "secondary"
                      }
                      className="h-4 px-1 text-[9px] leading-none"
                    >
                      {d.status}
                    </Badge>
                    {d.pageCount != null && (
                      <Badge variant="outline" className="h-4 px-1 text-[9px] leading-none">
                        {d.pageCount} pág.
                      </Badge>
                    )}
                  </div>
                  {d.error && (
                    <p className="mt-0.5 text-[10px] leading-tight text-destructive">
                      {d.error}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => remove(d.documentId)}
                  aria-label="Eliminar documento"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-sidebar-border bg-sidebar-accent/20">
        {listBody}
      </div>
    );
  }

  return (
    <Card className="flex max-h-[420px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Biblioteca</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">{listBody}</CardContent>
    </Card>
  );
}
