import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['@livekit/components-react', '@livekit/components-styles'],
  },
  
  // Skip type checking during build for hackathon
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Skip ESLint during build for hackathon  
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Add headers for CORS
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
};

export default nextConfig;
