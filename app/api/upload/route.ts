import { put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { ingestDocument } from "@/lib/ingest";
import { writeManifest } from "@/lib/manifest";
import type { DocumentManifest } from "@/lib/types";
import { documentPrefix } from "@/lib/constants";
import { mediaProxyUrl } from "@/lib/blob-media";

export const runtime = "nodejs";

function extFromName(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : "";
}

export async function POST(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return Response.json({ error: "Missing BLOB_READ_WRITE_TOKEN" }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "file requerido" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const documentId = randomUUID();
  const fileName = file.name || "document";
  const mimeType = file.type || "application/octet-stream";
  const ext = extFromName(fileName) || (mimeType.includes("pdf") ? ".pdf" : "");
  const base = documentPrefix(documentId);

  const putOriginal = await put(`${base}/original${ext || ""}`, buf, {
    access: "private",
    contentType: mimeType,
    token,
  });
  const originalUrl = mediaProxyUrl(putOriginal.pathname);

  const createdAt = new Date().toISOString();
  const manifest: DocumentManifest = {
    documentId,
    fileName,
    mimeType,
    status: "processing",
    originalUrl,
    createdAt,
  };
  await writeManifest(manifest, token);

  try {
    await ingestDocument({
      documentId,
      fileName,
      mimeType,
      buffer: buf,
      token,
      originalUrl,
      createdAt,
    });
  } catch (e) {
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Error al indexar",
        documentId,
      },
      { status: 500 }
    );
  }

  return Response.json({ documentId, fileName, status: "ready" });
}
