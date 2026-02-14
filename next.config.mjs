/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
        pathname: "/prompt/**",
      },
      {
        protocol: "https",
        hostname: "**.fal.media",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      "@clerk/nextjs",
      "lucide-react",
      "framer-motion",
      "recharts",
    ],
  },
};

export default nextConfig;
