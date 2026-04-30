"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DocumentManifest } from "@/lib/types";

export function DocumentList({ refreshKey }: { refreshKey: number }) {
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

  return (
    <Card className="flex max-h-[420px] flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Biblioteca</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : docs.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">
            Aún no hay documentos. Sube un PDF o una imagen para empezar.
          </p>
        ) : (
          <ScrollArea className="h-[320px] px-4 pb-4">
            <ul className="space-y-2">
              {docs.map((d) => (
                <li
                  key={d.documentId}
                  className="flex items-start justify-between gap-2 rounded-md border border-border/60 bg-muted/20 p-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate text-sm font-medium">
                        {d.fileName}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge
                        variant={
                          d.status === "ready"
                            ? "default"
                            : d.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {d.status}
                      </Badge>
                      {d.pageCount != null && (
                        <Badge variant="outline" className="text-[10px]">
                          {d.pageCount} pág.
                        </Badge>
                      )}
                    </div>
                    {d.error && (
                      <p className="mt-1 text-xs text-destructive">{d.error}</p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => remove(d.documentId)}
                    aria-label="Eliminar documento"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
