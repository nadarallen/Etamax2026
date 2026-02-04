import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: 'standalone',
  generateBuildId: async () => {
    // Return a constant ID to ensure all replicas share the same build ID
    // This avoids "Failed to find Server Action" errors when load balancing
    return 'production-build-v1';
  },
};


export default nextConfig;

// Trigger restart
