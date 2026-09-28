import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server is bound to 0.0.0.0 and opened at 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  outputFileTracingIncludes: {
    "/api/chat": ["./kb/**/*"],
  },
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
