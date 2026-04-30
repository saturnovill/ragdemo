import Image from "next/image";
import type { SourceRef } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SourceCard({ source }: { source: SourceRef }) {
  return (
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
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Image
            src={source.mediaUrl}
            alt={`Referencia ${source.fileName} p.${source.page}`}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized
          />
        </div>
      </CardContent>
    </Card>
  );
}
