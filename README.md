# RAG Demo (Next.js + Pinecone + Gemini)

Dashboard para subir documentos (PDF, imágenes, TXT/MD) a **Vercel Blob**, indexarlos en **Pinecone** con **Gemini Embedding 2** (`gemini-embedding-2`, dimensión 1536) y chatear con **Gemini 3 Flash Preview** (`gemini-3-flash-preview`). Cada chunk guarda la URL de la captura de página o imagen original para mostrarla en el panel de fuentes.

## Requisitos

- Node.js **22.13+** o **24+** (pdfjs-dist / pdf-to-png-converter).
- Cuenta [Pinecone](https://app.pinecone.io), [Google AI Studio](https://aistudio.google.com/apikey), y un store de [Vercel Blob](https://vercel.com/docs/vercel-blob) (puede ser **privado**: la app sube con `access: 'private'` y expone archivos vía `/api/media?pathname=...`).

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

| Variable | Descripción |
|----------|-------------|
| `PINECONE_API_KEY` | API key de Pinecone |
| `PINECONE_INDEX` | Nombre del índice (default: `ragdemo`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | API key de Google AI Studio |
| `BLOB_READ_WRITE_TOKEN` | Token de lectura/escritura de Vercel Blob |

En Vercel: **Project → Settings → Environment Variables** (Production, Preview, Development) y luego `vercel env pull .env.local`.

## Desarrollo

```bash
npm install
npm run dev
```

## Repositorio y despliegue automático

Código en GitHub: **https://github.com/saturnovill/ragdemo**

### Opción A — Integración nativa Vercel ↔ GitHub (recomendada)

1. En [Vercel](https://vercel.com) abre el proyecto **ragdemo** (el que ya enlazaste con `vercel link`).
2. **Settings → Git** → **Connect Git Repository** → elige `saturnovill/ragdemo` y la rama **main**.
3. Si falla la conexión, en GitHub ve a **Settings → Applications → Vercel** y concede acceso al repositorio `ragdemo`.

Con eso, cada `git push` a `main` dispara un deploy de producción (y los PRs pueden tener previews si lo activas en el proyecto).

### Opción B — GitHub Actions

Si prefieres no conectar el repo en el dashboard, el workflow [`.github/workflows/deploy-vercel.yml`](.github/workflows/deploy-vercel.yml) despliega con `vercel build` + `vercel deploy --prebuilt` en cada push a `main`.

Crea en el repo de GitHub **Settings → Secrets and variables → Actions** estos secretos:

| Secreto | Dónde obtenerlo |
|---------|------------------|
| `VERCEL_TOKEN` | [Vercel → Account → Tokens](https://vercel.com/account/tokens) → Create |
| `VERCEL_ORG_ID` | En la carpeta local `.vercel/project.json` → campo `orgId` (o `vercel whoami` / team en el dashboard) |
| `VERCEL_PROJECT_ID` | En `.vercel/project.json` → campo `projectId` |

Tras guardar los secretos, un push a `main` ejecutará el workflow.

### Despliegue manual (CLI)

```bash
vercel link
vercel env pull .env.local --yes   # opcional, tras configurar env en dashboard
vercel deploy --prod
```

El índice Pinecone se crea automáticamente si no existe (serverless AWS `us-east-1`, cosine, 1536 dimensiones).

## Seguridad

No commitees `.env.local` ni pegues API keys en issues. Rota las claves si se han expuesto.
