import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_DIM = 1536;
const INDEX_REGION = "us-east-1";

let pinecone: Pinecone | null = null;

export function getPinecone(): Pinecone {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("Missing PINECONE_API_KEY");
  }
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }
  return pinecone;
}

export function getIndexName(): string {
  return process.env.PINECONE_INDEX ?? "ragdemo";
}

export async function ensureRagIndex(): Promise<void> {
  const pc = getPinecone();
  const name = getIndexName();
  const list = await pc.listIndexes();
  const exists = list.indexes?.some((i) => i.name === name);
  if (exists) return;

  await pc.createIndex({
    name,
    dimension: INDEX_DIM,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: INDEX_REGION,
      },
    },
  });

  // Wait until index is ready
  for (let i = 0; i < 60; i++) {
    const desc = await pc.describeIndex(name);
    if (desc.status?.ready) return;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Pinecone index did not become ready in time");
}

export async function getIndex() {
  await ensureRagIndex();
  const pc = getPinecone();
  return pc.index(getIndexName());
}
