import type { VercelConfig } from "@vercel/config/v1";

export const config = {
  framework: "nextjs",
  functions: {
    "app/api/**/*.ts": {
      maxDuration: 300,
    },
  },
} satisfies VercelConfig;
