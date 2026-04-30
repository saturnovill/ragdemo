import { put } from "@vercel/blob";
import sharp from "sharp";
import { chunkText } from "@/lib/chunk";
import {
  describeImageForIndex,
  embedText,
  embedTextAndImage,
} from "@/lib/gemini";
import { getIndex } from "@/lib/pinecone";
import { extractPdfTextByPage, renderPdfPagesToPng } from "@/lib/pdf";
import { writeManifest } from "@/lib/manifest";
import type { DocumentManifest } from "@/lib/types";
import { documentPrefix } from "@/lib/constants";
import { mediaProxyUrl } from "@/lib/blob-media";
import { runPool } from "@/lib/pool";

const SNIPPET_MAX = 3500;

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function uploadBytes(
  pathname: string,
  body: Buffer,
  contentType: string,
  token: string
) {
  const res = await put(pathname, body, {
    access: "private",
    contentType,
    token,
    allowOverwrite: true,
  });
  return mediaProxyUrl(res.pathname);
}

async function placeholderPng(label: string): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect width="100%" height="100%" fill="#1a1a1a"/>
  <text x="40" y="80" fill="#fafafa" font-family="system-ui,sans-serif" font-size="22">${escapeXml(label)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function textPreviewPng(title: string, excerpt: string): Promise<Buffer> {
  const lines = excerpt.slice(0, 2000).split(/\r?\n/);
  const titleEl = escapeXml(title.slice(0, 120));
  const tspans = lines
    .slice(0, 28)
    .map((line, i) => {
      const y = 100 + i * 22;
      return `<tspan x="40" y="${y}">${escapeXml(line.slice(0, 120))}</tspan>`;
    })
    .join("\n");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
  <rect width="100%" height="100%" fill="#111"/>
  <text x="40" y="56" fill="#fafafa" font-family="system-ui,sans-serif" font-size="20">${titleEl}</text>
  <text fill="#cccccc" font-family="system-ui,sans-serif" font-size="14">${tspans}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

function vectorId(
  documentId: string,
  page: number,
  chunkIndex: number
): string {
  const safe = documentId.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${safe}--p${page}--c${chunkIndex}`;
}

async function upsertBatch(
  rows: {
    id: string;
    values: number[];
    metadata: Record<string, string | number>;
  }[]
) {
  const index = await getIndex();
  const size = 64;
  for (let i = 0; i < rows.length; i += size) {
    const slice = rows.slice(i, i + size).map((r) => ({
      id: r.id,
      values: r.values,
      metadata: r.metadata,
    }));
    await index.upsert({ records: slice });
  }
}

export async function ingestDocument(input: {
  documentId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  token: string;
  originalUrl: string;
  createdAt: string;
}): Promise<void> {
  const { documentId, fileName, mimeType, buffer, token, originalUrl, createdAt } =
    input;
  const base = documentPrefix(documentId);

  const manifest: DocumentManifest = {
    documentId,
    fileName,
    mimeType,
    status: "processing",
    originalUrl,
    createdAt,
  };

  try {
    if (mimeType === "application/pdf") {
      const [texts, pngPages] = await Promise.all([
        extractPdfTextByPage(buffer),
        renderPdfPagesToPng(buffer),
      ]);
      const pngByPage = new Map(
        pngPages.map((p) => [p.pageNumber, p.content])
      );

      const pageNums = texts.map((_, i) => i + 1);
      const uploadConcurrency = Math.min(6, Math.max(2, pageNums.length));
      const uploaded = await runPool(pageNums, uploadConcurrency, async (pageNum) => {
        let pagePng = pngByPage.get(pageNum);
        if (!pagePng) {
          pagePng = await placeholderPng(`Página ${pageNum}`);
        }
        const mediaUrl = await uploadBytes(
          `${base}/page-${pageNum}.png`,
          pagePng,
          "image/png",
          token
        );
        return { pageNum, mediaUrl };
      });
      const mediaByPage = new Map(uploaded.map((u) => [u.pageNum, u.mediaUrl]));

      type EmbedJob = {
        pageNum: number;
        ci: number;
        snippet: string;
        mediaUrl: string;
      };
      const embedJobs: EmbedJob[] = [];
      for (let pi = 0; pi < texts.length; pi++) {
        const pageNum = pi + 1;
        const mediaUrl = mediaByPage.get(pageNum);
        if (!mediaUrl) continue;
        const pageText = texts[pi] ?? "";
        const chunks = chunkText(pageText);
        const toEmbed =
          chunks.length > 0
            ? chunks
            : ["(sin texto en esta página; usa la imagen de referencia)"];
        for (let ci = 0; ci < toEmbed.length; ci++) {
          embedJobs.push({
            pageNum,
            ci,
            snippet: toEmbed[ci].slice(0, SNIPPET_MAX),
            mediaUrl,
          });
        }
      }

      const embedConcurrency = 8;
      const rows = await runPool(embedJobs, embedConcurrency, async (job) => {
        const values = await embedText(job.snippet, "RETRIEVAL_DOCUMENT");
        return {
          id: vectorId(documentId, job.pageNum, job.ci),
          values,
          metadata: {
            documentId,
            fileName,
            page: job.pageNum,
            chunkIndex: job.ci,
            snippet: job.snippet,
            mediaUrl: job.mediaUrl,
            kind: "pdf",
          },
        };
      });

      manifest.pageCount = texts.length;
      manifest.status = "ready";
      await upsertBatch(rows);
      await writeManifest(manifest, token);
    } else if (mimeType.startsWith("image/")) {
      const b64 = buffer.toString("base64");
      const caption = await describeImageForIndex(mimeType, b64);
      const mediaUrl = originalUrl;
      const snippet = caption.slice(0, SNIPPET_MAX);
      const values = await embedTextAndImage(
        snippet,
        mimeType,
        b64,
        "RETRIEVAL_DOCUMENT"
      );
      await upsertBatch([
        {
          id: vectorId(documentId, 1, 0),
          values,
          metadata: {
            documentId,
            fileName,
            page: 1,
            chunkIndex: 0,
            snippet,
            mediaUrl,
            kind: "image",
          },
        },
      ]);
      manifest.pageCount = 1;
      manifest.status = "ready";
      await writeManifest(manifest, token);
    } else if (
      mimeType === "text/plain" ||
      mimeType === "text/markdown" ||
      mimeType === "text/x-markdown"
    ) {
      const full = buffer.toString("utf8");
      const chunks = chunkText(full);
      const thumb = await textPreviewPng(fileName, full.slice(0, 1500));
      const mediaUrl = await uploadBytes(
        `${base}/preview.png`,
        thumb,
        "image/png",
        token
      );
      const toEmbed =
        chunks.length > 0 ? chunks : [full.slice(0, SNIPPET_MAX) || "(vacío)"];
      const rows = await runPool(
        toEmbed.map((_, ci) => ci),
        8,
        async (ci) => {
          const snippet = toEmbed[ci].slice(0, SNIPPET_MAX);
          const values = await embedText(snippet, "RETRIEVAL_DOCUMENT");
          return {
            id: vectorId(documentId, 1, ci),
            values,
            metadata: {
              documentId,
              fileName,
              page: 1,
              chunkIndex: ci,
              snippet,
              mediaUrl,
              kind: "text",
            },
          };
        }
      );
      await upsertBatch(rows);
      manifest.pageCount = 1;
      manifest.status = "ready";
      await writeManifest(manifest, token);
    } else {
      throw new Error(`Tipo no soportado: ${mimeType}`);
    }
  } catch (e) {
    manifest.status = "error";
    manifest.error = e instanceof Error ? e.message : String(e);
    await writeManifest(manifest, token);
    throw e;
  }
}
