import type { NextConfig } from "next";

const apiOrigin =
  process.env.API_ORIGIN ?? "https://amctag-my-school.38f0fz.easypanel.host";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["amctag-admin-school.38f0fz.easypanel.host"],
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${apiOrigin}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
