import { BLOB_PREFIX } from "@/lib/constants";

/** URL relativa que sirve el blob vía `/api/media` (store privado). */
export function mediaProxyUrl(pathname: string): string {
  return `/api/media?pathname=${encodeURIComponent(pathname)}`;
}

export function isAllowedBlobPathname(pathname: string): boolean {
  if (!pathname || pathname.includes("..")) return false;
  return pathname.startsWith(`${BLOB_PREFIX}/`);
}
