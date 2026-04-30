const DEFAULT_MAX = 3200;
const DEFAULT_OVERLAP = 400;

export function chunkText(
  text: string,
  maxChars = DEFAULT_MAX,
  overlap = DEFAULT_OVERLAP
): string[] {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return [];
  const chunks: string[] = [];
  let i = 0;
  while (i < t.length) {
    const end = Math.min(i + maxChars, t.length);
    const piece = t.slice(i, end).trim();
    if (piece) chunks.push(piece);
    if (end >= t.length) break;
    i = Math.max(end - overlap, i + 1);
  }
  return chunks;
}
