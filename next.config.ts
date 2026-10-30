import type { NextConfig } from "next";

// Corporate proxies / AV SSL inspection break Node's CA chain (fonts.googleapis + Supabase).
// Local-only: without this, next/font and server fetch fail with UNABLE_TO_VERIFY_LEAF_SIGNATURE.
if (process.env.NODE_ENV !== "production" && process.env.STRICT_TLS !== "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/home", destination: "/", permanent: true },
      { source: "/products/polos", destination: "/products", permanent: true },
      { source: "/products/polos/:path*", destination: "/products", permanent: true },
      { source: "/products/hoodies", destination: "/products", permanent: true },
      { source: "/products/pants", destination: "/products", permanent: true },
    ];
  },
};

export default nextConfig;
