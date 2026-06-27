import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@supabase/realtime-js", "y-supabase"],
};

export default nextConfig;
