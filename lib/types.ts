export interface SourceRef {
  documentId: string;
  fileName: string;
  page: number;
  snippet: string;
  mediaUrl: string;
}

export type DocumentStatus = "processing" | "ready" | "error";

export interface DocumentManifest {
  documentId: string;
  fileName: string;
  mimeType: string;
  status: DocumentStatus;
  originalUrl: string;
  createdAt: string;
  pageCount?: number;
  error?: string;
}

export interface RagDataParts {
  sources: { items: SourceRef[] };
}
