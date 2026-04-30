import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdfjs-dist",
    "pdf-to-png-converter",
    "@napi-rs/canvas",
    "@google/genai",
  ],
};

export default nextConfig;
