import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The no-DB fallback in src/lib/rag.ts reads data/npc-corp/*.md at runtime with fs.
  // Vercel's serverless tracing won't include those files unless we say so here,
  // so Company-knowledge answers would fail in production without this.
  outputFileTracingIncludes: {
    "/api/ask": ["./data/**/*"],
    "/api/webhook": ["./data/**/*"],
  },
};

export default nextConfig;
