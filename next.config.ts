import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ["192.168.101.11", "40d8-209-14-109-58.ngrok-free.app"],
};

export default nextConfig;
