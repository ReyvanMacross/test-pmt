/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Public document uploads allow up to 10 MB; leave room for multipart overhead.
      bodySizeLimit: '12mb',
    },
  },
};

export default nextConfig;
