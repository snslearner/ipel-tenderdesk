import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The sign-in page lives at "/". Old /login links go there for everyone.
  async redirects() {
    return [{ source: "/login", destination: "/", permanent: false }];
  },
};

export default nextConfig;
