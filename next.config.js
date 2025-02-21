/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/success1', destination: 'https://roughdiamonds.io/mint-ok' },
    ];
  },
  images: {
    domains: ['ipfs.io'],
  },
}

module.exports = nextConfig
