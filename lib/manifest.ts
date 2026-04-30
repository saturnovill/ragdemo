import { put, list, get } from "@vercel/blob";
import type { DocumentManifest } from "@/lib/types";
import { documentPrefix } from "@/lib/constants";

export function manifestPath(documentId: string) {
  return `${documentPrefix(documentId)}/manifest.json`;
}

export async function writeManifest(manifest: DocumentManifest, token: string) {
  const body = JSON.stringify(manifest, null, 2);
  await put(manifestPath(manifest.documentId), body, {
    access: "private",
    contentType: "application/json",
    token,
    allowOverwrite: true,
  });
}

export async function readManifest(
  documentId: string,
  token: string
): Promise<DocumentManifest | null> {
  try {
    const { blobs } = await list({
      prefix: `${documentPrefix(documentId)}/`,
      token,
    });
    const m = blobs.find((b) => b.pathname.endsWith("manifest.json"));
    if (!m?.pathname) return null;
    const res = await get(m.pathname, { access: "private", token });
    if (!res || res.statusCode !== 200 || !res.stream) return null;
    const text = await new Response(res.stream).text();
    return JSON.parse(text) as DocumentManifest;
  } catch {
    return null;
  }
}
