/** Prefix for all blobs in this app */
export const BLOB_PREFIX = "ragdemo/documents";

export function documentPrefix(documentId: string) {
  return `${BLOB_PREFIX}/${documentId}`;
}
