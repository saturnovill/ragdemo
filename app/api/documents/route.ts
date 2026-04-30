import { list, del, get } from "@vercel/blob";
import { getIndex } from "@/lib/pinecone";
import { BLOB_PREFIX } from "@/lib/constants";

export const runtime = "nodejs";

export async function GET() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return Response.json({ error: "Missing BLOB_READ_WRITE_TOKEN" }, { status: 500 });
  }

  const { blobs } = await list({ prefix: `${BLOB_PREFIX}/`, token });
  const manifests = blobs.filter((b) =>
    b.pathname.endsWith("/manifest.json")
  );

  const out = await Promise.all(
    manifests.map(async (b) => {
      try {
        const res = await get(b.pathname, { access: "private", token });
        if (!res || res.statusCode !== 200 || !res.stream) return null;
        const text = await new Response(res.stream).text();
        return JSON.parse(text) as unknown;
      } catch {
        return null;
      }
    })
  );

  return Response.json({
    documents: out.filter(Boolean),
  });
}

export async function DELETE(req: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return Response.json({ error: "Missing BLOB_READ_WRITE_TOKEN" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("id");
  if (!documentId) {
    return Response.json({ error: "id requerido" }, { status: 400 });
  }

  const prefix = `${BLOB_PREFIX}/${documentId}/`;
  const { blobs } = await list({ prefix, token });
  for (const b of blobs) {
    await del(b.url, { token });
  }

  const index = await getIndex();
  await index.deleteMany({
    filter: { documentId: { $eq: documentId } },
  });

  return Response.json({ ok: true });
}
