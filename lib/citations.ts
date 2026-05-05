/** Referencias del modelo del tipo [#1], [#2], … alineadas al índice del contexto (1-based). */
const CITATION_RE = /\[#(\d+)\]/g;

/** Números de cita en orden de primera aparición en el texto. */
export function citationNumbersInOrder(text: string): number[] {
  const seen = new Set<number>();
  const order: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(CITATION_RE.source, "g");
  while ((m = re.exec(text)) !== null) {
    const n = Number.parseInt(m[1], 10);
    if (!Number.isFinite(n) || n < 1) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    order.push(n);
  }
  return order;
}
