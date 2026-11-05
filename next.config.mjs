/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Admin imports upload files of up to 1 MB through a server action. The default limit is exactly 1 MB, which multipart overhead exceeds.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  // samai-sdk lazily imports optional provider SDKs (Bedrock, Redis, ...). Load it from node_modules at runtime
  // instead of bundling it, so providers that are not installed never break the build.
  serverExternalPackages: ["samai-sdk", "openai", "@anthropic-ai/sdk", "@google/generative-ai"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default nextConfig;
