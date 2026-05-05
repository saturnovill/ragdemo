"use client";

import { Fragment } from "react";

const CITATION_RE = /\[#(\d+)\]/g;

export function AssistantTextWithCitations({
  text,
  onCitationClick,
}: {
  text: string;
  onCitationClick: (n: number) => void;
}) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  const re = new RegExp(CITATION_RE.source, "g");
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(
        <Fragment key={`t-${key++}`}>{text.slice(last, m.index)}</Fragment>
      );
    }
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n) && n >= 1) {
      nodes.push(
        <button
          key={`c-${key++}-${m.index}`}
          type="button"
          className="inline align-baseline font-medium text-primary underline decoration-primary/60 underline-offset-2 hover:text-primary/85 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          onClick={() => onCitationClick(n)}
          aria-label={`Abrir vista previa de la fuente número ${n}`}
        >
          [#{n}]
        </button>
      );
    } else {
      nodes.push(<Fragment key={`raw-${key++}`}>{m[0]}</Fragment>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    nodes.push(<Fragment key={`t-${key++}`}>{text.slice(last)}</Fragment>);
  }
  return <>{nodes}</>;
}
