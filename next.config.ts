import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Production-ready configuration for Vercel deployment */
  
  // Optimize images
  images: {
    unoptimized: true, // Disable Image Optimization for serverless
  },

  // Ensure standalone build for Vercel
  output: "standalone",

  // Allow local dev origins
  allowedDevOrigins: ["192.168.29.252"],

  // Disable source maps in production to reduce bundle size
  productionBrowserSourceMaps: false,

  // Headers for Vercel deployment
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
