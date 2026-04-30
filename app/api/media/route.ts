import { get } from "@vercel/blob";
import { isAllowedBlobPathname } from "@/lib/blob-media";

export const runtime = "nodejs";

/**
 * Sirve blobs de un store **privado** usando BLOB_READ_WRITE_TOKEN en el servidor.
 */
export async function GET(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return new Response("Missing BLOB_READ_WRITE_TOKEN", { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const pathname = searchParams.get("pathname");
  if (!pathname || !isAllowedBlobPathname(pathname)) {
    return new Response("Invalid pathname", { status: 400 });
  }

  const result = await get(pathname, { access: "private", token });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return new Response("Not found", { status: 404 });
  }

  const contentType =
    result.blob.contentType ?? "application/octet-stream";

  return new Response(result.stream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
    },
  });
}
