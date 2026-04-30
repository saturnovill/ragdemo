import path from "node:path";
import { pdfToPng } from "pdf-to-png-converter";

export async function extractPdfTextByPage(buffer: Buffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const { getDocument, GlobalWorkerOptions } = pdfjs;

  GlobalWorkerOptions.workerSrc = path.join(
    process.cwd(),
    "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"
  );

  const data = new Uint8Array(buffer);
  const loadingTask = getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: false,
  });
  const pdf = await loadingTask.promise;
  const pageNums = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  const texts = await Promise.all(
    pageNums.map(async (p) => {
      const page = await pdf.getPage(p);
      const tc = await page.getTextContent();
      const text = tc.items
        .map((item) =>
          "str" in item && typeof item.str === "string" ? item.str : ""
        )
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      return text || "(página sin texto extraíble)";
    })
  );
  return texts;
}

export async function renderPdfPagesToPng(
  buffer: Buffer
): Promise<{ pageNumber: number; content: Buffer }[]> {
  const pages = await pdfToPng(buffer, {
    viewportScale: 1.25,
    returnPageContent: true,
    disableFontFace: true,
    processPagesInParallel: true,
    concurrencyLimit: 4,
  });
  return pages
    .filter((p) => p.content)
    .map((p) => ({
      pageNumber: p.pageNumber,
      content: p.content as Buffer,
    }));
}
