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

El proyecto está enlazado con **Vercel ↔ GitHub**: cada `git push` a **`main`** dispara un deploy de producción; los **pull requests** pueden generar **preview deployments** según la configuración del proyecto en Vercel.

Si enlazas otro clon desde cero: en [Vercel](https://vercel.com) → proyecto **ragdemo** → **Settings → Git** → conecta `saturnovill/ragdemo`. Si GitHub no muestra el repo, revisa **Settings → Applications → Vercel** y el acceso al repositorio.

### Despliegue manual (CLI)

```bash
vercel link
vercel env pull .env.local --yes   # opcional, tras configurar env en dashboard
vercel deploy --prod
```

El índice Pinecone se crea automáticamente si no existe (serverless AWS `us-east-1`, cosine, 1536 dimensiones).

## Seguridad

No commitees `.env.local` ni pegues API keys en issues. Rota las claves si se han expuesto.
