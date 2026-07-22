import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow hot-reloading over the ngrok tunnel
  allowedDevOrigins: ["daycare-cognition-baton.ngrok-free.dev"],
};

export default nextConfig;