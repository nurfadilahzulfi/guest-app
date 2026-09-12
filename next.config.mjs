/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.161", "localhost", "127.0.0.1"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
