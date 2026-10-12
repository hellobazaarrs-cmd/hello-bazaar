/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  compress: true,
  swcMinify: true,
  reactStrictMode: false,
  productionBrowserSourceMaps: false,
  experimental: {
    workerThreads: false,
    cpus: 2,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    domains: [
      'res.cloudinary.com',
      'storage.googleapis.com',
      'm.media-amazon.com',
      'pisces.bbystatic.com',
      'oasis.opstatics.com',
      'images.unsplash.com',
      'cdn.abacus.ai',
      'd1ncau8tqf99kp.cloudfront.net',
    ]
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
